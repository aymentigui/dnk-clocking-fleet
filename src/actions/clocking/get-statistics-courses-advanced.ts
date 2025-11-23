'use server';

import { prisma } from '@/lib/db';
import { startOfDay, endOfDay, format } from 'date-fns';

/**
 * Get detailed statistics for a specific region for advanced analytics
 */
export async function getDetailedRegionStatistics(regionId: string, date: Date) {
    try {
        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);

        const region = await prisma.region.findUnique({
            where: { id: regionId, deleted_at: null },
        });

        if (!region) {
            throw new Error('Region not found');
        }

        const courses = await prisma.course.findMany({
            where: {
                vehicle: {
                    region_id: regionId,
                    deleted_at: null,
                },
                start_date: {
                    gte: dayStart,
                    lte: dayEnd,
                },
            },
            include: {
                vehicle: true,
                conducteur: true,
            },
        });

        // Calculate various metrics
        const totalDuration = courses.reduce((acc, course) => {
            if (course.end_date) {
                const duration =
                    (new Date(course.end_date).getTime() - new Date(course.start_date).getTime()) /
                    (1000 * 60); // Convert to minutes
                return acc + duration;
            }
            return acc;
        }, 0);

        const averageDuration = courses.length > 0 ? Math.round(totalDuration / courses.length) : 0;

        // Group by vehicle
        const vehicleMap = new Map();
        courses.forEach((course) => {
            const vehicleId = course.vehicle_id;
            if (!vehicleMap.has(vehicleId)) {
                vehicleMap.set(vehicleId, {
                    vehicleId,
                    matricule: course.vehicle.matricule,
                    count: 0,
                    totalDuration: 0,
                });
            }
            const vehicle = vehicleMap.get(vehicleId);
            vehicle.count += 1;
            if (course.end_date) {
                const duration =
                    (new Date(course.end_date).getTime() - new Date(course.start_date).getTime()) /
                    (1000 * 60);
                vehicle.totalDuration += duration;
            }
        });

        return {
            regionId,
            regionName: region.name,
            date: format(date, 'yyyy-MM-dd'),
            totalCourses: courses.length,
            pendingCourses: courses.filter((c) => c.waiting === true).length,
            completedCourses: courses.filter((c) => c.end_station !== null && c.waiting === false)
                .length,
            inProgressCourses: courses.filter((c) => c.end_station === null && c.waiting === false)
                .length,
            totalDuration: Math.round(totalDuration),
            averageDuration,
            vehicleStats: Array.from(vehicleMap.values()),
            uniqueVehicles: vehicleMap.size,
            uniqueConductors: new Set(courses.map((c) => c.conducteur_id).filter(Boolean)).size,
        };
    } catch (error) {
        console.error('Error fetching detailed region statistics:', error);
        throw new Error('Failed to fetch detailed region statistics');
    }
}

/**
 * Get statistics for date range (e.g., weekly or monthly)
 */
export async function getStatisticsRange(regionId: string, startDate: Date, endDate: Date) {
    try {
        const start = startOfDay(startDate);
        const end = endOfDay(endDate);

        const courses = await prisma.course.findMany({
            where: {
                vehicle: {
                    region_id: regionId,
                    deleted_at: null,
                },
                start_date: {
                    gte: start,
                    lte: end,
                },
            },
            include: {
                vehicle: true,
            },
        });

        // Group by day
        const dailyStats = new Map();

        courses.forEach((course) => {
            const dayKey = format(course.start_date, 'yyyy-MM-dd');
            if (!dailyStats.has(dayKey)) {
                dailyStats.set(dayKey, {
                    date: dayKey,
                    totalCourses: 0,
                    pending: 0,
                    completed: 0,
                    inProgress: 0,
                });
            }

            const day = dailyStats.get(dayKey);
            day.totalCourses += 1;

            if (course.waiting === true) {
                day.pending += 1;
            } else if (course.end_station !== null) {
                day.completed += 1;
            } else {
                day.inProgress += 1;
            }
        });

        return Array.from(dailyStats.values()).sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
    } catch (error) {
        console.error('Error fetching statistics range:', error);
        throw new Error('Failed to fetch statistics range');
    }
}

/**
 * Export statistics as CSV format
 */
export async function exportStatisticsAsCSV(regionId: string, date: Date): Promise<string> {
    try {
        const stats = await getDetailedRegionStatistics(regionId, date);

        let csv = `Statistiques du ${stats.date}\n`;
        csv += `Région: ${stats.regionName}\n\n`;

        // Summary
        csv += `Métrique,Valeur\n`;
        csv += `Total des courses,${stats.totalCourses}\n`;
        csv += `Courses en attente,${stats.pendingCourses}\n`;
        csv += `Courses complétées,${stats.completedCourses}\n`;
        csv += `Courses en cours,${stats.inProgressCourses}\n`;
        csv += `Durée totale (minutes),${stats.totalDuration}\n`;
        csv += `Durée moyenne (minutes),${stats.averageDuration}\n`;
        csv += `Véhicules uniques,${stats.uniqueVehicles}\n`;
        csv += `Conducteurs uniques,${stats.uniqueConductors}\n\n`;

        // Vehicle details
        csv += `Statistiques des véhicules\n`;
        csv += `Matricule,Nombre de courses,Durée totale (minutes)\n`;
        stats.vehicleStats.forEach((vehicle) => {
            csv += `${vehicle.matricule},${vehicle.count},${Math.round(vehicle.totalDuration)}\n`;
        });

        return csv;
    } catch (error) {
        console.error('Error exporting statistics:', error);
        throw new Error('Failed to export statistics');
    }
}