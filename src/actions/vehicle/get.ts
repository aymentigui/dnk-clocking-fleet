"use server"

import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { withAuthorizationPermission, verifySession } from "../permissions";


export async function getVehicles(page: number = 1, pageSize: number = 10, searchQuery?: string, searchPark?: string): Promise<{ status: number, data: any }> {
    const e = await getTranslations('Error');
    try {
        console.log(searchPark)
        const session = await verifySession()
        if (!session || session.status != 200) {
            return { status: 401, data: { message: e('unauthorized') } }
        }
        const hasPermissionAdd = await withAuthorizationPermission(['vehicles_view']);

        if (hasPermissionAdd.status != 200 || !hasPermissionAdd.data.hasPermission) {
            return { status: 403, data: { message: e('forbidden') } };
        }

        // Calculer le nombre d'éléments à sauter
        const skip = (page - 1) * pageSize;
        const searchConditions = {}
        if ((searchQuery && searchQuery !== ""))
            // @ts-ignore
            searchConditions.OR = [
                { matricule: { contains: searchQuery } },
                { vin: { contains: searchQuery } },
                { brand: { contains: searchQuery } },
                { model: { contains: searchQuery } },
                // { year: { contains: Number(searchQuery) } },
            ]

        // if ((searchPark && searchPark !== "" && searchPark !== "0"))
        //     // @ts-ignore
        //     searchConditions.AND = [
        //         { park: { id: searchPark } }
        //     ]

        const vehicles = await prisma.vehicle.findMany({
            skip: skip, // Nombre d'éléments à sauter
            take: pageSize === 0 ? undefined : pageSize, // Nombre d'éléments à prendre
            where: searchConditions,
        });

        // const vehiclesFormatted = devices.map((vehicle) => ({
        //     id: vehicle.id,
        //     username: vehicle.username,
        //     code: vehicle.code,
        //     password: vehicle.password,
        //     park: vehicle.park ? device.park.name : "",
        //     parkId: vehicle.park ? device.park.id : ""
        // }))


        return { status: 200, data: vehicles };
    } catch (error) {
        console.error("Error fetching vehicles:", error);
        return { status: 500, data: null };
    }
}
export async function getCountVehicles(searchQuery?: string, searchPark?: string): Promise<{ status: number, data: any }> {

    const searchConditions = {}
    if ((searchQuery && searchQuery !== ""))
        // @ts-ignore
        searchConditions.OR = [
            { matricule: { contains: searchQuery } },
            { vin: { contains: searchQuery } },
            { brand: { contains: searchQuery } },
            { model: { contains: searchQuery } },
        ]

    const e = await getTranslations('Error');
    try {
        const count = await prisma.vehicle.count(
            {
                where: searchConditions,
            }
        );
        return { status: 200, data: count };
    } catch (error) {
        console.error("Error fetching count vehicles:", error);
        return { status: 500, data: null };
    }
}
export async function getVehiclesAll(): Promise<{ status: number, data: any }> {
    const e = await getTranslations('Error');
    try {
        const session = await verifySession();
        if (!session?.data?.user) {
            return { status: 401, data: { message: e("unauthorized") } };
        }
        const hasPermission = await withAuthorizationPermission(['vehicles_view'], session.data.user.id);

        if (hasPermission.status != 200 || !hasPermission.data.hasPermission) {
            return { status: 403, data: { message: e('forbidden') } };
        }

        const devices = await prisma.vehicle.findMany();

        return { status: 200, data: devices };
    } catch (error) {
        console.error("An error occurred in getVehiclesAll");
        return { status: 500, data: { message: e("error") } };
    }
}

export async function getVehicle(id: string): Promise<{ status: number, data: any }> {
    const e = await getTranslations('Error');
    try {
        const session = await verifySession();
        if (!session?.data?.user) {
            return { status: 401, data: { message: e("unauthorized") } };
        }
        const hasPermissionAdd = await withAuthorizationPermission(['vehicles_view'], session.data.user.id);

        if (hasPermissionAdd.status != 200 || !hasPermissionAdd.data.hasPermission) {
            return { status: 403, data: { message: e('forbidden') } };
        }
        const device = await prisma.vehicle.findUnique({ where: { id } });
        return { status: 200, data: device };
    } catch (error) {
        console.error("An error occurred in getvehicle:", error);
        return { status: 500, data: { message: e("error") } };
    }
}

export async function getVehiclesWithIds(vehicleIds: string[]): Promise<{ status: number, data: any }> {

    const e = await getTranslations('Error');
    try {
        const session = await verifySession()
        if (!session || session.status != 200) {
            return { status: 401, data: { message: e('unauthorized') } }
        }
        const hasPermissionAdd = await withAuthorizationPermission(['vehicles_view']);

        if (hasPermissionAdd.status != 200 || !hasPermissionAdd.data.hasPermission) {
            return { status: 403, data: { message: e('forbidden') } };
        }
        const devices = await prisma.vehicle.findMany({
            where: {
                id: {
                    in: vehicleIds,
                }

            },
        });

        return { status: 200, data: devices };
    } catch (error) {
        console.error("Error fetching getVehiclesWithIds:", error);
        return { status: 500, data: null };
    }
}
