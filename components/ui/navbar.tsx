'use client';

import { auth } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
} from './navigation-menu';

const menuItems = [
    { href: '/profile', label: 'Profile' },
    { href: '/settings', label: 'Settings' },
];

export default function Navbar() {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
        });
        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        await signOut(auth);
    };

    return (
        <nav className="bg-primary py-4">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center">
                    <Link href="/" className="text-white text-xl font-bold">URL Shortener</Link>
                    {user ? (
                        <div className="flex items-center space-x-4">
                            <span className="text-white text-base mr-4">Welcome, {user.displayName || user.email}</span>
                            <Link href="/dashboard" className="text-white text-base hover:text-gray-200 transition-colors">
                                Dashboard
                            </Link>
                            <NavigationMenu>
                                <NavigationMenuList>
                                    <NavigationMenuItem>
                                        <NavigationMenuTrigger className={cn('text-white text-base hover:text-gray-200 bg-primary transition-colors')}>
                                            Menu
                                        </NavigationMenuTrigger>
                                        <NavigationMenuContent
                                            className="shadow-md rounded-md bg-secondary p-2 max-w-xs max-h-60 overflow-y-auto"
                                        >
                                            <ul className="grid gap-3 p-2">
                                                {menuItems.map(({ href, label }) => (
                                                    <ListItem key={href} href={href} title={label} />
                                                ))}
                                                <li>
                                                    <button
                                                        onClick={handleLogout}
                                                        className="block w-full text-left px-4 py-2 text-base text-black hover:bg-gray-100 rounded-md"
                                                    >
                                                        Logout
                                                    </button>
                                                </li>
                                            </ul>
                                        </NavigationMenuContent>
                                    </NavigationMenuItem>
                                </NavigationMenuList>
                            </NavigationMenu>
                        </div>
                    ) : (
                        <div className="flex items-center space-x-4">
                            <Link href="/login" className="text-white text-base hover:text-gray-200 transition-colors">
                                Login
                                </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}

const ListItem = ({ href, title }: { href: string; title: string }) => (
    <li>
        <NavigationMenuLink asChild>
            <Link
                href={href}
                className="block select-none space-y-1 rounded-md px-4 py-2 text-base leading-none text-black no-underline transition-colors hover:bg-accent hover:text-accent-foreground"
            >
                {title}
            </Link>
        </NavigationMenuLink>
    </li>
);
