"use server";

import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { withAuthorizationPermission, verifySession } from "../permissions";

export async function getClockings(page: number, pageSize: number, searchDate?: string, park?: String): Promise<{ status: number, data: any, count: number, countExit: number, total_clockings: number, totalScannBusHaveExistedParkAndNotEntredRegion: number }> {
    const e = await getTranslations('Error');
    try {
        const session = await verifySession();
        if (!session?.data?.user) {
            return { status: 401, data: { message: e("unauthorized") }, count: 0, countExit: 0, total_clockings: 0, totalScannBusHaveExistedParkAndNotEntredRegion: 0 };
        }
        const hasPermission = await withAuthorizationPermission(['clocking_view'], session.data.user.id);

        if (hasPermission.status != 200 || !hasPermission.data.hasPermission) {
            return { status: 403, data: { message: e('forbidden') }, count: 0, countExit: 0, total_clockings: 0, totalScannBusHaveExistedParkAndNotEntredRegion: 0 };
        }

        // Build where condition for date filter
        const whereCondition: any = {};

        if (searchDate) {
            const start = new Date(searchDate);
            start.setHours(0, 0, 0, 0);

            const end = new Date(searchDate);
            end.setHours(23, 59, 59, 999);

            whereCondition.created_at = {
                gte: start,
                lte: end,
            };
        }

        if (park && park !== "all" && park !== "") {
            whereCondition.park_id = park;
        }

        // Get clockings with pagination
        const [clockings, totalCount] = await Promise.all([
            prisma.clocking.findMany({
                skip: (page - 1) * pageSize,
                take: pageSize,
                orderBy: {
                    created_at: "desc",
                },
                where: whereCondition,
                include: {
                    park: {
                        select: { name: true }
                    },
                    region: {
                        select: { name: true }
                    },
                    conducteur: {
                        select: {
                            id: true,
                            firstname: true,
                            lastname: true,
                            matricule: true
                        }
                    },
                    vehicle: {
                        select: {
                            matricule: true,
                        },
                    },
                    device: {
                        select: {
                            code: true,
                            type: true,
                            park: {
                                select: { name: true, }
                            },
                        },
                    },
                },
            }),
            prisma.clocking.count({
                where: whereCondition
            })
        ]);

        // Format clockings data
        const clockingFormatted = clockings.map((clocking) => {
            const date = new Date(clocking.created_at);
            const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

            // Determine location based on device type
            let location = "";
            if (clocking.type !== 3 && clocking.type !== 4 && clocking.park) {
                location = clocking.park.name;
            } else if (clocking.region) {
                location = clocking.region.name;
            }

            return {
                id: clocking.id,
                created_at: formattedDate,
                vehicle: clocking.vehicle.matricule,
                device: clocking.device,
                deviceType: clocking.device.type,
                type: clocking.type,
                conducteur: clocking.conducteur,
                status: clocking.status,
                park: location,
            };
        });

        let countExit = 0;
        let total_clockings = 0;
        let totalScannBusHaveExistedParkAndNotEntredRegion = 0;

        try {
            const whereCondition1 = { ...whereCondition };
            whereCondition1.type = 0;
            const uniqueVehicles = await prisma.clocking.findMany({
                where: whereCondition1,
                distinct: ['vehicle_id'],      // ⚠️ remplace si le champ a un autre nom
                select: { vehicle_id: true },
            });
            countExit = uniqueVehicles.length;

            total_clockings = await prisma.clocking.count({
                where: whereCondition
            });

            // Count vehicles that have exited park but not entered region
            const whereCondition2 = { ...whereCondition };
            whereCondition2.type = 0;
            const exitedVehicles = await prisma.clocking.findMany({
                where: whereCondition2,
                distinct: ['vehicle_id'],
                select: { vehicle_id: true },
            });
            const exitedVehicleIds = exitedVehicles.map(v => v.vehicle_id);
            const enteredVehicles = await prisma.clocking.findMany({
                where: {
                    ...whereCondition,
                    type: 4,
                    vehicle_id: { in: exitedVehicleIds },
                },
                distinct: ['vehicle_id'],
                select: { vehicle_id: true },
            });
            const enteredVehicleIds = new Set(enteredVehicles.map(v => v.vehicle_id));
            totalScannBusHaveExistedParkAndNotEntredRegion = exitedVehicleIds.filter(id => !enteredVehicleIds.has(id)).length;
        }
        catch (error) {
            console.error("An error occurred while counting unique vehicles:", error);
        }

        return { status: 200, data: clockingFormatted, count: totalCount, countExit, total_clockings, totalScannBusHaveExistedParkAndNotEntredRegion };
    } catch (error) {
        console.error("An error occurred in getClockings:", error);
        return { status: 500, data: { message: e("error") }, count: 0, countExit: 0, total_clockings: 0, totalScannBusHaveExistedParkAndNotEntredRegion: 0 };
    }
}

