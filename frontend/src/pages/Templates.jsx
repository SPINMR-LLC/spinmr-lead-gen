import { useState, useEffect } from 'react';
import { templatesAPI } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, FileText, Trash2, Edit2, Copy, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';

const TEMPLATE_CATEGORIES = [
    { value: 'outreach', label: 'Initial Outreach' },
    { value: 'follow_up', label: 'Follow Up' },
    { value: 'proposal', label: 'Proposal' },
    { value: 'meeting', label: 'Meeting Request' },
];

export default function Templates() {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDialog, setShowDialog] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        subject: '',
        body: '',
        category: 'outreach'
    });

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const res = await templatesAPI.getAll();
            setTemplates(res.data);
        } catch (error) {
            toast.error('Failed to load templates');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name.trim() || !formData.subject.trim() || !formData.body.trim()) {
            toast.error('Please fill in all fields');
            return;
        }
        try {
            if (editingTemplate) {
                await templatesAPI.update(editingTemplate.id, formData);
                toast.success('Template updated');
            } else {
                await templatesAPI.create(formData);
                toast.success('Template created');
            }
            setShowDialog(false);
            resetForm();
            fetchTemplates();
        } catch (error) {
            toast.error('Failed to save template');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this template?')) return;
        try {
            await templatesAPI.delete(id);
            setTemplates(templates.filter(t => t.id !== id));
            toast.success('Template deleted');
        } catch (error) {
            toast.error('Failed to delete template');
        }
    };

    const handleEdit = (template) => {
        setEditingTemplate(template);
        setFormData({
            name: template.name,
            subject: template.subject,
            body: template.body,
            category: template.category
        });
        setShowDialog(true);
    };

    const handleCopy = (template) => {
        const text = `Subject: ${template.subject}\n\n${template.body}`;
        navigator.clipboard.writeText(text);
        toast.success('Template copied to clipboard');
    };

    const resetForm = () => {
        setEditingTemplate(null);
        setFormData({ name: '', subject: '', body: '', category: 'outreach' });
    };

    const getCategoryLabel = (value) => {
        const cat = TEMPLATE_CATEGORIES.find(c => c.value === value);
        return cat ? cat.label : value;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6" data-testid="templates-page">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-slate-900 tracking-tight">
                        Email Templates
                    </h1>
                    <p className="text-slate-600 mt-1">
                        Manage your outreach email templates
                    </p>
                </div>
                <Dialog open={showDialog} onOpenChange={(open) => {
                    setShowDialog(open);
                    if (!open) resetForm();
                }}>
                    <DialogTrigger asChild>
                        <Button className="btn-primary gap-2" data-testid="add-template-btn">
                            <Plus className="w-4 h-4" />
                            New Template
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="font-heading">
                                {editingTemplate ? 'Edit Template' : 'Create Template'}
                            </DialogTitle>
                            <DialogDescription>
                                {editingTemplate ? 'Update your email template' : 'Create a new email template for outreach'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Template Name *</Label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        placeholder="Cold Outreach v1"
                                        data-testid="template-name-input"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Category</Label>
                                    <Select 
                                        value={formData.category} 
                                        onValueChange={(v) => setFormData({...formData, category: v})}
                                    >
                                        <SelectTrigger data-testid="template-category-select">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TEMPLATE_CATEGORIES.map(cat => (
                                                <SelectItem key={cat.value} value={cat.value}>
                                                    {cat.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Subject Line *</Label>
                                <Input
                                    value={formData.subject}
                                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                                    placeholder="Quick question about {{company}}'s HR needs"
                                    data-testid="template-subject-input"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Email Body *</Label>
                                <Textarea
                                    value={formData.body}
                                    onChange={(e) => setFormData({...formData, body: e.target.value})}
                                    placeholder="Hi {{name}},&#10;&#10;I noticed that {{company}}..."
                                    rows={8}
                                    data-testid="template-body-input"
                                />
                                <p className="text-xs text-slate-500">
                                    Use {'{{variable}}'} placeholders for personalization
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => { setShowDialog(false); resetForm(); }}>
                                Cancel
                            </Button>
                            <Button className="btn-primary" onClick={handleSave} data-testid="save-template-btn">
                                {editingTemplate ? 'Update Template' : 'Create Template'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Templates List */}
            {templates.length === 0 ? (
                <Card className="border-slate-200">
                    <CardContent className="p-12 text-center">
                        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-600 mb-4">No templates yet</p>
                        <Button className="btn-accent" onClick={() => setShowDialog(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Your First Template
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {templates.map((template, index) => (
                        <Card 
                            key={template.id} 
                            className="border-slate-200 card-hover animate-fadeIn"
                            style={{ animationDelay: `${index * 0.03}s` }}
                            data-testid={`template-card-${template.id}`}
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg font-heading">
                                            {template.name}
                                        </CardTitle>
                                        <CardDescription className="text-xs uppercase tracking-wide">
                                            {getCategoryLabel(template.category)}
                                        </CardDescription>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleEdit(template)}>
                                                <Edit2 className="w-4 h-4 mr-2" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleCopy(template)}>
                                                <Copy className="w-4 h-4 mr-2" />
                                                Copy
                                            </DropdownMenuItem>
                                            <DropdownMenuItem 
                                                className="text-red-600"
                                                onClick={() => handleDelete(template.id)}
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="text-sm">
                                        <span className="font-medium text-slate-700">Subject: </span>
                                        <span className="text-slate-600">{template.subject}</span>
                                    </div>
                                    <p className="text-sm text-slate-500 line-clamp-3">
                                        {template.body}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Starter Templates */}
            {templates.length === 0 && (
                <Card className="border-slate-200 border-dashed mt-6">
                    <CardHeader>
                        <CardTitle className="font-heading text-lg">Starter Templates</CardTitle>
                        <CardDescription>Quick templates to get you started</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {[
                                {
                                    name: 'Cold Outreach',
                                    subject: 'Quick question about {{company}}\'s HR needs',
                                    body: 'Hi {{name}},\n\nI noticed {{company}} has been growing recently. Many companies at your stage face challenges with onboarding, payroll, and HR compliance.\n\nWould you be open to a 15-minute call to discuss how we might help streamline your HR operations?\n\nBest,\n{{sender_name}}',
                                    category: 'outreach'
                                },
                                {
                                    name: 'Follow Up',
                                    subject: 'Following up - HR services for {{company}}',
                                    body: 'Hi {{name}},\n\nJust following up on my previous email about HR support for {{company}}.\n\nI\'d love to share how we\'ve helped similar companies reduce their HR admin time by 40%.\n\nAre you available for a quick call this week?\n\nBest,\n{{sender_name}}',
                                    category: 'follow_up'
                                }
                            ].map((starter, idx) => (
                                <Button
                                    key={idx}
                                    variant="outline"
                                    className="h-auto p-4 justify-start text-left flex-col items-start"
                                    onClick={() => {
                                        setFormData(starter);
                                        setShowDialog(true);
                                    }}
                                >
                                    <span className="font-medium">{starter.name}</span>
                                    <span className="text-xs text-slate-500 mt-1">
                                        {getCategoryLabel(starter.category)}
                                    </span>
                                </Button>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
