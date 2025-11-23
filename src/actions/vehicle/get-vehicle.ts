'use server';

import { prisma } from '@/lib/db';
import { startOfDay, endOfDay } from 'date-fns';

export interface VehicleDetails {
    id: string;
    matricule: string | null;
    vin: string | null;
    model: string | null;
    year: number | null;
    brand: string | null;
    status: string | null;
    in_park: boolean;
    created_at: Date;
}

export interface VehicleParkHistory {
    id: string;
    parkId: string | null;
    parkName: string | null;
    added_at: Date;
    added_by_username: string | null;
}

export interface VehicleRegionHistory {
    id: string;
    regionId: string | null;
    regionName: string | null;
    type: string | null; // 1 or 2
    added_at: Date;
    added_by_username: string | null;
}

export interface VehicleClocking {
    id: string;
    created_at: Date;
    parkId: string | null;
    parkName: string | null;
    conducteur_name: string | null;
    conducteur_matricule: string | null;
    type: number | null;
    status: number | null;
}

export interface VehicleCourse {
    id: string;
    start_date: Date;
    end_date: Date | null;
    conducteur_name: string;
    conducteur_matricule: string;
    start_station: string | null;
    end_station: string | null;
    waiting: boolean;
}

export interface VehicleStatistics {
    totalCourses: number;
    totalClockings: number;
    currentStatus: string | null;
    inPark: boolean;
    lastCourseDate: Date | null;
    lastClockingDate: Date | null;
    totalParkHistory: number;
    totalRegionHistory: number;
}

/**
 * Get vehicle details by ID
 */
export async function getVehicleDetails(vehicleId: string): Promise<VehicleDetails | null> {
    try {
        const vehicle = await prisma.vehicle.findUnique({
            where: { id: vehicleId, deleted_at: null },
        });

        if (!vehicle) {
            // console.log(`❌ Vehicle not found: ${vehicleId}`);
            return null;
        }

        // console.log(`✅ Vehicle found: ${vehicle.matricule}`);

        return {
            id: vehicle.id,
            matricule: vehicle.matricule,
            vin: vehicle.vin,
            model: vehicle.model,
            year: vehicle.year,
            brand: vehicle.brand,
            status: vehicle.status,
            in_park: vehicle.in_park,
            created_at: vehicle.created_at,
        };
    } catch (error) {
        return null;
        // console.error('❌ Error fetching vehicle details:', error);
        // throw new Error('Failed to fetch vehicle details');
    }
}

/**
 * Get vehicle statistics (total courses, clockings, etc.)
 */
export async function getVehicleStatistics(vehicleId: string): Promise<VehicleStatistics> {
    try {
        const [totalCourses, totalClockings, lastCourse, lastClocking, parkHistory, regionHistory] =
            await Promise.all([
                prisma.course.count({
                    where: { vehicle_id: vehicleId },
                }),
                prisma.clocking.count({
                    where: { vehicle_id: vehicleId },
                }),
                prisma.course.findFirst({
                    where: { vehicle_id: vehicleId },
                    orderBy: { start_date: 'desc' },
                    select: { start_date: true },
                }),
                prisma.clocking.findFirst({
                    where: { vehicle_id: vehicleId },
                    orderBy: { created_at: 'desc' },
                    select: { created_at: true },
                }),
                prisma.vehicle_park.count({
                    where: { vehicle_id: vehicleId },
                }),
                prisma.vehicle_region.count({
                    where: { vehicle_id: vehicleId },
                }),
            ]);

        const vehicle = await prisma.vehicle.findUnique({
            where: { id: vehicleId, deleted_at: null },
            select: { status: true, in_park: true },
        });

        return {
            totalCourses,
            totalClockings,
            currentStatus: vehicle?.status || null,
            inPark: vehicle?.in_park || false,
            lastCourseDate: lastCourse?.start_date || null,
            lastClockingDate: lastClocking?.created_at || null,
            totalParkHistory: parkHistory,
            totalRegionHistory: regionHistory,
        };
    } catch (error) {
        // console.error('❌ Error fetching vehicle statistics:', error);
        // throw new Error('Failed to fetch vehicle statistics');
        return {
            totalCourses: 0,
            totalClockings: 0,
            currentStatus: null,
            inPark: false,
            lastCourseDate: null,
            lastClockingDate: null,
            totalParkHistory: 0,
            totalRegionHistory: 0,
        }
    }
}

/**
 * Get vehicle park history (historique des parcs)
 */