export async function getClockingsVehicle(vehicle_id: string, page: number, pageSize: number, searchDate?: string): Promise<{ status: number, data: any, count: number }> {
    const e = await getTranslations('Error');


    try {
        const session = await verifySession();
        if (!session?.data?.user) {
            return { status: 401, data: { message: e("unauthorized") }, count: 0 };
        }
        const hasPermission = await withAuthorizationPermission(['clocking_view'], session.data.user.id);

        if (hasPermission.status != 200 || !hasPermission.data.hasPermission) {
            return { status: 403, data: { message: e('forbidden') }, count: 0 };
        }

        let start = new Date();
        let end = new Date();
        if (searchDate) {
            start = new Date(searchDate);
            start.setHours(0, 0, 0, 0);

            end = new Date(searchDate);
            end.setHours(23, 59, 59, 999);
        }

        const clockings = await prisma.clocking.findMany({
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: {
                created_at: "desc",
            },
            where: searchDate ?
                {
                    created_at: {
                        gte: start,
                        lte: end,
                    },
                    vehicle_id: vehicle_id
                }
                : {
                    vehicle_id: vehicle_id
                },
            include: {
                park: true,
                region: true,
                conducteur: true,
                vehicle: {
                    include: {
                        vehicle_park: {
                            orderBy: {
                                added_at: "desc",
                            },
                            take: 1,
                            include: {
                                park: true,
                            },
                        },
                    },
                },
                device: {
                    include: {
                        park: true,
                    },
                },
            },
        });

        const vehicleClockingsCount = await prisma.clocking.count(
            {
                where: {
                    vehicle: {
                        id: vehicle_id
                    }
                }
            }
        );

        const clockingFormatted = clockings.map((clocking) => {
            return {
                id: clocking.id,
                created_at: clocking.created_at.getDate() + "/" + (clocking.created_at.getMonth() + 1) + "/" + clocking.created_at.getFullYear() + " " + clocking.created_at.getHours() + ":" + clocking.created_at.getMinutes(),
                vehicle: clocking.vehicle,
                device: clocking.device,
                deviceType: clocking.type,
                status: clocking.status,
                conducteur: clocking.conducteur,
                park: clocking.park && clocking.type !== 3 ? clocking.park.name : clocking.region ? clocking.region.name : "",
            };
        });


        return { status: 200, data: clockingFormatted, count: vehicleClockingsCount };
    } catch (error) {
        console.log("An error occurred in getClockingsVehicle" + error);
        return { status: 500, data: { message: e("error") }, count: 0 };
    }
}


