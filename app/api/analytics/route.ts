import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, doc, updateDoc, increment, arrayUnion } from 'firebase/firestore';

export async function POST(req: NextRequest) {
    try {
        const { urlId, country, city, browser, os, device } = await req.json();
        
        const urlRef = doc(db, 'urls', urlId);
        await updateDoc(urlRef, {
            visitCount: increment(1),
            analytics: arrayUnion({
                timestamp: new Date(),
                country,
                city,
                browser,
                os,
                device
            })
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Analytics error:', error);
        return NextResponse.json(
            { error: 'Failed to record analytics' },
            { status: 500 }
        );
    }
}
