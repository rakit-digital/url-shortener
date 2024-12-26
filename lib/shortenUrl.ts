import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { nanoid } from 'nanoid';
import { db, auth } from '@/lib/firebase';
import { isValidUrl } from '@/lib/utils';

export async function shortenUrl(originalUrl: string, customSlug?: string, expirationDate?: string) {
    if (!isValidUrl(originalUrl)) {
        throw new Error('Invalid URL format');
    }

    const user = auth.currentUser;
    let slug = customSlug?.trim() || nanoid(6);

    // Validate custom slug format
    if (customSlug && !/^[a-zA-Z0-9-_]+$/.test(customSlug)) {
        throw new Error('Custom slug can only contain letters, numbers, hyphens, and underscores');
    }

    // Check if the slug already exists
    const q = query(collection(db, 'urls'), where('slug', '==', slug));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        if (customSlug) {
            throw new Error('This custom slug is already in use');
        }
        // If it's an auto-generated slug, try again with a new one
        return shortenUrl(originalUrl, nanoid(6), expirationDate);
    }

    // Create new shortened URL
    const urlDoc = await addDoc(collection(db, 'urls'), {
        originalUrl,
        slug,
        visitCount: 0,
        createdAt: new Date(),
        expirationDate: expirationDate ? new Date(expirationDate) : null,
        userId: user?.uid ?? null,
    });

    // Construct the full shortened URL using the base URL
    const shortenedUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/${slug}`;

    return {
        id: urlDoc.id,
        shortenedUrl,
        originalUrl,
        slug,
        visitCount: 0,
        createdAt: new Date(),
        expirationDate: expirationDate ? new Date(expirationDate) : null,
    };
}