"use server"
import { getTranslations } from "next-intl/server";
import { verifySession } from "../permissions";
import { prisma } from "@/lib/db";
import { getPark, getParksName } from "../park/get";

export async function getVehiclesCount(): Promise<{ status: number, data: any }> {
    const e = await getTranslations('Error');
    try {
        const session = await verifySession()
        if (!session || session.status != 200) {
            return { status: 401, data: { message: e('unauthorized') } }
        }

        const count = await prisma.vehicle.count({})

        return { status: 200, data: count };
    } catch (error) {
        console.error("Error fetching vehicles count:", error);
        return { status: 500, data: 0 };
    }
}

export async function getParksCount(): Promise<{ status: number, data: any }> {
    const e = await getTranslations('Error');
    try {
        const session = await verifySession()
        if (!session || session.status != 200) {
            return { status: 401, data: { message: e('unauthorized') } }
        }

        const count = await prisma.park.count({})

        return { status: 200, data: count };
    } catch (error) {
        console.error("Error fetching parks count:", error);
        return { status: 500, data: 0 };
    }
}

export async function getDevicesCount(): Promise<{ status: number, data: any }> {
    const e = await getTranslations('Error');
    try {
        const session = await verifySession()
        if (!session || session.status != 200) {
            return { status: 401, data: { message: e('unauthorized') } }
        }

        const count = await prisma.device.count({})

        return { status: 200, data: count };
    } catch (error) {
        console.error("Error fetching devices count:", error);
        return { status: 500, data: 0 };
    }
}

export async function getUsersCount(): Promise<{ status: number, data: any }> {
    const e = await getTranslations('Error');
    try {
        const session = await verifySession()
        if (!session || session.status != 200) {
            return { status: 401, data: { message: e('unauthorized') } }
        }

        const count = await prisma.user.count({
            where: {
                AND : [
                    {
                        device: {
                            none: {},
                        },
                    },
                    {
                        deleted_at: null
                    }
                ]
            },
        });

        return { status: 200, data: count };
    } catch (error) {
        console.error("Error fetching users count:", error);
        return { status: 500, data: 0 };
    }
}


export async function getVehiclesNoParkCount(): Promise<{ status: number, data: any }> {
    const e = await getTranslations('Error');
    try {
        const session = await verifySession()
        if (!session || session.status != 200) {
            return { status: 401, data: { message: e('unauthorized') } }
        }

        const count = await prisma.vehicle.count({
            where: {
                vehicle_park: {
                    none: {},
                },
            },
        })

        return { status: 200, data: count };
    } catch (error) {
        console.error("Error fetching getVehiclesNoParkCount:", error);
        return { status: 500, data: 0 };
    }
}

export async function getParkVehiclesCount(): Promise<{ status: number, data: any }> {
    const e = await getTranslations('Error');
    try {
        const session = await verifySession()
        if (!session || session.status != 200) {
            return { status: 401, data: { message: e('unauthorized') } }
        }

        const vehicleCountInParks = await prisma.vehicle_park.findMany({
            select: {
                park_id: true,
                vehicle_id: true,
                added_at: true,
            },
            orderBy: {
                added_at: 'desc', // Trier pour obtenir la dernière affectation
            },
            distinct: ['vehicle_id'], // Récupérer uniquement la dernière affectation pour chaque véhicule
        });

        const vehicleCountInParksFiltered = vehicleCountInParks.filter((item) => item.park_id !== null);

        const vehicleCountByPark = vehicleCountInParksFiltered.reduce((acc, item) => {
            // @ts-ignore
            acc[item.park_id] = (acc[item.park_id] || 0) + 1;
            return acc;
        }, {});

        const vehicleCountByParkFormatted = await Promise.all(
            Object.entries(vehicleCountByPark).map(async ([parkId, count]) => {
                const parkNameResponse = await getParksName(parkId);
                return {
                    name: parkNameResponse.data?.name || 'Unknown',
                    count: count,
                };
            })
        );

        return { status: 200, data: vehicleCountByParkFormatted };
    } catch (error) {
        console.error("Error fetching getVehiclesNoParkCount:", error);
        return { status: 500, data: 0 };
    }
}