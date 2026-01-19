import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Button } from '../components/ui/button';
import { 
    LayoutDashboard, 
    Users, 
    Sparkles, 
    UserCircle, 
    FileText, 
    LogOut,
    Menu,
    X
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';

const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/discover', label: 'AI Discovery', icon: Sparkles },
    { path: '/leads', label: 'Leads', icon: Users },
    { path: '/contacts', label: 'Contacts', icon: UserCircle },
    { path: '/templates', label: 'Templates', icon: FileText },
];

export default function Layout({ children }) {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Sidebar - Desktop */}
            <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900 text-white p-6 hidden lg:flex flex-col z-50">
                {/* Logo */}
                <div className="flex items-center gap-3 mb-10">
                    <div className="w-10 h-10 rounded-xl bg-lime-500 flex items-center justify-center">
                        <Users className="w-5 h-5 text-slate-900" />
                    </div>
                    <span className="text-xl font-heading font-bold tracking-tight">
                        SPINMR<span className="text-lime-500">Lead</span>
                    </span>
                </div>

                {/* Nav Items */}
                <nav className="flex-1 space-y-2">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path || 
                            (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                                    isActive 
                                        ? 'bg-lime-500 text-slate-900 font-medium' 
                                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                )}
                                data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                            >
                                <item.icon className="w-5 h-5" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Section */}
                <div className="pt-6 border-t border-slate-700">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                            <span className="text-sm font-medium">
                                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user?.name}</p>
                            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <Button 
                        variant="ghost" 
                        className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800"
                        onClick={handleLogout}
                        data-testid="logout-btn"
                    >
                        <LogOut className="w-4 h-4 mr-3" />
                        Sign out
                    </Button>
                </div>
            </aside>

            {/* Mobile Header */}
            <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 text-white flex items-center justify-between px-4 z-50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-lime-500 flex items-center justify-center">
                        <Users className="w-4 h-4 text-slate-900" />
                    </div>
                    <span className="text-lg font-heading font-bold">
                        SPINMR<span className="text-lime-500">Lead</span>
                    </span>
                </div>
                <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    data-testid="mobile-menu-btn"
                >
                    {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </Button>
            </header>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="lg:hidden fixed inset-0 top-16 bg-slate-900 z-40 p-4">
                    <nav className="space-y-2">
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={cn(
                                        'flex items-center gap-3 px-4 py-3 rounded-lg',
                                        isActive 
                                            ? 'bg-lime-500 text-slate-900 font-medium' 
                                            : 'text-slate-300'
                                    )}
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                    <div className="absolute bottom-4 left-4 right-4">
                        <Button 
                            variant="ghost" 
                            className="w-full justify-start text-slate-300"
                            onClick={handleLogout}
                        >
                            <LogOut className="w-4 h-4 mr-3" />
                            Sign out
                        </Button>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
                <div className="max-w-7xl mx-auto p-6 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
