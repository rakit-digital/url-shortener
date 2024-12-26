import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, isValid, parseISO, isPast } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isValidUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

export function formatDate(date: Date | string | null): string {
    if (!date) return 'Never';
    
    try {
        const parsedDate = typeof date === 'string' ? parseISO(date) : date;
        if (!isValid(parsedDate)) return 'Invalid date';
        
        return format(parsedDate, 'MMM d, yyyy');
    } catch {
        return 'Invalid date';
    }
}

export function formatDateTime(date: Date | string | null): string {
    if (!date) return 'Never';
    
    try {
        const parsedDate = typeof date === 'string' ? parseISO(date) : date;
        if (!isValid(parsedDate)) return 'Invalid date';
        
        return format(parsedDate, 'MMM d, yyyy h:mm a');
    } catch {
        return 'Invalid date';
    }
}

export function isExpired(expirationDate: Date | string | null): boolean {
    if (!expirationDate) return false;
    
    try {
        const parsedDate = typeof expirationDate === 'string' ? parseISO(expirationDate) : expirationDate;
        if (!isValid(parsedDate)) return false;
        
        return isPast(parsedDate);
    } catch {
        return false;
    }
}

export function compareDates(a: Date | string | null, b: Date | string | null): number {
    if (!a && !b) return 0;
    if (!a) return 1;
    if (!b) return -1;
    
    try {
        const dateA = typeof a === 'string' ? parseISO(a) : a;
        const dateB = typeof b === 'string' ? parseISO(b) : b;
        
        if (!isValid(dateA) || !isValid(dateB)) return 0;
        
        return dateA.getTime() - dateB.getTime();
    } catch {
        return 0;
    }
}
