"use client";
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

const Layout: React.FC = ({ children }: any) => {
    const router = useRouter();
    const pathname = usePathname();
    const t = useTranslations("Menu");
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    
    const isActive = (path: string) => pathname === path;

    const navItems = [
        { path: '/admin/clockings', label: t("clockings"), icon: '👥' },
        { path: '/admin/clockings/regions', label: t("regions"), icon: '📊' },
        { path: '/admin/clockings/vehicles', label: t("vehicles"), icon: '🚗' },
        { path: '/admin/clockings/parcs', label: t("parks"), icon: '🏢' },
    ];

    const handleNavigation = (path: string) => {
        router.push(path);
        setMobileMenuOpen(false);
    };

    return (
        <div className="min-h-screen bg-foreground-50">
            <nav className="bg-background shadow-sm border-b border-foreground-200 sticky top-0 z-50">
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo ou titre (optionnel) */}
                        <div className="flex-shrink-0">
                            <h1 className="text-lg font-semibold text-foreground-900">Dashboard</h1>
                        </div>

                        {/* Navigation Desktop */}
                        <div className="hidden md:flex md:space-x-2 lg:space-x-4">
                            {navItems.map((item) => (
                                <button
                                    key={item.path}
                                    onClick={() => handleNavigation(item.path)}
                                    className={`px-3 lg:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                                        isActive(item.path)
                                            ? 'bg-blue-50 text-blue-600 border border-blue-200'
                                            : 'text-foreground-600 hover:text-gray-500 hover:bg-foreground-50'
                                    }`}
                                >
                                    <span className="mr-2">{item.icon}</span>
                                    {item.label}
                                </button>
                            ))}
                        </div>

                        {/* Bouton Menu Mobile */}
                        <div className="flex md:hidden">
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="inline-flex items-center justify-center p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                                aria-expanded="false"
                            >
                                <span className="sr-only">Ouvrir le menu</span>
                                {mobileMenuOpen ? (
                                    <X className="block h-6 w-6" />
                                ) : (
                                    <Menu className="block h-6 w-6" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Menu Mobile */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-gray-200">
                        <div className="px-2 pt-2 pb-3 space-y-1">
                            {navItems.map((item) => (
                                <button
                                    key={item.path}
                                    onClick={() => handleNavigation(item.path)}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-base font-medium transition-all duration-200 ${
                                        isActive(item.path)
                                            ? 'bg-blue-50 text-blue-600 border border-blue-200'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                >
                                    <span className="mr-2">{item.icon}</span>
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </nav>

            <main className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
                {children}
            </main>
        </div>
    );
};

export default Layout;