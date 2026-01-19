import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export const LEAD_STATUSES = [
    { value: 'new', label: 'New', color: 'bg-blue-500' },
    { value: 'contacted', label: 'Contacted', color: 'bg-yellow-500' },
    { value: 'qualified', label: 'Qualified', color: 'bg-purple-500' },
    { value: 'proposal', label: 'Proposal', color: 'bg-orange-500' },
    { value: 'won', label: 'Won', color: 'bg-lime-500' },
    { value: 'lost', label: 'Lost', color: 'bg-red-500' },
];

export const getStatusColor = (status) => {
    const found = LEAD_STATUSES.find(s => s.value === status);
    return found ? found.color : 'bg-gray-500';
};

export const getStatusLabel = (status) => {
    const found = LEAD_STATUSES.find(s => s.value === status);
    return found ? found.label : status;
};

export const INDUSTRIES = [
    'Technology',
    'Healthcare',
    'Finance',
    'Manufacturing',
    'Retail',
    'Professional Services',
    'Education',
    'Real Estate',
    'Hospitality',
    'Construction',
    'Transportation',
    'Media & Entertainment',
    'Other'
];

export const COMPANY_SIZES = [
    '1-10 employees',
    '11-50 employees',
    '51-200 employees',
    '201-500 employees',
    '500+ employees'
];

export const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};
