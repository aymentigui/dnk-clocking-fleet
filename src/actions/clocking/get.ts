"use server"

import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { withAuthorizationPermission, verifySession } from "../permissions";

export async function getClockings(page: number, pageSize: number): Promise<{ status: number, data: any, count: number }> {
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

        const clockings = await prisma.clocking.findMany({
            skip: page * pageSize,
            take: pageSize,
            orderBy: {
                created_at: "desc",
            },
            include: {
                park: true,
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

        const clockingFormatted = clockings.map((clocking) => {
            return {
                id: clocking.id,
                created_at: clocking.created_at.getDate() + "/" + (clocking.created_at.getMonth() + 1) + "/" + clocking.created_at.getFullYear()+" " + clocking.created_at.getHours() + ":" + clocking.created_at.getMinutes(),
                vehicle: clocking.vehicle,
                vehicle_park: clocking.vehicle.vehicle_park[0] ? clocking.vehicle.vehicle_park[0].park : null,
                device: clocking.device,
                park: clocking.park ? clocking.park.name : null,
            };
        });

        const vehicleClockingsCount = await prisma.clocking.count();

        return { status: 200, data: clockingFormatted, count: vehicleClockingsCount };
    } catch (error) {
        console.error("An error occurred in getClockings" + error);
        return { status: 500, data: { message: e("error") }, count: 0 };
    }
}

export async function getClockingsVehicle(vehicle_id: string, page: number, pageSize: number): Promise<{ status: number, data: any, count: number }> {
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

        const clockings = await prisma.clocking.findMany({
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: {
                created_at: "desc",
            },
            where: {
                vehicle_id: vehicle_id
            },
            include: {
                park: true,
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
                created_at: clocking.created_at.getDate() + "/" + (clocking.created_at.getMonth() + 1) + "/" + clocking.created_at.getFullYear()+" " + clocking.created_at.getHours() + ":" + clocking.created_at.getMinutes(),
                vehicle: clocking.vehicle,
                device: clocking.device,
                deviceType: clocking.type,
                status: clocking.status,
                park: clocking.park ? clocking.park.name : null,
            };
        });


        return { status: 200, data: clockingFormatted , count: vehicleClockingsCount};
    } catch (error) {
        console.error("An error occurred in getClockingsVehicle" + error);
        return { status: 500, data: { message: e("error") }, count: 0 };
    }
}
