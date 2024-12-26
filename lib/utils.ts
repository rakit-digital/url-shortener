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
    if (!date) return 'No date set';
    
    try {
        const dateObj = typeof date === 'string' ? parseISO(date) : date;
        if (!isValid(dateObj)) {
            return 'Invalid date';
        }
        
        return format(dateObj, 'MMM d, yyyy');
    } catch {
        return 'Invalid date';
    }
}

export function formatDateTime(date: Date | string | null): string {
    if (!date) return 'No date set';
    
    try {
        const dateObj = typeof date === 'string' ? parseISO(date) : date;
        if (!isValid(dateObj)) {
            return 'Invalid date';
        }
        
        return format(dateObj, 'MMM d, yyyy h:mm a');
    } catch {
        return 'Invalid date';
    }
}

export function isExpired(expirationDate: Date | string | null): boolean {
    if (!expirationDate) return false;
    
    try {
        const dateObj = typeof expirationDate === 'string' ? parseISO(expirationDate) : expirationDate;
        if (!isValid(dateObj)) {
            return false;
        }
        return isPast(dateObj);
    } catch {
        return false;
    }
}
