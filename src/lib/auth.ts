import { User } from '../types';

export const APP_ROUTES = [
    { path: '/dashboard', permission: 'reports:view' },
    { path: '/sales', permission: 'sales:create' },
    { path: '/history', permission: 'sales:read' },
    { path: '/inventory', permission: 'products:read' },
    { path: '/purchases', permission: 'products:manage' },
    { path: '/expenses', permission: 'expenses:manage' },
    { path: '/loyalty', permission: 'clients:read' },
    { path: '/cash-flow', permission: 'cashflow:view' },
    { path: '/clients', permission: 'clients:read' },
    { path: '/users', permission: 'users:manage' },
    { path: '/roles', permission: 'users:manage' },
    { path: '/reports', permission: 'reports:view' },
    { path: '/settings', permission: 'settings:manage' }
];

export const hasPermission = (user: User | null, requiredPermission?: string): boolean => {
    if (!user) return false;
    if (!requiredPermission) return true; // Public if no permission required

    if (user.role === 'admin') return true;
    if (user.permissions?.includes('*')) return true;

    return user.permissions?.includes(requiredPermission as any) || false;
};

export const getFirstAllowedRoute = (user: User | null): string => {
    if (!user) return '/login';

    // Check routes in order
    for (const route of APP_ROUTES) {
        if (hasPermission(user, route.permission)) {
            return route.path;
        }
    }

    // Fallback if no permissions at all (shouldn't happen ideally)
    return '/login';
};
