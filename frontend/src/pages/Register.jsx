import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { Users, Sparkles } from 'lucide-react';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }
        setLoading(true);
        try {
            await register(name, email, password);
            toast.success('Account created successfully!');
            navigate('/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Registration failed');
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
                    <p className="text-slate-600 mt-2">SPINMR LLC - Start finding HR service clients</p>
                </div>

                <Card className="border-slate-200 shadow-xl animate-fadeIn stagger-1">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-heading">Create account</CardTitle>
                        <CardDescription>
                            Enter your details to get started
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    data-testid="register-name-input"
                                    className="focus-visible:ring-lime-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    data-testid="register-email-input"
                                    className="focus-visible:ring-lime-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="At least 6 characters"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    data-testid="register-password-input"
                                    className="focus-visible:ring-lime-500"
                                />
                            </div>
                            <Button 
                                type="submit" 
                                className="w-full btn-primary"
                                disabled={loading}
                                data-testid="register-submit-btn"
                            >
                                {loading ? 'Creating account...' : 'Create account'}
                            </Button>
                        </form>
                        
                        <div className="mt-6 text-center text-sm">
                            <span className="text-slate-600">Already have an account? </span>
                            <Link 
                                to="/login" 
                                className="text-lime-600 hover:text-lime-700 font-medium"
                                data-testid="login-link"
                            >
                                Sign in
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
