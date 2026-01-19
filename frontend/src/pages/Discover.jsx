import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { aiAPI, leadsAPI } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { INDUSTRIES } from '../lib/utils';
import { Sparkles, Search, Building2, UserSearch, Loader2, Plus, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function Discover() {
    const navigate = useNavigate();
    const [companyName, setCompanyName] = useState('');
    const [industry, setIndustry] = useState('');
    const [additionalContext, setAdditionalContext] = useState('');
    const [researchLoading, setResearchLoading] = useState(false);
    const [contactsLoading, setContactsLoading] = useState(false);
    const [researchResult, setResearchResult] = useState('');
    const [contactsResult, setContactsResult] = useState('');
    const [savingLead, setSavingLead] = useState(false);

    const handleResearch = async () => {
        if (!companyName.trim()) {
            toast.error('Please enter a company name');
            return;
        }
        setResearchLoading(true);
        setResearchResult('');
        try {
            const res = await aiAPI.researchCompany({
                company_name: companyName,
                industry: industry && industry !== 'any' ? industry : undefined,
                additional_context: additionalContext || undefined
            });
            setResearchResult(res.data.research);
            toast.success('Research complete!');
        } catch (error) {
            toast.error('Research failed: ' + (error.response?.data?.detail || error.message));
        } finally {
            setResearchLoading(false);
        }
    };

    const handleDiscoverContacts = async () => {
        if (!companyName.trim()) {
            toast.error('Please enter a company name');
            return;
        }
        setContactsLoading(true);
        setContactsResult('');
        try {
            const res = await aiAPI.discoverContacts({
                company_name: companyName
            });
            setContactsResult(res.data.contacts_research);
            toast.success('Contact discovery complete!');
        } catch (error) {
            toast.error('Contact discovery failed: ' + (error.response?.data?.detail || error.message));
        } finally {
            setContactsLoading(false);
        }
    };

    const handleSaveAsLead = async () => {
        if (!companyName.trim()) {
            toast.error('Please enter a company name');
            return;
        }
        setSavingLead(true);
        try {
            const leadData = {
                company_name: companyName,
                industry: industry && industry !== 'any' ? industry : undefined,
                ai_insights: researchResult || undefined,
                notes: additionalContext || undefined
            };
            const res = await leadsAPI.create(leadData);
            
            // Update with AI insights if we have them
            if (researchResult) {
                await leadsAPI.update(res.data.id, { ai_insights: researchResult });
            }
            
            toast.success('Lead saved successfully!');
            navigate(`/leads/${res.data.id}`);
        } catch (error) {
            toast.error('Failed to save lead');
        } finally {
            setSavingLead(false);
        }
    };

    return (
        <div className="space-y-6" data-testid="discover-page">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-heading font-bold text-slate-900 tracking-tight flex items-center gap-3">
                    <Sparkles className="w-8 h-8 text-lime-500" />
                    AI Discovery
                </h1>
                <p className="text-slate-600 mt-1">
                    Research companies and discover potential HR service opportunities
                </p>
            </div>

            {/* Search Form */}
            <Card className="border-slate-200">
                <CardHeader>
                    <CardTitle className="font-heading">Company Research</CardTitle>
                    <CardDescription>
                        Enter a company name to research their HR service needs
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="company">Company Name *</Label>
                            <Input
                                id="company"
                                placeholder="e.g., TechStartup Inc."
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                data-testid="company-name-input"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="industry">Industry (optional)</Label>
                            <Select value={industry} onValueChange={setIndustry}>
                                <SelectTrigger data-testid="industry-select">
                                    <SelectValue placeholder="Select industry" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="any">Any</SelectItem>
                                    {INDUSTRIES.map(ind => (
                                        <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="context">Additional Context (optional)</Label>
                        <Textarea
                            id="context"
                            placeholder="Any additional information you know about the company..."
                            value={additionalContext}
                            onChange={(e) => setAdditionalContext(e.target.value)}
                            rows={3}
                            data-testid="context-input"
                        />
                    </div>
                    <div className="flex flex-wrap gap-3 pt-2">
                        <Button 
                            className="btn-accent gap-2"
                            onClick={handleResearch}
                            disabled={researchLoading || !companyName.trim()}
                            data-testid="research-btn"
                        >
                            {researchLoading ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Researching...</>
                            ) : (
                                <><Search className="w-4 h-4" /> Research Company</>
                            )}
                        </Button>
                        <Button 
                            variant="outline"
                            className="gap-2"
                            onClick={handleDiscoverContacts}
                            disabled={contactsLoading || !companyName.trim()}
                            data-testid="discover-contacts-btn"
                        >
                            {contactsLoading ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Discovering...</>
                            ) : (
                                <><UserSearch className="w-4 h-4" /> Discover Contacts</>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Research Results */}
            {researchResult && (
                <Card className="border-slate-200 border-lime-500/30 animate-fadeIn" data-testid="research-results">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="font-heading flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-lime-500" />
                                Company Research: {companyName}
                            </CardTitle>
                            <CardDescription>AI-powered analysis and insights</CardDescription>
                        </div>
                        <Button 
                            className="btn-primary gap-2"
                            onClick={handleSaveAsLead}
                            disabled={savingLead}
                            data-testid="save-as-lead-btn"
                        >
                            {savingLead ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                            ) : (
                                <><Plus className="w-4 h-4" /> Save as Lead</>
                            )}
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="whitespace-pre-wrap text-slate-700 bg-slate-50 p-6 rounded-lg">
                            {researchResult}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Contact Discovery Results */}
            {contactsResult && (
                <Card className="border-slate-200 border-lime-500/30 animate-fadeIn" data-testid="contacts-results">
                    <CardHeader>
                        <CardTitle className="font-heading flex items-center gap-2">
                            <UserSearch className="w-5 h-5 text-lime-500" />
                            Contact Discovery: {companyName}
                        </CardTitle>
                        <CardDescription>Suggested decision-makers and how to find them</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="whitespace-pre-wrap text-slate-700 bg-slate-50 p-6 rounded-lg">
                            {contactsResult}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Empty State */}
            {!researchResult && !contactsResult && (
                <Card className="border-slate-200 border-dashed">
                    <CardContent className="p-12 text-center">
                        <Sparkles className="w-16 h-16 text-slate-300 mx-auto mb-6" />
                        <h3 className="text-xl font-heading font-semibold text-slate-900 mb-2">
                            Start Your Research
                        </h3>
                        <p className="text-slate-600 max-w-md mx-auto mb-6">
                            Enter a company name above to analyze their HR needs, discover pain points, 
                            and find the right contacts to reach out to.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-500">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-lime-500" />
                                Company analysis
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-lime-500" />
                                HR pain points
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-lime-500" />
                                Contact suggestions
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-lime-500" />
                                Outreach strategy
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
