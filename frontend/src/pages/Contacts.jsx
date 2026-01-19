import { useState, useEffect } from 'react';
import { contactsAPI, leadsAPI } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Search, User, Mail, Phone, Linkedin, Building2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export default function Contacts() {
    const [contacts, setContacts] = useState([]);
    const [leads, setLeads] = useState({});
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [contactsRes, leadsRes] = await Promise.all([
                contactsAPI.getAll(),
                leadsAPI.getAll()
            ]);
            setContacts(contactsRes.data);
            // Create a map of lead id to lead for quick lookup
            const leadsMap = {};
            leadsRes.data.forEach(lead => {
                leadsMap[lead.id] = lead;
            });
            setLeads(leadsMap);
        } catch (error) {
            toast.error('Failed to load contacts');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this contact?')) return;
        try {
            await contactsAPI.delete(id);
            setContacts(contacts.filter(c => c.id !== id));
            toast.success('Contact deleted');
        } catch (error) {
            toast.error('Failed to delete contact');
        }
    };

    const filteredContacts = contacts.filter(contact =>
        contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (contact.title && contact.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (contact.email && contact.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6" data-testid="contacts-page">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-heading font-bold text-slate-900 tracking-tight">
                    Contacts
                </h1>
                <p className="text-slate-600 mt-1">
                    All your contacts across leads
                </p>
            </div>

            {/* Search */}
            <Card className="border-slate-200">
                <CardContent className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Search contacts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                            data-testid="search-contacts-input"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Contacts List */}
            {filteredContacts.length === 0 ? (
                <Card className="border-slate-200">
                    <CardContent className="p-12 text-center">
                        <User className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-600">
                            {searchQuery ? 'No contacts match your search' : 'No contacts yet'}
                        </p>
                        <p className="text-slate-500 text-sm mt-2">
                            Add contacts from the lead detail page
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {filteredContacts.map((contact, index) => {
                        const lead = leads[contact.lead_id];
                        return (
                            <Card 
                                key={contact.id} 
                                className="border-slate-200 card-hover animate-fadeIn"
                                style={{ animationDelay: `${index * 0.03}s` }}
                                data-testid={`contact-card-${contact.id}`}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                                                <User className="w-6 h-6 text-slate-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-slate-900">
                                                    {contact.name}
                                                </h3>
                                                <p className="text-sm text-slate-500">
                                                    {contact.title || 'No title'}
                                                </p>
                                                {lead && (
                                                    <Link 
                                                        to={`/leads/${lead.id}`}
                                                        className="text-xs text-lime-600 hover:underline flex items-center gap-1 mt-1"
                                                    >
                                                        <Building2 className="w-3 h-3" />
                                                        {lead.company_name}
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {contact.email && (
                                                <a 
                                                    href={`mailto:${contact.email}`} 
                                                    className="flex items-center gap-1 text-sm text-slate-600 hover:text-lime-600"
                                                >
                                                    <Mail className="w-4 h-4" />
                                                    <span className="hidden sm:inline">{contact.email}</span>
                                                </a>
                                            )}
                                            {contact.phone && (
                                                <a 
                                                    href={`tel:${contact.phone}`} 
                                                    className="text-slate-500 hover:text-lime-600"
                                                >
                                                    <Phone className="w-4 h-4" />
                                                </a>
                                            )}
                                            {contact.linkedin && (
                                                <a 
                                                    href={contact.linkedin} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-slate-500 hover:text-lime-600"
                                                >
                                                    <Linkedin className="w-4 h-4" />
                                                </a>
                                            )}
                                            <Button 
                                                variant="ghost" 
                                                size="icon"
                                                onClick={() => handleDelete(contact.id)}
                                            >
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
