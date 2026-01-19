import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { leadsAPI } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { getStatusColor, getStatusLabel, formatDate } from '../lib/utils';
import { 
    Users, 
    Target, 
    TrendingUp, 
    CheckCircle2, 
    Plus,
    ArrowRight,
    Sparkles,
    Building2
} from 'lucide-react';
import { toast } from 'sonner';

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [recentLeads, setRecentLeads] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [statsRes, leadsRes] = await Promise.all([
                leadsAPI.getStats(),
                leadsAPI.getAll()
            ]);
            setStats(statsRes.data);
            setRecentLeads(leadsRes.data.slice(0, 5));
        } catch (error) {
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        { 
            label: 'Total Leads', 
            value: stats?.total || 0, 
            icon: Users, 
            color: 'text-slate-900',
            bgColor: 'bg-slate-100'
        },
        { 
            label: 'Qualified', 
            value: stats?.qualified || 0, 
            icon: Target, 
            color: 'text-purple-600',
            bgColor: 'bg-purple-100'
        },
        { 
            label: 'In Proposal', 
            value: stats?.proposal || 0, 
            icon: TrendingUp, 
            color: 'text-orange-600',
            bgColor: 'bg-orange-100'
        },
        { 
            label: 'Won', 
            value: stats?.won || 0, 
            icon: CheckCircle2, 
            color: 'text-lime-600',
            bgColor: 'bg-lime-100'
        },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8" data-testid="dashboard-page">
            {/* Welcome Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-slate-900 tracking-tight">
                        Dashboard
                    </h1>
                    <p className="text-slate-600 mt-1">
                        Track your HR service leads and discover new opportunities
                    </p>
                </div>
                <div className="flex gap-3">
                    <Link to="/discover">
                        <Button className="btn-accent gap-2" data-testid="discover-btn">
                            <Sparkles className="w-4 h-4" />
                            AI Discovery
                        </Button>
                    </Link>
                    <Link to="/leads">
                        <Button variant="outline" className="gap-2" data-testid="add-lead-btn">
                            <Plus className="w-4 h-4" />
                            Add Lead
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, index) => (
                    <Card 
                        key={stat.label} 
                        className="card-hover border-slate-200 animate-fadeIn"
                        style={{ animationDelay: `${index * 0.05}s` }}
                        data-testid={`stat-card-${stat.label.toLowerCase().replace(' ', '-')}`}
                    >
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">
                                        {stat.label}
                                    </p>
                                    <p className="text-3xl font-heading font-bold text-slate-900 mt-1 tabular-nums">
                                        {stat.value}
                                    </p>
                                </div>
                                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Pipeline Overview */}
            <Card className="border-slate-200" data-testid="pipeline-overview">
                <CardHeader>
                    <CardTitle className="font-heading">Pipeline Overview</CardTitle>
                    <CardDescription>Your leads at each stage</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-3">
                        {['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'].map((status) => (
                            <Link 
                                key={status} 
                                to={`/leads?status=${status}`}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                                data-testid={`pipeline-${status}`}
                            >
                                <div className={`w-2 h-2 rounded-full ${getStatusColor(status)}`} />
                                <span className="font-medium text-slate-700">
                                    {getStatusLabel(status)}
                                </span>
                                <span className="text-slate-500 tabular-nums">
                                    {stats?.[status] || 0}
                                </span>
                            </Link>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Recent Leads */}
            <Card className="border-slate-200" data-testid="recent-leads">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="font-heading">Recent Leads</CardTitle>
                        <CardDescription>Your latest lead additions</CardDescription>
                    </div>
                    <Link to="/leads">
                        <Button variant="ghost" size="sm" className="gap-1">
                            View all
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    </Link>
                </CardHeader>
                <CardContent>
                    {recentLeads.length === 0 ? (
                        <div className="text-center py-12">
                            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-600 mb-4">No leads yet</p>
                            <Link to="/discover">
                                <Button className="btn-accent gap-2">
                                    <Sparkles className="w-4 h-4" />
                                    Start Discovering
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {recentLeads.map((lead, index) => (
                                <Link
                                    key={lead.id}
                                    to={`/leads/${lead.id}`}
                                    className="flex items-center justify-between p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors animate-fadeIn"
                                    style={{ animationDelay: `${index * 0.05}s` }}
                                    data-testid={`recent-lead-${lead.id}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center">
                                            <Building2 className="w-5 h-5 text-slate-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900">
                                                {lead.company_name}
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                {lead.industry || 'No industry'} · {formatDate(lead.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge 
                                        variant="secondary"
                                        className={`${getStatusColor(lead.status)} text-white`}
                                    >
                                        {getStatusLabel(lead.status)}
                                    </Badge>
                                </Link>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
