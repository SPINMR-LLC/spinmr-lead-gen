import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { leadsAPI, contactsAPI, aiAPI } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { getStatusColor, getStatusLabel, formatDate, LEAD_STATUSES, INDUSTRIES, COMPANY_SIZES } from '../lib/utils';
import { 
    ArrowLeft, Building2, Globe, Calendar, Sparkles, 
    UserPlus, Mail, Phone, Linkedin, Trash2, Edit2, 
    Save, X, Brain, Send, Loader2, User
} from 'lucide-react';
import { toast } from 'sonner';

export default function LeadDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [lead, setLead] = useState(null);
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [editData, setEditData] = useState({});
    const [showContactDialog, setShowContactDialog] = useState(false);
    const [newContact, setNewContact] = useState({ name: '', title: '', email: '', phone: '', linkedin: '', notes: '' });
    const [aiLoading, setAiLoading] = useState(false);
    const [aiInsights, setAiInsights] = useState('');
    const [emailLoading, setEmailLoading] = useState(false);
    const [generatedEmail, setGeneratedEmail] = useState('');

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const [leadRes, contactsRes] = await Promise.all([
                leadsAPI.getOne(id),
                contactsAPI.getAll(id)
            ]);
            setLead(leadRes.data);
            setEditData(leadRes.data);
            setContacts(contactsRes.data);
            if (leadRes.data.ai_insights) {
                setAiInsights(leadRes.data.ai_insights);
            }
        } catch (error) {
            toast.error('Failed to load lead details');
            navigate('/leads');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            await leadsAPI.update(id, editData);
            setLead(editData);
            setEditing(false);
            toast.success('Lead updated');
        } catch (error) {
            toast.error('Failed to update lead');
        }
    };

    const handleStatusChange = async (status) => {
        try {
            await leadsAPI.update(id, { status });
            setLead({ ...lead, status });
            toast.success('Status updated');
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const handleAddContact = async () => {
        if (!newContact.name.trim()) {
            toast.error('Contact name is required');
            return;
        }
        try {
            await contactsAPI.create({ ...newContact, lead_id: id });
            toast.success('Contact added');
            setShowContactDialog(false);
            setNewContact({ name: '', title: '', email: '', phone: '', linkedin: '', notes: '' });
            const res = await contactsAPI.getAll(id);
            setContacts(res.data);
        } catch (error) {
            toast.error('Failed to add contact');
        }
    };

    const handleDeleteContact = async (contactId) => {
        if (!window.confirm('Delete this contact?')) return;
        try {
            await contactsAPI.delete(contactId);
            setContacts(contacts.filter(c => c.id !== contactId));
            toast.success('Contact deleted');
        } catch (error) {
            toast.error('Failed to delete contact');
        }
    };

    const handleAiResearch = async () => {
        setAiLoading(true);
        try {
            const res = await aiAPI.researchCompany({
                company_name: lead.company_name,
                industry: lead.industry,
                additional_context: lead.notes
            });
            setAiInsights(res.data.research);
            // Save to lead
            await leadsAPI.update(id, { ai_insights: res.data.research });
            toast.success('AI research complete');
        } catch (error) {
            toast.error('AI research failed: ' + (error.response?.data?.detail || error.message));
        } finally {
            setAiLoading(false);
        }
    };

    const handleGenerateEmail = async () => {
        setEmailLoading(true);
        try {
            const res = await aiAPI.generateEmail(id);
            setGeneratedEmail(res.data.email);
            toast.success('Email generated');
        } catch (error) {
            toast.error('Email generation failed: ' + (error.response?.data?.detail || error.message));
        } finally {
            setEmailLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-500"></div>
            </div>
        );
    }

    if (!lead) return null;

    return (
        <div className="space-y-6" data-testid="lead-detail-page">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/leads')} data-testid="back-btn">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-heading font-bold text-slate-900 tracking-tight">
                            {lead.company_name}
                        </h1>
                        <Badge className={`${getStatusColor(lead.status)} text-white`}>
                            {getStatusLabel(lead.status)}
                        </Badge>
                    </div>
                    <p className="text-slate-600 mt-1">
                        {lead.industry || 'No industry'} {lead.company_size && `· ${lead.company_size}`}
                    </p>
                </div>
                <Select value={lead.status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-36" data-testid="status-select">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {LEAD_STATUSES.map(s => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <Tabs defaultValue="details" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="details" data-testid="details-tab">Details</TabsTrigger>
                    <TabsTrigger value="contacts" data-testid="contacts-tab">Contacts ({contacts.length})</TabsTrigger>
                    <TabsTrigger value="ai" data-testid="ai-tab">AI Insights</TabsTrigger>
                    <TabsTrigger value="outreach" data-testid="outreach-tab">Outreach</TabsTrigger>
                </TabsList>

                {/* Details Tab */}
                <TabsContent value="details">
                    <Card className="border-slate-200">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="font-heading">Company Details</CardTitle>
                                <CardDescription>Information about this lead</CardDescription>
                            </div>
                            {editing ? (
                                <div className="flex gap-2">
                                    <Button variant="ghost" onClick={() => { setEditing(false); setEditData(lead); }}>
                                        <X className="w-4 h-4 mr-1" /> Cancel
                                    </Button>
                                    <Button className="btn-primary" onClick={handleSave} data-testid="save-btn">
                                        <Save className="w-4 h-4 mr-1" /> Save
                                    </Button>
                                </div>
                            ) : (
                                <Button variant="outline" onClick={() => setEditing(true)} data-testid="edit-btn">
                                    <Edit2 className="w-4 h-4 mr-1" /> Edit
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Company Name</Label>
                                    {editing ? (
                                        <Input 
                                            value={editData.company_name} 
                                            onChange={(e) => setEditData({...editData, company_name: e.target.value})}
                                        />
                                    ) : (
                                        <p className="text-slate-900 font-medium flex items-center gap-2">
                                            <Building2 className="w-4 h-4 text-slate-400" />
                                            {lead.company_name}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label>Website</Label>
                                    {editing ? (
                                        <Input 
                                            value={editData.website || ''} 
                                            onChange={(e) => setEditData({...editData, website: e.target.value})}
                                        />
                                    ) : (
                                        <p className="text-slate-900 flex items-center gap-2">
                                            <Globe className="w-4 h-4 text-slate-400" />
                                            {lead.website ? (
                                                <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-lime-600 hover:underline">
                                                    {lead.website}
                                                </a>
                                            ) : 'Not specified'}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label>Industry</Label>
                                    {editing ? (
                                        <Select value={editData.industry || ''} onValueChange={(v) => setEditData({...editData, industry: v})}>
                                            <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                                            <SelectContent>
                                                {INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <p className="text-slate-900">{lead.industry || 'Not specified'}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label>Company Size</Label>
                                    {editing ? (
                                        <Select value={editData.company_size || ''} onValueChange={(v) => setEditData({...editData, company_size: v})}>
                                            <SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger>
                                            <SelectContent>
                                                {COMPANY_SIZES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <p className="text-slate-900">{lead.company_size || 'Not specified'}</p>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Notes</Label>
                                {editing ? (
                                    <Textarea 
                                        value={editData.notes || ''} 
                                        onChange={(e) => setEditData({...editData, notes: e.target.value})}
                                        rows={4}
                                    />
                                ) : (
                                    <p className="text-slate-700 whitespace-pre-wrap">{lead.notes || 'No notes'}</p>
                                )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-500 pt-4 border-t">
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    Created: {formatDate(lead.created_at)}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    Updated: {formatDate(lead.updated_at)}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Contacts Tab */}
                <TabsContent value="contacts">
                    <Card className="border-slate-200">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="font-heading">Contacts</CardTitle>
                                <CardDescription>Point of contacts at this company</CardDescription>
                            </div>
                            <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
                                <DialogTrigger asChild>
                                    <Button className="btn-accent gap-2" data-testid="add-contact-btn">
                                        <UserPlus className="w-4 h-4" /> Add Contact
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add Contact</DialogTitle>
                                        <DialogDescription>Add a point of contact for this lead</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label>Name *</Label>
                                            <Input 
                                                value={newContact.name} 
                                                onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                                                placeholder="John Smith"
                                                data-testid="contact-name-input"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Title</Label>
                                            <Input 
                                                value={newContact.title} 
                                                onChange={(e) => setNewContact({...newContact, title: e.target.value})}
                                                placeholder="HR Director"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Email</Label>
                                                <Input 
                                                    type="email"
                                                    value={newContact.email} 
                                                    onChange={(e) => setNewContact({...newContact, email: e.target.value})}
                                                    placeholder="john@company.com"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Phone</Label>
                                                <Input 
                                                    value={newContact.phone} 
                                                    onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
                                                    placeholder="+1 234 567 8900"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>LinkedIn</Label>
                                            <Input 
                                                value={newContact.linkedin} 
                                                onChange={(e) => setNewContact({...newContact, linkedin: e.target.value})}
                                                placeholder="https://linkedin.com/in/johnsmith"
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setShowContactDialog(false)}>Cancel</Button>
                                        <Button className="btn-primary" onClick={handleAddContact} data-testid="save-contact-btn">
                                            Add Contact
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent>
                            {contacts.length === 0 ? (
                                <div className="text-center py-8">
                                    <User className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                    <p className="text-slate-600 mb-4">No contacts yet</p>
                                    <Button className="btn-accent" onClick={() => setShowContactDialog(true)}>
                                        <UserPlus className="w-4 h-4 mr-2" /> Add First Contact
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {contacts.map((contact) => (
                                        <div 
                                            key={contact.id} 
                                            className="flex items-center justify-between p-4 rounded-lg bg-slate-50"
                                            data-testid={`contact-${contact.id}`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                                                    <User className="w-5 h-5 text-slate-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900">{contact.name}</p>
                                                    <p className="text-sm text-slate-500">{contact.title || 'No title'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {contact.email && (
                                                    <a href={`mailto:${contact.email}`} className="text-slate-500 hover:text-lime-600">
                                                        <Mail className="w-4 h-4" />
                                                    </a>
                                                )}
                                                {contact.phone && (
                                                    <a href={`tel:${contact.phone}`} className="text-slate-500 hover:text-lime-600">
                                                        <Phone className="w-4 h-4" />
                                                    </a>
                                                )}
                                                {contact.linkedin && (
                                                    <a href={contact.linkedin} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-lime-600">
                                                        <Linkedin className="w-4 h-4" />
                                                    </a>
                                                )}
                                                <Button variant="ghost" size="icon" onClick={() => handleDeleteContact(contact.id)}>
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* AI Insights Tab */}
                <TabsContent value="ai">
                    <Card className="border-slate-200">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="font-heading flex items-center gap-2">
                                    <Brain className="w-5 h-5 text-lime-500" />
                                    AI Research
                                </CardTitle>
                                <CardDescription>AI-powered company analysis and insights</CardDescription>
                            </div>
                            <Button 
                                className="btn-accent gap-2" 
                                onClick={handleAiResearch}
                                disabled={aiLoading}
                                data-testid="ai-research-btn"
                            >
                                {aiLoading ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Researching...</>
                                ) : (
                                    <><Sparkles className="w-4 h-4" /> {aiInsights ? 'Refresh Research' : 'Start Research'}</>
                                )}
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {aiInsights ? (
                                <div className="prose prose-slate max-w-none">
                                    <div className="whitespace-pre-wrap text-slate-700 bg-slate-50 p-6 rounded-lg" data-testid="ai-insights">
                                        {aiInsights}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                    <p className="text-slate-600 mb-4">
                                        Use AI to research this company and discover HR service opportunities
                                    </p>
                                    <Button 
                                        className="btn-accent"
                                        onClick={handleAiResearch}
                                        disabled={aiLoading}
                                    >
                                        {aiLoading ? 'Researching...' : 'Start AI Research'}
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Outreach Tab */}
                <TabsContent value="outreach">
                    <Card className="border-slate-200">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="font-heading flex items-center gap-2">
                                    <Send className="w-5 h-5 text-lime-500" />
                                    Outreach Email
                                </CardTitle>
                                <CardDescription>Generate personalized outreach emails</CardDescription>
                            </div>
                            <Button 
                                className="btn-accent gap-2"
                                onClick={handleGenerateEmail}
                                disabled={emailLoading}
                                data-testid="generate-email-btn"
                            >
                                {emailLoading ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                                ) : (
                                    <><Sparkles className="w-4 h-4" /> Generate Email</>
                                )}
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {generatedEmail ? (
                                <div className="space-y-4">
                                    <div className="whitespace-pre-wrap text-slate-700 bg-slate-50 p-6 rounded-lg font-mono text-sm" data-testid="generated-email">
                                        {generatedEmail}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button 
                                            variant="outline"
                                            onClick={() => {
                                                navigator.clipboard.writeText(generatedEmail);
                                                toast.success('Copied to clipboard');
                                            }}
                                        >
                                            Copy to Clipboard
                                        </Button>
                                        <Button className="btn-primary" onClick={handleGenerateEmail} disabled={emailLoading}>
                                            Regenerate
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <Mail className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                    <p className="text-slate-600 mb-4">
                                        Generate a personalized outreach email for this lead
                                    </p>
                                    <Button 
                                        className="btn-accent"
                                        onClick={handleGenerateEmail}
                                        disabled={emailLoading}
                                    >
                                        {emailLoading ? 'Generating...' : 'Generate Email'}
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