export async function getVehicleParkHistory(vehicleId: string): Promise<VehicleParkHistory[]> {
    try {
        const history = await prisma.vehicle_park.findMany({
            where: { vehicle_id: vehicleId },
            include: {
                park: {
                    select: { name: true },
                },
                user: {
                    select: { username: true },
                },
            },
            orderBy: { added_at: 'desc' },
        });

        return history.map(item => ({
            id: item.id,
            parkId: item.park_id,
            parkName: item.park?.name || null,
            added_at: item.added_at,
            added_by_username: item.user?.username || null,
        }));
    } catch (error) {
        // console.error('❌ Error fetching park history:', error);
        // throw new Error('Failed to fetch park history');
        return []
    }
}

/**
 * Get vehicle region history (historique des régions)
 */
export async function getVehicleRegionHistory(vehicleId: string): Promise<VehicleRegionHistory[]> {
    try {
        const history = await prisma.vehicle_region.findMany({
            where: { vehicle_id: vehicleId },
            include: {
                region: {
                    select: { name: true },
                },
                user: {
                    select: { username: true },
                },
            },
            orderBy: { added_at: 'desc' },
        });

        return history.map(item => ({
            id: item.id,
            regionId: item.region_id,
            regionName: item.region?.name || null,
            type: item.type,
            added_at: item.added_at,
            added_by_username: item.user?.username || null,
        }));
    } catch (error) {
        // console.error('❌ Error fetching region history:', error);
        // throw new Error('Failed to fetch region history');
        return []
    }
}

/**
 * Get vehicle clockings for a specific date
 */
export async function getVehicleClockings(
    vehicleId: string,
    date: Date = new Date()
): Promise<VehicleClocking[]> {
    try {
        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);

        const clockings = await prisma.clocking.findMany({
            where: {
                vehicle_id: vehicleId,
                created_at: {
                    gte: dayStart,
                    lte: dayEnd,
                },
            },
            include: {
                park: {
                    select: { name: true },
                },
                region: {
                    select: { name: true },
                },
            },
            orderBy: { created_at: 'desc' },
        });

        return clockings.map(c => ({
            id: c.id,
            created_at: c.created_at,
            parkId: c.park_id,
            parkName: c.park?.name || c.region?.name || null,
            conducteur_name: c.conducteur_name,
            conducteur_matricule: c.conducteur_matricule,
            type: c.type,
            status: c.status,
        }));
    } catch (error) {
        // console.error('❌ Error fetching clockings:', error);
        // throw new Error('Failed to fetch clockings');
        return []
    }
}

/**
 * Get vehicle courses for a specific date
 */
export async function getVehicleCourses(
    vehicleId: string,
    date: Date = new Date()
): Promise<VehicleCourse[]> {
    try {
        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);


        // 1️⃣ Récupérer les courses SANS JOIN
        const courses = await prisma.course.findMany({
            where: {
                vehicle_id: vehicleId,
                start_date: {
                    gte: dayStart,
                    lte: dayEnd,
                },
            },
            orderBy: { start_date: 'desc' },
        });


        // 2️⃣ Récupérer tous les IDs de stations uniques (start_station + end_station)
        const stationIds = new Set<string>();
        courses.forEach(c => {
            if (c.start_station) stationIds.add(c.start_station);
            if (c.end_station) stationIds.add(c.end_station);
        });

        // 3️⃣ Récupérer les noms de régions pour tous les stations
        let regions: { id: string; name: string }[] = [];
        if (stationIds.size > 0) {
            regions = await prisma.region.findMany({
                where: {
                    id: {
                        in: Array.from(stationIds),
                    },
                },
                select: {
                    id: true,
                    name: true,
                },
            });
        }

        // 4️⃣ Créer une map pour accès rapide aux noms
        const regionMap = new Map(
            regions.map(region => [region.id, region.name])
        );

        // 5️⃣ Retourner les courses avec les noms
        return courses.map(c => ({
            id: c.id,
            start_date: c.start_date,
            end_date: c.end_date,
            conducteur_name: c.conducteur_name,
            conducteur_matricule: c.conducteur_matricule,
            // start_station: c.start_station,
            start_station: c.start_station ? regionMap.get(c.start_station) || null : null,
            // end_station: c.end_station,
            end_station: c.end_station ? regionMap.get(c.end_station) || null : null,
            waiting: c.waiting,
        }));
    } catch (error) {
        // console.error('❌ Error fetching courses:', error);
        // throw new Error('Failed to fetch courses');
        return []
    }
}