export async function getClockingsVehicleNow(vehicle_id?: string, park?: string, region?: string): Promise<{ status: number, data: any }> {
    try {
        const e = await getTranslations('Error');

        const session = await verifySession();
        if (!session?.data?.user) {
            return { status: 401, data: { message: e("unauthorized") }, };
        }
        const hasPermission = await withAuthorizationPermission(['clocking_view'], session.data.user.id);

        if (hasPermission.status != 200 || !hasPermission.data.hasPermission) {
            return { status: 403, data: { message: e('forbidden') } };
        }

        const conditions: any = {}

        if(vehicle_id && vehicle_id!==""){
            conditions.vehicle_id=vehicle_id
        }

        if(park && park !== "all" && park !== ""){
            conditions.park_id = park;
        }
        if(region && region !== "all" && region !== ""){
            conditions.region_id = region;
        }

        let countClockings = 0;
        let countExitParcClockings = 0;
        let countEnterParcClockings = 0;
        let countEnterRegionClockings = 0;
        let countExitRegionClockings = 0;
        let countVehicleWithoutEnteringRegion = 0;
        let countVehicles=0;

        const clocking = await prisma.clocking.findMany({
            where: {
                ...conditions,
                created_at: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    lte: new Date(new Date().setHours(23, 59, 59, 999)),
                },
            },
            orderBy: {
                created_at: "desc",
            },
            include: {
                vehicle: true,
            },
        });

        const clockings = await prisma.clocking.findMany({
            where: {
                ...conditions,
                created_at: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    lt: new Date(new Date().setHours(23, 59, 59, 999)),
                },
            },
            orderBy: {
                created_at: 'asc',
            },
            include: {
                vehicle: true,
                park: true,
                conducteur: true,
            },
        });

        countClockings = clocking.length;

        // Filtrer pour garder uniquement le premier clocking de chaque véhicule
        const firstClockingsByVehicle = new Map();

        clockings.forEach((clocking) => {
            if (!firstClockingsByVehicle.has(clocking.vehicle_id)) {
                firstClockingsByVehicle.set(clocking.vehicle_id, clocking);
            }
        });

        // Filtrer ceux où park_id est null
        const result = Array.from(firstClockingsByVehicle.values()).filter(
            (clocking) => clocking.park_id === null
        );

        clocking.forEach((c) => {
            if (c.type === 0) {
                countExitParcClockings++;
            } else if (c.type === 1) {
                countEnterParcClockings++;
            } else if (c.type === 3) {
                countEnterRegionClockings++;
            } else if (c.type === 4) {
                countExitRegionClockings++;
            }
        });

        countExitParcClockings = countExitParcClockings + result.length;

        
        const exitedVehicles = await prisma.clocking.findMany({
            where: {
                created_at: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    lt: new Date(new Date().setHours(23, 59, 59, 999)),
                },
                type: 0,
            },
            distinct: ['vehicle_id'],
            select: { vehicle_id: true },
        });
        const exitedVehicleIds = exitedVehicles.map(v => v.vehicle_id);
        const enteredVehicles = await prisma.clocking.findMany({
            where: {
                created_at: {
                    gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    lt: new Date(new Date().setHours(23, 59, 59, 999)),
                },
                type: 4,
                vehicle_id: { in: exitedVehicleIds },
            },
            distinct: ['vehicle_id'],
            select: { vehicle_id: true },
        });
        const enteredVehicleIds = new Set(enteredVehicles.map(v => v.vehicle_id));
        countVehicleWithoutEnteringRegion = exitedVehicleIds.filter(id => !enteredVehicleIds.has(id)).length;

        countVehicles= await prisma.vehicle.count({
            where: {
                ...conditions
            }
        });

        return {
            status: 200, data: {
                clocking,
                countClockings,
                countExitParcClockings,
                countEnterParcClockings,
                countEnterRegionClockings,
                countExitRegionClockings,
                countVehicleWithoutEnteringRegion,
                countVehicles
            }
        };

    } catch (error) {
        console.log("An error occurred in getClockingsVehicleNow" + error);
        const e = await getTranslations('Error');
        return { status: 500, data: { message: e("error") } };
    }
}