"use server";

import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { withAuthorizationPermission, verifySession } from "../permissions";

export async function getClockings(page: number, pageSize: number, searchDate?: string): Promise<{ status: number, data: any, count: number }> {
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
                            vehicle_park: {
                                orderBy: {
                                    added_at: "desc",
                                },
                                take: 1,
                                include: {
                                    park: {
                                        select: { name: true }
                                    },
                                },
                            },
                        },
                    },
                    device: {
                        select: {
                            code: true,
                            park: {
                                select: { name: true }
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
            if (clocking.type !== 3 && clocking.park) {
                location = clocking.park.name;
            } else if (clocking.region) {
                location = clocking.region.name;
            }

            return {
                id: clocking.id,
                created_at: formattedDate,
                vehicle: clocking.vehicle.matricule,
                device: clocking.device,
                deviceType: clocking.type,
                conducteur: clocking.conducteur,
                status: clocking.status,
                park: location,
            };
        });

        return { status: 200, data: clockingFormatted, count: totalCount };
    } catch (error) {
        console.error("An error occurred in getClockings:", error);
        return { status: 500, data: { message: e("error") }, count: 0 };
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
            :{
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
                park: clocking.park && clocking.type!==3 ? clocking.park.name : clocking.region ? clocking.region.name : "",
            };
        });


        return { status: 200, data: clockingFormatted, count: vehicleClockingsCount };
    } catch (error) {
        console.log("An error occurred in getClockingsVehicle" + error);
        return { status: 500, data: { message: e("error") }, count: 0 };
    }
}
