import { Navigate, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Permission } from '../types';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredPermission?: Permission; // Changed from allowedRoles
    allowedRoles?: string[]; // Deprecated but kept for fallback or specific edge cases if needed (optional)
}

export const ProtectedRoute = ({ children, requiredPermission }: ProtectedRouteProps) => {
    const user = useStore((state) => state.user);
    const location = useLocation();

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (requiredPermission) {
        let hasAccess = false;
        // 1. Admin Role Override
        if (user.role === 'admin') hasAccess = true;
        // 2. Super Admin Permission
        else if (user.permissions?.includes('*')) hasAccess = true;
        // 3. Specific Permission
        else if (user.permissions?.includes(requiredPermission)) hasAccess = true;

        if (!hasAccess) {
            return <Navigate to="/dashboard" replace />;
        }
    }

    return <>{children}</>;
};
