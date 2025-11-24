'use server';

import { prisma } from '@/lib/db';
import { startOfDay, endOfDay } from 'date-fns';

export interface RegionStatistics {
    regionId: string;
    regionName: string;
    totalCourses: number;
    pendingCourses: number;
    completedCourses: number;
    inProgressCourses: number;
    totalVehicles: number;
    averageCoursesPerVehicle: number;
}

export interface VehicleStatistics {
    vehicleId: string;
    matricule: string;
    totalCourses: number;
    brand?: string;
    model?: string;
}

export async function getRegionStatistics(
    date: Date = new Date()
): Promise<RegionStatistics[]> {
    try {
        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);

        // Get all regions (not deleted)
        const regions = await prisma.region.findMany({
            where: { deleted_at: null },
        });


        const statistics: RegionStatistics[] = [];

        for (const region of regions) {

            // Get ALL courses where start_station equals region.id
            const courses = await prisma.course.findMany({
                where: {
                    start_station: region.id,
                    start_date: {
                        gte: dayStart,
                        lte: dayEnd,
                    },
                },
                include: {
                    vehicle: true,
                },
            });


            if (courses.length > 0) {
                // console.log('  Courses details:', courses.map(c => ({
                //     id: c.id,
                //     waiting: c.waiting,
                //     end_station: c.end_station,
                //     start_station: c.start_station,
                //     start_date: c.start_date,
                //     vehicle_id: c.vehicle_id,
                // })));
            }

            // Count courses by status
            const totalCourses = courses.length;
            const pendingCourses = courses.filter((c) => c.waiting === true).length;
            const completedCourses = courses.filter(
                (c) => c.end_station !== null && c.waiting === false
            ).length;
            const inProgressCourses = courses.filter(
                (c) => c.end_station === null && c.waiting === false
            ).length;

            // Get unique vehicles in this region (by start_station)
            const vehicleIds = new Set(courses.map(c => c.vehicle_id));
            const totalVehicles = vehicleIds.size;
            const averageCoursesPerVehicle =
                totalVehicles > 0 ? totalCourses / totalVehicles : 0;


            statistics.push({
                regionId: region.id,
                regionName: region.name,
                totalCourses,
                pendingCourses,
                completedCourses,
                inProgressCourses,
                totalVehicles,
                averageCoursesPerVehicle,
            });
        }

        return statistics.sort((a, b) =>
            a.regionName.localeCompare(b.regionName)
        );
    } catch (error) {
        console.error('❌ Error fetching region statistics:', error);
        throw new Error('Failed to fetch region statistics');
    }
}

export async function getVehicleStatisticsByRegion(
    regionId: string,
    date: Date = new Date()
): Promise<VehicleStatistics[]> {
    try {
        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);

        // First verify region exists
        const region = await prisma.region.findUnique({
            where: { id: regionId, deleted_at: null },
        });

        if (!region) {
            return [];
        }


        // Get all courses for this region (by start_station)
        const courses = await prisma.course.findMany({
            where: {
                start_station: regionId,
                start_date: {
                    gte: dayStart,
                    lte: dayEnd,
                },
            },
            include: {
                vehicle: true,
            },
        });

        // Group courses by vehicle
        const vehicleMap = new Map<string, VehicleStatistics>();

        courses.forEach((course) => {
            const vehicleId = course.vehicle_id;

            if (!vehicleMap.has(vehicleId)) {
                vehicleMap.set(vehicleId, {
                    vehicleId,
                    matricule: course.vehicle?.matricule || 'N/A',
                    totalCourses: 0,
                    brand: course.vehicle?.brand || undefined,
                    model: course.vehicle?.model || undefined,
                });
            }

            const stats = vehicleMap.get(vehicleId);
            if (stats) {
                stats.totalCourses += 1;
            }
        });

        const result = Array.from(vehicleMap.values())
            .sort((a, b) => b.totalCourses - a.totalCourses);

        return result;
    } catch (error) {
        throw new Error('Failed to fetch vehicle statistics');
    }
}

export async function getAllRegions() {
    try {
        const regions = await prisma.region.findMany({
            where: { deleted_at: null },
            select: {
                id: true,
                name: true,
            },
            orderBy: { name: 'asc' },
        });

        return regions;
    } catch (error) {
        console.error('❌ Error fetching regions:', error);
        throw new Error('Failed to fetch regions');
    }
}

/**
 * Debug function - returns database state info
 */
export async function getDebugInfo(date: Date = new Date()) {
    try {
        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);

        const [
            totalRegions,
            totalVehicles,
            totalCourses,
            coursesInDateRange,
            coursesWithoutEndStation,
            coursesWithWaitingTrue,
        ] = await Promise.all([
            prisma.region.count({ where: { deleted_at: null } }),
            prisma.vehicle.count({ where: { deleted_at: null } }),
            prisma.course.count(),
            prisma.course.count({
                where: {
                    start_date: { gte: dayStart, lte: dayEnd },
                },
            }),
            prisma.course.count({
                where: {
                    start_date: { gte: dayStart, lte: dayEnd },
                    end_station: null,
                },
            }),
            prisma.course.count({
                where: {
                    start_date: { gte: dayStart, lte: dayEnd },
                    waiting: true,
                },
            }),
        ]);

        const debugInfo = {
            date: date.toISOString(),
            dateRange: {
                start: dayStart.toISOString(),
                end: dayEnd.toISOString(),
            },
            totals: {
                regions: totalRegions,
                vehicles: totalVehicles,
                allCourses: totalCourses,
                coursesInDateRange,
                coursesInProgress: coursesWithoutEndStation,
                coursesPending: coursesWithWaitingTrue,
            },
        };

        return debugInfo;
    } catch (error) {
        console.error('❌ Error getting debug info:', error);
        throw error;
    }
}