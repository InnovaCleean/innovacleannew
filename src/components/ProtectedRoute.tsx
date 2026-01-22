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
            const fallback = user.role === 'admin' ? '/dashboard' : '/sales';
            // Prevent infinite loop if fallback is the current page or if user can't even access fallback
            if (location.pathname === fallback) {
                return (
                    <div className="min-h-screen flex items-center justify-center bg-slate-100">
                        <div className="text-center p-8 bg-white rounded-xl shadow-lg">
                            <h1 className="text-2xl font-bold text-red-600 mb-2">Acceso Denegado</h1>
                            <p className="text-slate-600">No tienes permisos para ver esta sección.</p>
                            <button
                                onClick={() => window.location.href = '/login'}
                                className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                            >
                                Volver al Inicio
                            </button>
                        </div>
                    </div>
                );
            }
            return <Navigate to={fallback} replace />;
        }
    }

    return <>{children}</>;
};
