'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SignupPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect after a brief delay so the user sees the message
        const timeout = setTimeout(() => {
            router.push('/login');
        }, 2000);

        return () => clearTimeout(timeout);
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="w-full max-w-md">
                <Card className="shadow-lg">
                    <CardHeader className="space-y-1 text-center">
                        <CardTitle className="text-2xl font-bold">Registration Disabled</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Alert>
                            <AlertDescription className="flex items-center space-x-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Registration is currently disabled. Redirecting to login...</span>
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}