// app/dashboard/statistics/StatisticsClient.tsx
'use client';

import { useState, useEffect } from 'react';
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import {
    Car,
    Building,
    Smartphone,
    Users,
    AlertTriangle,
    TrendingUp
} from 'lucide-react';
import { useLocale } from 'next-intl';

interface StatsData {
    vehicles: number;
    parks: number;
    devices: number;
    users: number;
    vehiclesNoPark: number;
    parkVehicles: Array<{ name: string; count: number }>;
}

interface StatisticsClientProps {
    statsData: StatsData;
    translations: {
        title: string;
        vehicles: string;
        parks: string;
        devices: string;
        users: string;
        vehiclesNoPark: string;
        statistics: string;
        total: string;
        distribution: string;
        vehiclesByStation: string;
        loading: string;
        attentionRequired: string;
        unassignedVehicles: (count: number) => string;
    };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function StatisticsClient({ statsData, translations }: StatisticsClientProps) {
    const [mounted, setMounted] = useState(false);
    const locale = useLocale()

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const mainStats = [
        {
            label: translations.vehicles,
            value: statsData.vehicles,
            icon: Car,
            color: 'bg-blue-500',
            trend: ''
        },
        {
            label: translations.parks,
            value: statsData.parks,
            icon: Building,
            color: 'bg-green-500',
            trend: ''
        },
        {
            label: translations.devices,
            value: statsData.devices,
            icon: Smartphone,
            color: 'bg-purple-500',
            trend: ''
        },
        {
            label: translations.users,
            value: statsData.users,
            icon: Users,
            color: 'bg-orange-500',
            trend: ''
        }
    ];

    const vehiclesDistribution = [
        { name: 'With Station', value: statsData.vehicles - statsData.vehiclesNoPark },
        { name: 'Without Station', value: statsData.vehiclesNoPark }
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {translations.title}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        {translations.statistics}
                    </p>
                </div>

                {/* Main Statistics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {mainStats.map((stat, index) => {
                        const IconComponent = stat.icon;
                        return (
                            <div
                                key={stat.label}
                                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                            {stat.label}
                                        </p>
                                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                                            {stat.value.toLocaleString()}
                                        </p>
                                        <div className="flex items-center mt-2">
                                            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                                            <span className="text-sm text-green-500 font-medium">
                                                {stat.trend}
                                            </span>
                                        </div>
                                    </div>
                                    <div className={`${stat.color} p-3 rounded-lg`}>
                                        <IconComponent className="h-6 w-6 text-white" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
                    {/* Vehicles by Station Chart */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                            {translations.vehiclesByStation}
                        </h3>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={statsData.parkVehicles}>
                                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                    <XAxis
                                        dataKey="name"
                                        angle={-45}
                                        textAnchor={locale === 'ar' ? 'start' : 'end'}
                                        height={80}
                                        tick={{ fontSize: 12 }}
                                    />
                                    <YAxis textAnchor={locale === 'ar' ? 'start' : 'end'}/>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '8px',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                        }}
                                    />
                                    <Legend />
                                    <Bar
                                        dataKey="count"
                                        name="Number of Vehicles"
                                        fill="#3B82F6"
                                        radius={[4, 4, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Alert for vehicles without station */}
                {statsData.vehiclesNoPark > 0 && (
                    <div className="mt-8 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
                        <div className="flex items-center">
                            <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400 mr-3" />
                            <div>
                                <h4 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300">
                                    {translations.attentionRequired}
                                </h4>
                                <p className="text-yellow-700 dark:text-yellow-400 mt-1">
                                    {translations.unassignedVehicles(statsData.vehiclesNoPark)}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}