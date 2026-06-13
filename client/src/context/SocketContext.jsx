import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import { queryKeys } from '../lib/queryKeys';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [socket, setSocket] = useState(null);

  /**
   * refreshTriggers is kept for pages not yet migrated to TanStack Query
   * (ClientsPage, PaymentsPage, InventoryPage, StaffPage, SettingsPage).
   * Migrated pages (Dashboard, InvoicesPage) use queryClient.invalidateQueries
   * directly, which is more precise and avoids unnecessary re-renders.
   */
  const [refreshTriggers, setRefreshTriggers] = useState({
    dashboard: 0,
    invoices: 0,
    inventory: 0,
    clients: 0,
    payments: 0,
    staff: 0,
    settings: 0,
    activity: 0,
  });

  useEffect(() => {
    if (!user || !user.companyId) return;

    const apiUrl = import.meta.env.VITE_API_URL;
    const socketUrl = apiUrl ? apiUrl.replace(/\/api$/, '') : window.location.origin;

    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      newSocket.emit('join:company', user.companyId);
    });

    newSocket.on('dashboard:updated', () => {
      // Invalidate TanStack Query caches (migrated pages)
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      // Legacy trigger for non-migrated pages
      setRefreshTriggers(prev => ({ ...prev, dashboard: prev.dashboard + 1 }));
    });

    newSocket.on('invoices:updated', () => {
      // Invalidate all invoice queries (any params combination)
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      setRefreshTriggers(prev => ({ ...prev, invoices: prev.invoices + 1 }));
    });

    newSocket.on('inventory:updated', () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.items });
      setRefreshTriggers(prev => ({ ...prev, inventory: prev.inventory + 1 }));
    });

    newSocket.on('clients:updated', () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients });
      setRefreshTriggers(prev => ({ ...prev, clients: prev.clients + 1 }));
    });

    newSocket.on('payments:updated', () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setRefreshTriggers(prev => ({ ...prev, payments: prev.payments + 1 }));
    });

    newSocket.on('staff:updated', () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.staff });
      setRefreshTriggers(prev => ({ ...prev, staff: prev.staff + 1 }));
    });

    newSocket.on('settings:updated', () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings });
      setRefreshTriggers(prev => ({ ...prev, settings: prev.settings + 1 }));
    });

    newSocket.on('activity:new', (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      setRefreshTriggers(prev => ({ ...prev, activity: prev.activity + 1 }));
      if (data?.message) {
        toast(data.message, { icon: '📋', duration: 4000 });
      }
    });

    newSocket.on('alert:inventory', (data) => {
      if (user.role === 'admin' && data?.message) {
        toast(data.message, {
          icon: '⚠️',
          duration: 6000,
          style: { background: '#fef9c3', color: '#92400e', border: '1px solid #fde68a' },
        });
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit('leave:company', user.companyId);
      newSocket.disconnect();
    };
  }, [user?.companyId, queryClient]);

  return (
    <SocketContext.Provider value={{ socket, refreshTriggers }}>
      {children}
    </SocketContext.Provider>
  );
};
