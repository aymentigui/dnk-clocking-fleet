"use server"

import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { withAuthorizationPermission, verifySession } from "../permissions";


export async function getDevices(page: number = 1, pageSize: number = 10, searchQuery?: string, searchPark?: string): Promise<{ status: number, data: any }> {
    const e = await getTranslations('Error');
    try {
        console.log(searchPark)
        const session = await verifySession()
        if (!session || session.status != 200) {
            return { status: 401, data: { message: e('unauthorized') } }
        }
        const hasPermissionAdd = await withAuthorizationPermission(['devices_view']);

        if (hasPermissionAdd.status != 200 || !hasPermissionAdd.data.hasPermission) {
            return { status: 403, data: { message: e('forbidden') } };
        }

        // Calculer le nombre d'éléments à sauter
        const skip = (page - 1) * pageSize;
        const searchConditions = {}
        if ((searchQuery && searchQuery !== ""))
            // @ts-ignore
            searchConditions.OR = [
                { username: { contains: searchQuery } },
                { code: { contains: searchQuery } },
            ]

        if ((searchPark && searchPark !== "" && searchPark !== "0"))
            // @ts-ignore
            searchConditions.AND = [
                { park: { id: searchPark } }
            ]

        const devices = await prisma.device.findMany({
            skip: skip, // Nombre d'éléments à sauter
            take: pageSize === 0 ? undefined : pageSize, // Nombre d'éléments à prendre
            where: searchConditions,
            select: {
                id: true,
                username: true,
                code: true,
                password: true,
                park: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            }
        });

        const devicesFormatted = devices.map((device) => ({
            id: device.id,
            username: device.username,
            code: device.code,
            password: device.password,
            park: device.park ? device.park.name : "",
            parkId: device.park ? device.park.id : ""
        }))


        return { status: 200, data: devicesFormatted };
    } catch (error) {
        console.error("Error fetching devices:", error);
        return { status: 500, data: null };
    }
}
export async function getCountDevices(searchQuery?: string, searchPark?: string): Promise<{ status: number, data: any }> {

    const searchConditions = searchQuery && searchQuery !== ""
        ? {
            OR: [
                { username: { contains: searchQuery } },
                { code: { contains: searchQuery } },
                { email: { contains: searchQuery } },
            ],
            AND: searchPark && searchPark !== "" && searchPark !== "0"
                ? { park: { id: searchPark } }
                : {},
        }
        : {};

    const e = await getTranslations('Error');
    try {
        const count = await prisma.device.count(
            {
                where: searchConditions,
            }
        );
        return { status: 200, data: count };
    } catch (error) {
        console.error("Error fetching count devices:", error);
        return { status: 500, data: null };
    }
}
export async function getDevicesAll(): Promise<{ status: number, data: any }> {
    const e = await getTranslations('Error');
    try {
        const session = await verifySession();
        if (!session?.data?.user) {
            return { status: 401, data: { message: e("unauthorized") } };
        }
        const hasPermission = await withAuthorizationPermission(['devices_view'], session.data.user.id);

        if (hasPermission.status != 200 || !hasPermission.data.hasPermission) {
            return { status: 403, data: { message: e('forbidden') } };
        }

        const devices = await prisma.device.findMany();

        return { status: 200, data: devices };
    } catch (error) {
        console.error("An error occurred in getAllDevices");
        return { status: 500, data: { message: e("error") } };
    }
}

// Get a single role
// muste have permission update
export async function getDevice(id: string): Promise<{ status: number, data: any }> {
    const e = await getTranslations('Error');
    try {
        const session = await verifySession();
        if (!session?.data?.user) {
            return { status: 401, data: { message: e("unauthorized") } };
        }
        const hasPermissionAdd = await withAuthorizationPermission(['devices_view'], session.data.user.id);

        if (hasPermissionAdd.status != 200 || !hasPermissionAdd.data.hasPermission) {
            return { status: 403, data: { message: e('forbidden') } };
        }
        const device = await prisma.device.findUnique({ where: { id } });
        return { status: 200, data: device };
    } catch (error) {
        console.error("An error occurred in getDevice");
        return { status: 500, data: { message: e("error") } };
    }
}

export async function getDevicesWithIds(deviceIds: string[]): Promise<{ status: number, data: any }> {

    const e = await getTranslations('Error');
    try {
        const session = await verifySession()
        if (!session || session.status != 200) {
            return { status: 401, data: { message: e('unauthorized') } }
        }
        const hasPermissionAdd = await withAuthorizationPermission(['devices_view']);

        if (hasPermissionAdd.status != 200 || !hasPermissionAdd.data.hasPermission) {
            return { status: 403, data: { message: e('forbidden') } };
        }
        const devices = await prisma.device.findMany({
            where: {
                id: {
                    in: deviceIds,
                }

            },
        });

        return { status: 200, data: devices };
    } catch (error) {
        console.error("Error fetching getDevicesWithIds:", error);
        return { status: 500, data: null };
    }
}
