import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import { Toaster } from './components/ui/sonner';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import LeadDetail from './pages/LeadDetail';
import Discover from './pages/Discover';
import Contacts from './pages/Contacts';
import Templates from './pages/Templates';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-500"></div>
            </div>
        );
    }
    
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    
    return <Layout>{children}</Layout>;
};

// Public Route (redirect to dashboard if logged in)
const PublicRoute = ({ children }) => {
    const { user, loading } = useAuth();
    
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-500"></div>
            </div>
        );
    }
    
    if (user) {
        return <Navigate to="/dashboard" replace />;
    }
    
    return children;
};

function AppRoutes() {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
            
            {/* Protected Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/discover" element={<ProtectedRoute><Discover /></ProtectedRoute>} />
            <Route path="/leads" element={<ProtectedRoute><Leads /></ProtectedRoute>} />
            <Route path="/leads/:id" element={<ProtectedRoute><LeadDetail /></ProtectedRoute>} />
            <Route path="/contacts" element={<ProtectedRoute><Contacts /></ProtectedRoute>} />
            <Route path="/templates" element={<ProtectedRoute><Templates /></ProtectedRoute>} />
            
            {/* Redirect root to dashboard or login */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* 404 - redirect to dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
                <Toaster position="top-right" richColors />
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
