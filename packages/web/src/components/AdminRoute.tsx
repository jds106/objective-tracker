import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/auth.context.js';

export function AdminRoute() {
    const { isAdmin, isLoading } = useAuth();

    if (isLoading) return null;
    if (!isAdmin) return <Navigate to="/dashboard" replace />;
    return <Outlet />;
}
