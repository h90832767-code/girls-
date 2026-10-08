import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { Spinner } from '../ui/Spinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  // 1. Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f]">
        <Spinner size="lg" label="Verifying security credentials..." />
      </div>
    );
  }

  // 2. Unauthenticated check
  if (!user || !role) {
    const isTargetAdmin = location.pathname.startsWith('/admin');
    const isTargetTeacher = location.pathname.startsWith('/teacher');
    const isTargetParent = location.pathname.startsWith('/parent');
    const roleParam = isTargetAdmin ? '?role=admin' : isTargetTeacher ? '?role=teacher' : isTargetParent ? '?role=parent' : '';
    return <Navigate to={`/login${roleParam}`} state={{ from: location }} replace />;
  }

  // 3. Unauthorized role check
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    // Redirect to user's assigned dashboard
    const dashboardRoute = `/${role}/dashboard`;
    return <Navigate to={dashboardRoute} replace />;
  }

  return <>{children}</>;
};
