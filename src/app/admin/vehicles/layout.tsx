"use client";
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import React from 'react';

const Layout: React.FC = ({ children }: any) => {
    const router = useRouter();
    const pathname = usePathname();
    const t= useTranslations("Menu")
    const isActive = (path: string) => pathname === path;

    return (
        <div>
            <nav className="bg-white shadow-sm border-b border-gray-200">
                <div className="px-6 py-4">
                    <div className="flex space-x-8">
                        <button
                            onClick={() => router.push('/admin/vehicles')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive('/admin/vehicles')
                                    ? 'bg-blue-50 text-blue-600 border border-blue-200'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                        >
                            👥 {t("vehicles")}
                        </button>

                        <button
                            onClick={() => router.push('/admin/vehicles/statistics')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive('/admin/vehicles/statistics')
                                    ? 'bg-blue-50 text-blue-600 border border-blue-200'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                        >
                            📊 {t("clockings_statistics")}
                        </button>
                    </div>
                </div>
            </nav>
            <main style={{ padding: '1rem' }}>
                {children}
            </main>
        </div>
    );
};

export default Layout;