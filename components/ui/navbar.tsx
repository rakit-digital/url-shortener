'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
} from './navigation-menu';
import { cn } from '@/lib/utils'; // utility function for classnames

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
        <nav className="bg-primary p-4 shadow-lg">
            <div className="container mx-auto flex justify-between items-center">
                <Link href="/" className="text-white text-2xl font-bold hover:text-gray-200 transition-colors">
                    URL Shortener
                </Link>
                <div>
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
                                        <NavigationMenuContent className="shadow-md rounded-md bg-secondary p-2">
                                            <ul className="grid gap-3 p-4 md:w-[400px]">
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
                            <Link href="/signup" className="text-white text-base hover:text-gray-200 transition-colors">
                                Sign Up
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}

// Reusable ListItem component for menu links
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
