'use client';
import { QRCodeModal } from '@/components/QRCodeModal';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { auth, db } from '@/lib/firebase';
import { shortenUrl } from '@/lib/shortenUrl';
import { formatDate, formatDateTime, isExpired } from '@/lib/utils';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, deleteDoc, doc, onSnapshot, query, where } from 'firebase/firestore';
import { Copy, ExternalLink, Loader2, Trash2, User } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

interface ShortenedUrl {
    id: string;
    shortenedUrl: string;
    originalUrl: string;
    slug: string;
    visitCount: number;
    createdAt: string | Date | null;
    expirationDate: string | Date | null;
    userId: string | null; // Updated to allow null
    userName: string;
}

export default function Home() {
    const [urls, setUrls] = useState<ShortenedUrl[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);
    const [initialized, setInitialized] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        // Listen for auth state changes
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setInitialized(true);
            setUser(currentUser); // Track user authentication state
            if (!currentUser) {
                // If not logged in, try to load from localStorage
                const storedUrls = localStorage.getItem('shortenedUrls');
                if (storedUrls) {
                    try {
                        setUrls(JSON.parse(storedUrls));
                    } catch (error) {
                        console.error('Failed to parse stored URLs');
                    }
                }
                return;
            }

            // If logged in, subscribe to Firestore updates
            // const q = query(collection(db, 'urls'), where('userId', '==', currentUser.uid));
            const q = query(collection(db, 'urls'));

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const updatedUrls = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        shortenedUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/${data.slug}`,
                        createdAt: data.createdAt?.toDate() || null,
                        expirationDate: data.expirationDate?.toDate() || null,
                        userName: data.userName || 'Unknown user'
                    };
                }) as ShortenedUrl[];
                setUrls(updatedUrls);
                localStorage.setItem('shortenedUrls', JSON.stringify(updatedUrls));
            }, (error) => {
                console.error('Firestore subscription error:', error);
                // Fallback to localStorage if Firestore fails
                const storedUrls = localStorage.getItem('shortenedUrls');
                if (storedUrls) {
                    try {
                        setUrls(JSON.parse(storedUrls));
                    } catch (error) {
                        console.error('Failed to parse stored URLs');
                    }
                }
            });

            return () => unsubscribe();
        });

        // Cleanup auth subscription
        return () => unsubscribeAuth();
    }, []);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setLoading(true);

        const formData = new FormData(event.currentTarget);
        const originalUrl = formData.get('originalUrl') as string;
        const customSlug = formData.get('customSlug') as string;
        const expirationDate = formData.get('expirationDate') as string;

        try {
            const result = await shortenUrl(originalUrl, customSlug, expirationDate);
            // Update local state immediately for better UX
            const updatedUrls = [result, ...urls];
            setUrls(updatedUrls);
            localStorage.setItem('shortenedUrls', JSON.stringify(updatedUrls));
            (event.target as HTMLFormElement).reset();
        } catch (error) {
            setError(error instanceof Error ? error.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async (url: string) => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(url);
            setTimeout(() => setCopied(null), 2000);
        } catch (error) {
            setError('Failed to copy to clipboard');
        }
    };

    const handleDelete = async (urlId: string) => {
        try {
            await deleteDoc(doc(db, 'urls', urlId));
            const updatedUrls = urls.filter(url => url.id !== urlId);
            setUrls(updatedUrls);
            localStorage.setItem('shortenedUrls', JSON.stringify(updatedUrls));
        } catch (error) {
            setError('Failed to delete URL');
        }
    };

    if (!initialized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto rounded">
                <Card className="shadow-lg">
                    <CardHeader className="bg-primary text-primary-foreground rounded-t rounded-t-lg">
                        <CardTitle className="text-4xl font-bold">Go by Rakit Digital</CardTitle>
                        <CardDescription className="text-primary-foreground/90">
                            Shorten, track, and manage your URLs
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        {user ? (
                            <form className="space-y-4" onSubmit={handleSubmit}>
                                <div>
                                    <label htmlFor="originalUrl" className="block text-sm font-medium text-foreground">
                                        Original URL
                                    </label>
                                    <Input
                                        type="url"
                                        id="originalUrl"
                                        name="originalUrl"
                                        className="mt-1"
                                        placeholder="https://example.com"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="customSlug" className="block text-sm font-medium text-foreground">
                                            Custom Slug (optional)
                                        </label>
                                        <Input
                                            type="text"
                                            id="customSlug"
                                            name="customSlug"
                                            className="mt-1"
                                            placeholder="my-custom-url"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="expirationDate" className="block text-sm font-medium text-foreground">
                                            Expiration Date (optional)
                                        </label>
                                        <Input
                                            type="date"
                                            id="expirationDate"
                                            name="expirationDate"
                                            className="mt-1"
                                            min={new Date().toISOString().split('T')[0]}
                                        />
                                    </div>
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Shortening...
                                        </>
                                    ) : (
                                        'Shorten URL'
                                    )}
                                </Button>
                            </form>
                        ) : (
                            <div className="text-center p-6">
                                <Alert>
                                    <AlertDescription>
                                        Please <Link href="/login" className="font-medium text-primary hover:underline">log in</Link> to create shortened URLs.
                                    </AlertDescription>
                                </Alert>
                            </div>
                        )}

                        {error && (
                            <Alert variant="destructive" className="mt-4">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {urls.length > 0 && (
                            <div className="mt-8">
                                <h2 className="text-2xl font-semibold mb-4 text-foreground">Your Shortened URLs</h2>
                                <div className="space-y-4">
                                    {urls.map((url) => (
                                        <Card key={url.id} className="p-4 hover:shadow-md transition-shadow">
                                            <div className="flex flex-col space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-2">
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => handleCopy(url.shortenedUrl)}
                                                        >
                                                            <Copy className="h-4 w-4" />
                                                        </Button>
                                                        <QRCodeModal url={url.shortenedUrl} title={url.slug} />
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            asChild
                                                        >
                                                            <a href={url.shortenedUrl} target="_blank" rel="noopener noreferrer">
                                                                <ExternalLink className="h-4 w-4" />
                                                            </a>
                                                        </Button>
                                                    </div>
                                                    <div className="flex space-x-2">
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() => handleDelete(url.id)}
                                                            className="flex items-center space-x-1"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                            <span className="sr-only">Delete URL</span>
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="text-lg font-medium text-primary mt-1">
                                                    {url.shortenedUrl}
                                                </div>
                                                <div className="text-sm text-muted-foreground overflow-hidden">
                                                    <span className="font-medium">Original:</span>{' '}
                                                    <span className="overflow-hidden text-ellipsis block whitespace-nowrap max-w-full" title={url.originalUrl}>
                                                        {url.originalUrl}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap justify-between gap-2 text-sm text-muted-foreground">
                                                    <span>Created: {formatDateTime(url.createdAt)}</span>
                                                    <span>Visits: {url.visitCount || 0}</span>
                                                    {url.expirationDate && (
                                                        <span className={isExpired(url.expirationDate) ? 'text-destructive' : ''}>
                                                            Expires: {formatDate(url.expirationDate)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-sm flex items-center text-muted-foreground pt-1 border-t">
                                                    <User className="h-3 w-3 mr-1" />
                                                    <span>Created by: {url.userName}</span>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}