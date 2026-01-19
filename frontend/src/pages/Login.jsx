import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { Users, Sparkles } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(email, password);
            toast.success('Welcome back!');
            navigate('/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 hero-glow pointer-events-none" />
            
            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-8 animate-fadeIn">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-900 mb-4">
                        <Users className="w-8 h-8 text-lime-500" />
                    </div>
                    <h1 className="text-3xl font-heading font-bold text-slate-900 tracking-tight">
                        SPINMR<span className="text-lime-500">Lead</span>
                    </h1>
                    <p className="text-slate-600 mt-2">SPINMR LLC - HR Services Lead Generation</p>
                </div>

                <Card className="border-slate-200 shadow-xl animate-fadeIn stagger-1">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-heading">Sign in</CardTitle>
                        <CardDescription>
                            Enter your credentials to access your dashboard
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    data-testid="login-email-input"
                                    className="focus-visible:ring-lime-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    data-testid="login-password-input"
                                    className="focus-visible:ring-lime-500"
                                />
                            </div>
                            <Button 
                                type="submit" 
                                className="w-full btn-primary"
                                disabled={loading}
                                data-testid="login-submit-btn"
                            >
                                {loading ? 'Signing in...' : 'Sign in'}
                            </Button>
                        </form>
                        
                        <div className="mt-6 text-center text-sm">
                            <span className="text-slate-600">Don't have an account? </span>
                            <Link 
                                to="/register" 
                                className="text-lime-600 hover:text-lime-700 font-medium"
                                data-testid="register-link"
                            >
                                Sign up
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-500 animate-fadeIn stagger-2">
                    <Sparkles className="w-4 h-4 text-lime-500" />
                    <span>AI-powered lead discovery</span>
                </div>
            </div>
        </div>
    );
}
