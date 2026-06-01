import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [refreshTriggers, setRefreshTriggers] = useState({
    dashboard: 0,
    invoices: 0,
    inventory: 0,
    clients: 0,
    payments: 0,
    staff: 0,
    settings: 0,
    activity: 0
  });

  useEffect(() => {
    if (!user || !user.companyId) return;

    const newSocket = io(window.location.origin, {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      newSocket.emit('join:company', user.companyId);
    });

    newSocket.on('dashboard:updated', () => {
      setRefreshTriggers(prev => ({ ...prev, dashboard: prev.dashboard + 1 }));
    });

    newSocket.on('invoices:updated', () => {
      setRefreshTriggers(prev => ({ ...prev, invoices: prev.invoices + 1 }));
    });

    newSocket.on('inventory:updated', () => {
      setRefreshTriggers(prev => ({ ...prev, inventory: prev.inventory + 1 }));
    });

    newSocket.on('clients:updated', () => {
      setRefreshTriggers(prev => ({ ...prev, clients: prev.clients + 1 }));
    });

    newSocket.on('payments:updated', () => {
      setRefreshTriggers(prev => ({ ...prev, payments: prev.payments + 1 }));
    });

    newSocket.on('staff:updated', () => {
      setRefreshTriggers(prev => ({ ...prev, staff: prev.staff + 1 }));
    });

    newSocket.on('settings:updated', () => {
      setRefreshTriggers(prev => ({ ...prev, settings: prev.settings + 1 }));
    });

    newSocket.on('activity:new', (data) => {
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
          style: { background: '#fef9c3', color: '#92400e', border: '1px solid #fde68a' }
        });
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit('leave:company', user.companyId);
      newSocket.disconnect();
    };
  }, [user?.companyId]);

  return (
    <SocketContext.Provider value={{ socket, refreshTriggers }}>
      {children}
    </SocketContext.Provider>
  );
};
