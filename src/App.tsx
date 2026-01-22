import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Sales from './pages/Sales';
import History from './pages/History';
import Inventory from './pages/Inventory';
import Purchases from './pages/Purchases';
import Users from './pages/Users';
import Roles from './pages/Roles';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Clients from './pages/Clients';
import Expenses from './pages/Expenses';
import Loyalty from './pages/Loyalty';
import CashFlow from './pages/CashFlow';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useStore } from './store/useStore';
import { useEffect } from 'react';
import { THEMES } from './lib/themes';

function App() {
    const fetchInitialData = useStore(state => state.fetchInitialData);
    const settings = useStore(state => state.settings);

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (settings.companyName) {
            document.title = settings.companyName;
        }
        if (settings.logo) {
            let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
            if (!link) {
                link = document.createElement('link');
                link.rel = 'shortcut icon';
                document.head.appendChild(link);
            }
            link.href = settings.logo;
        }

        // Apply Theme
        const theme = THEMES.find(t => t.id === settings.themeId) || THEMES[0];
        const root = document.documentElement;
        Object.entries(theme.colors).forEach(([shade, value]) => {
            root.style.setProperty(`--color-primary-${shade}`, value);
        });

    }, [settings.companyName, settings.logo, settings.themeId]);

    return (

        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />

                <Route path="/dashboard" element={
                    <ProtectedRoute requiredPermission="reports:view">
                        <Dashboard />
                    </ProtectedRoute>
                } />

                <Route path="/purchases" element={
                    <ProtectedRoute requiredPermission="products:manage">
                        <Purchases />
                    </ProtectedRoute>
                } />

                <Route path="/users" element={
                    <ProtectedRoute requiredPermission="users:manage">
                        <Users />
                    </ProtectedRoute>
                } />

                <Route path="/roles" element={
                    <ProtectedRoute requiredPermission="users:manage">
                        <Roles />
                    </ProtectedRoute>
                } />

                <Route path="/reports" element={
                    <ProtectedRoute requiredPermission="reports:view">
                        <Reports />
                    </ProtectedRoute>
                } />

                <Route path="/clients" element={
                    <ProtectedRoute requiredPermission="clients:read">
                        <Clients />
                    </ProtectedRoute>
                } />

                <Route path="/settings" element={
                    <ProtectedRoute requiredPermission="settings:manage">
                        <Settings />
                    </ProtectedRoute>
                } />

                <Route path="/sales" element={
                    <ProtectedRoute requiredPermission="sales:create">
                        <Sales />
                    </ProtectedRoute>
                } />

                <Route path="/history" element={
                    <ProtectedRoute requiredPermission="sales:read">
                        <History />
                    </ProtectedRoute>
                } />

                <Route path="/inventory" element={
                    <ProtectedRoute requiredPermission="products:read">
                        <Inventory />
                    </ProtectedRoute>
                } />

                <Route path="/expenses" element={
                    <ProtectedRoute requiredPermission="expenses:manage">
                        <Expenses />
                    </ProtectedRoute>
                } />

                <Route path="/loyalty" element={
                    <ProtectedRoute requiredPermission="clients:read">
                        <Loyalty />
                    </ProtectedRoute>
                } />

                <Route path="/cash-flow" element={
                    <ProtectedRoute requiredPermission="cashflow:view">
                        <CashFlow />
                    </ProtectedRoute>
                } />

                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
