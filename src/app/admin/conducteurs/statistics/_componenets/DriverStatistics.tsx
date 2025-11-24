'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { PeriodSelector } from './PeriodSelector';
import { StatsCard } from './StatsCard';
import { DriversTable } from './DriversTable';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { RefreshCw, Download } from 'lucide-react';
import { getConducteursStatistics } from '@/actions/conducteur/get-statistics';
import { DailyTopWorkers } from './DailyTopWorkers';

interface DriverStats {
    id: string;
    matricule: string;
    firstname: string;
    lastname: string;
    rotations: number;
    clockins: number;
}

interface SummaryStats {
    totalDrivers: number;
    activeDrivers: number;
    averageRotations: number;
    averageClockins: number;
    workingDrivers: number;
    nonWorkingDrivers: number;
}

interface StatisticsData {
    current: DriverStats[];
    previous: DriverStats[];
    summary: SummaryStats;
    period: string;
    dailyTopWorkers:any
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function DriverStatistics() {
    const t = useTranslations('StatisticsConducteurs');
    const [period, setPeriod] = useState('week');
    const [data, setData] = useState<StatisticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [period]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await getConducteursStatistics(period)
            const result = response.data;
            setData(result);
        } catch (error) {
            console.error('Error fetching statistics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !data) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const { current, previous, summary } = data;

    // Top 10 performers
    const topPerformers = [...current]
        .sort((a, b) => (b.rotations + b.clockins) - (a.rotations + a.clockins))
        .slice(0, 10);

    // Least active drivers
    const leastActive = [...current]
        .sort((a, b) => (a.rotations + a.clockins) - (b.rotations + b.clockins))
        .slice(0, 10);

    // Drivers with no activity
    const nonWorkingDrivers = current.filter(driver => driver.rotations === 0 && driver.clockins === 0);

    // Chart data for working vs non-working
    const workingChartData = [
        { name: t('workingDrivers'), value: summary.workingDrivers },
        { name: t('nonWorkingDrivers'), value: summary.nonWorkingDrivers }
    ];

    // Comparison data
    const previousSummary = {
        totalDrivers: previous.length,
        activeDrivers: previous.filter(d => d.rotations > 0 || d.clockins > 0).length,
        workingDrivers: previous.filter(d => d.rotations > 0).length,
        nonWorkingDrivers: previous.length - previous.filter(d => d.rotations > 0).length,
        averageRotations: previous.length > 0 ?
            previous.reduce((sum, d) => sum + d.rotations, 0) / previous.length : 0,
        averageClockins: previous.length > 0 ?
            previous.reduce((sum, d) => sum + d.clockins, 0) / previous.length : 0
    };

    const calculateChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{t('driverStatistics')}</h1>
                        <p className="text-gray-600 mt-2">{t('overview')}</p>
                    </div>
                    <div className="flex space-x-3">
                        <button
                            onClick={fetchData}
                            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            <span>{t('refreshData')}</span>
                        </button>
                        {/* <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            <Download className="w-4 h-4" />
                            <span>{t('downloadReport')}</span>
                        </button> */}
                    </div>
                </div>

                {/* Period Selector */}
                <div className="mb-8">
                    <PeriodSelector period={period} onPeriodChange={setPeriod} />
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatsCard
                        title={t('totalDrivers')}
                        value={summary.totalDrivers}
                        change={calculateChange(summary.totalDrivers, previousSummary.totalDrivers)}
                        previousValue={previousSummary.totalDrivers}
                    />
                    <StatsCard
                        title={t('activeDrivers')}
                        value={summary.activeDrivers}
                        change={calculateChange(summary.activeDrivers, previousSummary.activeDrivers)}
                        previousValue={previousSummary.activeDrivers}
                    />
                    <StatsCard
                        title={t('averageRotations')}
                        value={summary.averageRotations}
                        change={calculateChange(summary.averageRotations, previousSummary.averageRotations)}
                        previousValue={previousSummary.averageRotations}
                        format={(value) => value.toFixed(1)}
                    />
                    <StatsCard
                        title={t('averageClockins')}
                        value={summary.averageClockins}
                        change={calculateChange(summary.averageClockins, previousSummary.averageClockins)}
                        previousValue={previousSummary.averageClockins}
                        format={(value) => value.toFixed(1)}
                    />
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Working vs Non-Working Pie Chart */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="text-lg font-semibold mb-4">{t('workingDrivers')} vs {t('nonWorkingDrivers')}</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={workingChartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    direction={"ltr"}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {workingChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Performance Comparison */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="text-lg font-semibold mb-4">{t('performance')} {t('comparison')}</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={[
                                {
                                    name: t('workingDrivers'),
                                    current: summary.workingDrivers,
                                    previous: previousSummary.workingDrivers
                                },
                                {
                                    name: t('averageRotations'),
                                    current: summary.averageRotations,
                                    previous: previousSummary.averageRotations
                                },
                                {
                                    name: t('averageClockins'),
                                    current: summary.averageClockins,
                                    previous: previousSummary.averageClockins
                                }
                            ]}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="current" fill="#0088FE" name={t('current')} />
                                <Bar dataKey="previous" fill="#00C49F" name={t('previous')} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Tables */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <DriversTable
                        drivers={topPerformers}
                        title={t('topPerformers')}
                        showComparison={true}
                        previousDrivers={previous}
                    />
                    <DriversTable
                        drivers={leastActive}
                        title={t('leastActive')}
                        showComparison={true}
                        previousDrivers={previous}
                    />
                </div>

                <div className="mb-8">
                    <DailyTopWorkers data={data.dailyTopWorkers} />
                </div>

                {/* Non-Working Drivers */}
                {nonWorkingDrivers.length > 0 && (
                    <div className="mb-8">
                        <DriversTable
                            drivers={nonWorkingDrivers}
                            title={`${t('nonWorkingDrivers')} (${nonWorkingDrivers.length})`}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}