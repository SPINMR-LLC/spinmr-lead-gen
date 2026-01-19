import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { leadsAPI } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { getStatusColor, getStatusLabel, formatDate, LEAD_STATUSES, INDUSTRIES, COMPANY_SIZES } from '../lib/utils';
import { Plus, Search, Building2, Filter, MoreVertical, Trash2, Edit, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';

export default function Leads() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [newLead, setNewLead] = useState({
        company_name: '',
        industry: '',
        company_size: '',
        website: '',
        notes: ''
    });

    useEffect(() => {
        fetchLeads();
    }, [statusFilter]);

    const fetchLeads = async () => {
        setLoading(true);
        try {
            const status = statusFilter === 'all' ? undefined : statusFilter;
            const res = await leadsAPI.getAll(status);
            setLeads(res.data);
        } catch (error) {
            toast.error('Failed to load leads');
        } finally {
            setLoading(false);
        }
    };

    const handleAddLead = async () => {
        if (!newLead.company_name.trim()) {
            toast.error('Company name is required');
            return;
        }
        try {
            await leadsAPI.create(newLead);
            toast.success('Lead added successfully');
            setShowAddDialog(false);
            setNewLead({ company_name: '', industry: '', company_size: '', website: '', notes: '' });
            fetchLeads();
        } catch (error) {
            toast.error('Failed to add lead');
        }
    };

    const handleDeleteLead = async (id) => {
        if (!window.confirm('Are you sure you want to delete this lead?')) return;
        try {
            await leadsAPI.delete(id);
            toast.success('Lead deleted');
            fetchLeads();
        } catch (error) {
            toast.error('Failed to delete lead');
        }
    };

    const filteredLeads = leads.filter(lead =>
        lead.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (lead.industry && lead.industry.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleStatusFilterChange = (value) => {
        setStatusFilter(value);
        if (value === 'all') {
            searchParams.delete('status');
        } else {
            searchParams.set('status', value);
        }
        setSearchParams(searchParams);
    };

    return (
        <div className="space-y-6" data-testid="leads-page">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-slate-900 tracking-tight">
                        Leads
                    </h1>
                    <p className="text-slate-600 mt-1">
                        Manage your HR service prospects
                    </p>
                </div>
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                    <DialogTrigger asChild>
                        <Button className="btn-primary gap-2" data-testid="add-lead-btn">
                            <Plus className="w-4 h-4" />
                            Add Lead
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="font-heading">Add New Lead</DialogTitle>
                            <DialogDescription>
                                Enter the company details to add a new lead
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="company_name">Company Name *</Label>
                                <Input
                                    id="company_name"
                                    value={newLead.company_name}
                                    onChange={(e) => setNewLead({...newLead, company_name: e.target.value})}
                                    placeholder="Acme Corp"
                                    data-testid="new-lead-company-input"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="industry">Industry</Label>
                                <Select 
                                    value={newLead.industry} 
                                    onValueChange={(v) => setNewLead({...newLead, industry: v})}
                                >
                                    <SelectTrigger data-testid="new-lead-industry-select">
                                        <SelectValue placeholder="Select industry" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {INDUSTRIES.map(ind => (
                                            <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="company_size">Company Size</Label>
                                <Select 
                                    value={newLead.company_size} 
                                    onValueChange={(v) => setNewLead({...newLead, company_size: v})}
                                >
                                    <SelectTrigger data-testid="new-lead-size-select">
                                        <SelectValue placeholder="Select size" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {COMPANY_SIZES.map(size => (
                                            <SelectItem key={size} value={size}>{size}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="website">Website</Label>
                                <Input
                                    id="website"
                                    value={newLead.website}
                                    onChange={(e) => setNewLead({...newLead, website: e.target.value})}
                                    placeholder="https://example.com"
                                    data-testid="new-lead-website-input"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea
                                    id="notes"
                                    value={newLead.notes}
                                    onChange={(e) => setNewLead({...newLead, notes: e.target.value})}
                                    placeholder="Initial notes about the lead..."
                                    data-testid="new-lead-notes-input"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                                Cancel
                            </Button>
                            <Button className="btn-primary" onClick={handleAddLead} data-testid="save-lead-btn">
                                Add Lead
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Filters */}
            <Card className="border-slate-200">
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Search leads..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                                data-testid="search-leads-input"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-slate-400" />
                            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                                <SelectTrigger className="w-40" data-testid="status-filter-select">
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    {LEAD_STATUSES.map(status => (
                                        <SelectItem key={status.value} value={status.value}>
                                            {status.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Leads List */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-500"></div>
                </div>
            ) : filteredLeads.length === 0 ? (
                <Card className="border-slate-200">
                    <CardContent className="p-12 text-center">
                        <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-600 mb-4">
                            {searchQuery || statusFilter !== 'all' 
                                ? 'No leads match your filters' 
                                : 'No leads yet'}
                        </p>
                        <Button className="btn-accent" onClick={() => setShowAddDialog(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Your First Lead
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {filteredLeads.map((lead, index) => (
                        <Card 
                            key={lead.id} 
                            className="border-slate-200 card-hover animate-fadeIn"
                            style={{ animationDelay: `${index * 0.03}s` }}
                            data-testid={`lead-card-${lead.id}`}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                                            <Building2 className="w-6 h-6 text-slate-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-900">
                                                {lead.company_name}
                                            </h3>
                                            <p className="text-sm text-slate-500">
                                                {lead.industry || 'No industry'} 
                                                {lead.company_size && ` · ${lead.company_size}`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge 
                                            variant="secondary"
                                            className={`${getStatusColor(lead.status)} text-white`}
                                        >
                                            {getStatusLabel(lead.status)}
                                        </Badge>
                                        <span className="text-sm text-slate-500 hidden sm:block">
                                            {formatDate(lead.created_at)}
                                        </span>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" data-testid={`lead-menu-${lead.id}`}>
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem asChild>
                                                    <Link to={`/leads/${lead.id}`} className="flex items-center gap-2">
                                                        <Eye className="w-4 h-4" />
                                                        View Details
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                    className="text-red-600"
                                                    onClick={() => handleDeleteLead(lead.id)}
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                                {lead.notes && (
                                    <p className="mt-3 text-sm text-slate-600 line-clamp-2 pl-16">
                                        {lead.notes}
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
