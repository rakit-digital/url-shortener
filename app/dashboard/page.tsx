'use client';

import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where, orderBy, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import DataTable from '@/components/ui/dataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, TrendingUp, Link as LinkIcon, Clock, Lock, Globe, Copy, ExternalLink } from 'lucide-react';
import { formatDateTime, formatDate, isExpired, compareDates } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { addDays } from 'date-fns';
import type { SelectSingleEventHandler } from 'react-day-picker';
import { QRCodeModal } from '@/components/QRCodeModal';

interface UrlData {
    id: string;
    slug: string;
    originalUrl: string;
    visitCount: number;
    createdAt: Date;
    expirationDate: Date | null;
    shortenedUrl: string;
    isPasswordProtected?: boolean;
    password?: string;
}

export default function Dashboard() {
    const [urls, setUrls] = useState<UrlData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sortConfig, setSortConfig] = useState<{
        key: keyof UrlData;
        direction: 'asc' | 'desc';
    }>({ key: 'createdAt', direction: 'desc' });
    const [selectedUrl, setSelectedUrl] = useState<UrlData | null>(null);
    const [expirationDate, setExpirationDate] = useState<Date | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    
    const router = useRouter();
    const auth = getAuth();

    useEffect(() => {
        const fetchUrls = async (userId: string) => {
            try {
                const q = query(
                    collection(db, 'urls'),
                    where('userId', '==', userId),
                    orderBy('createdAt', 'desc')
                );
                const querySnapshot = await getDocs(q);
                const urlsData = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    const createdAt = data.createdAt?.toDate() || new Date();
                    const expirationDate = data.expirationDate?.toDate() || null;
                    
                    return {
                        id: doc.id,
                        slug: data.slug,
                        originalUrl: data.originalUrl,
                        visitCount: data.visitCount || 0,
                        createdAt,
                        expirationDate,
                        shortenedUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/${data.slug}`,
                        isPasswordProtected: data.isPasswordProtected || false,
                        password: data.password || undefined
                    } satisfies UrlData;
                });
                setUrls(urlsData);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : '';
                if (errorMessage.includes('index')) {
                    try {
                        const fallbackQuery = query(
                            collection(db, 'urls'),
                            where('userId', '==', userId)
                        );
                        const fallbackSnapshot = await getDocs(fallbackQuery);
                        const fallbackData = fallbackSnapshot.docs.map(doc => {
                            const data = doc.data();
                            const createdAt = data.createdAt?.toDate() || new Date();
                            const expirationDate = data.expirationDate?.toDate() || null;
                            
                            return {
                                id: doc.id,
                                slug: data.slug,
                                originalUrl: data.originalUrl,
                                visitCount: data.visitCount || 0,
                                createdAt,
                                expirationDate,
                                shortenedUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/${data.slug}`,
                                isPasswordProtected: data.isPasswordProtected || false,
                                password: data.password || undefined
                            } satisfies UrlData;
                        });
                        const sortedData = [...fallbackData].sort((a, b) => 
                            compareDates(b.createdAt, a.createdAt)
                        );
                        setUrls(sortedData);
                    } catch (fallbackErr) {
                        console.error('Error fetching URLs:', fallbackErr);
                        setError('Failed to fetch URLs. Please try again later.');
                    }
                } else {
                    console.error('Error fetching URLs:', err);
                    setError('Failed to fetch URLs. Please try again later.');
                }
            } finally {
                setLoading(false);
            }
        };

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                fetchUrls(user.uid);
            } else {
                router.push('/login');
            }
        });

        return () => unsubscribe();
    }, [auth, router]);

    const handleCopy = async (url: string) => {
        try {
            await navigator.clipboard.writeText(url);
        } catch (err) {
            setError('Failed to copy URL to clipboard');
        }
    };

    const handleSort = (key: keyof UrlData) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const updateExpiration = async (urlId: string, newDate: Date | null) => {
        try {
            const urlRef = doc(db, 'urls', urlId);
            await updateDoc(urlRef, {
                expirationDate: newDate ? Timestamp.fromDate(newDate) : null
            });
            setUrls(prevUrls => 
                prevUrls.map(url => 
                    url.id === urlId ? { ...url, expirationDate: newDate } : url
                )
            );
        } catch (err) {
            console.error('Failed to update expiration:', err);
            setError('Failed to update URL expiration');
        }
    };

    const handleDateSelect: SelectSingleEventHandler = (date) => {
        if (date) {
            setExpirationDate(date);
            if (selectedUrl) {
                updateExpiration(selectedUrl.id, date);
            }
        }
    };

    const sortedUrls = [...urls].sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue instanceof Date && bValue instanceof Date) {
            return sortConfig.direction === 'asc'
                ? compareDates(aValue, bValue)
                : compareDates(bValue, aValue);
        }

        if (typeof aValue === 'number' && typeof bValue === 'number') {
            return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
            return sortConfig.direction === 'asc'
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue);
        }

        return 0;
    });

    // Analytics calculations
    const totalVisits = urls.reduce((sum, url) => sum + url.visitCount, 0);
    const totalUrls = urls.length;
    const activeUrls = urls.filter(url => !isExpired(url.expirationDate)).length;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex flex-col space-y-2">
                <h1 className="text-4xl font-bold text-foreground">Dashboard</h1>
                <p className="text-muted-foreground">
                    Track and manage your shortened URLs
                </p>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalVisits}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total URLs</CardTitle>
                        <LinkIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalUrls}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active URLs</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeUrls}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>URL Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                    <DataTable
                        data={sortedUrls}
                        onCopy={handleCopy}
                        onSort={handleSort}
                        onSelect={(url) => {
                            setSelectedUrl(url);
                            setDialogOpen(true);
                        }}
                    />
                </CardContent>
            </Card>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>URL Settings</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                        {selectedUrl && (
                            <div className="space-y-4">
                                <div className="rounded-lg border p-3 text-sm space-y-2">
                                    <div className="flex items-start justify-between">
                                        <span className="text-muted-foreground">Original URL:</span>
                                        <span className="font-medium break-all text-right">{selectedUrl.originalUrl}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Created:</span>
                                        <span className="font-medium">{formatDateTime(selectedUrl.createdAt)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Visit Count:</span>
                                        <span className="font-medium">{selectedUrl.visitCount}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Expires:</span>
                                        <span className="font-medium">
                                            {selectedUrl.expirationDate
                                                ? formatDate(selectedUrl.expirationDate)
                                                : 'No expiration'}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-medium">Actions</h3>
                                        <div className="flex items-center space-x-2">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(selectedUrl.shortenedUrl);
                                                }}
                                            >
                                                <Copy className="h-4 w-4" />
                                                <span className="sr-only">Copy URL</span>
                                            </Button>
                                            <QRCodeModal url={selectedUrl.shortenedUrl} title={selectedUrl.slug} />
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8"
                                                asChild
                                            >
                                                <a href={selectedUrl.shortenedUrl} target="_blank" rel="noopener noreferrer">
                                                    <ExternalLink className="h-4 w-4" />
                                                    <span className="sr-only">Open URL</span>
                                                </a>
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium">Set Expiration</h3>
                                    <Calendar
                                        mode="single"
                                        selected={expirationDate || undefined}
                                        onSelect={(date: Date | undefined) => {
                                            setExpirationDate(date || null);
                                            if (selectedUrl && date) {
                                                updateExpiration(selectedUrl.id, date);
                                            }
                                        }}
                                        disabled={{ before: new Date() }}
                                        initialFocus
                                        className="rounded-md border"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}