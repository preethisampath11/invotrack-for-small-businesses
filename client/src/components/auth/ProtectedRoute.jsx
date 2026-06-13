import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import FullScreenLoader from '../FullScreenLoader';

const ProtectedRoute = ({ children, adminOnly }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <FullScreenLoader />;
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (user && !user.hasPassword) {
    return <Navigate to="/set-password" replace />;
  }

  if (user.status === 'pending') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f8faf9', padding: '20px' }}>
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center', maxWidth: '440px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#fef9c3', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '16px' }}>⏳</div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: '#0f172a' }}>Account Pending Approval</h2>
          <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.6 }}>Your account is waiting for admin approval. You will be able to access the system once approved.</p>
        </div>
      </div>
    );
  }

  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return children;
};

export default ProtectedRoute;
