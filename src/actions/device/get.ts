"use server"

import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { withAuthorizationPermission, verifySession } from "../permissions";


export async function getDevices(page: number = 1, pageSize: number = 10, searchQuery?: string, searchPark?: string, searchRegion?: string): Promise<{ status: number, data: any }> {
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
        if ((searchRegion && searchRegion !== "" && searchRegion !== "0")) {
            // @ts-ignore
            if (!searchConditions.AND)
                // @ts-ignore
                searchConditions.AND = []
            // @ts-ignore
            searchConditions.AND.push(
                { region: { id: searchRegion } }
            )
        }

        const devices = await prisma.device.findMany({
            skip: skip, // Nombre d'éléments à sauter
            take: pageSize === 0 ? undefined : pageSize, // Nombre d'éléments à prendre
            where: searchConditions,
            select: {
                id: true,
                type: true,
                username: true,
                code: true,
                password: true,
                all_region: true,
                park: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                region: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            }
        });

        const allRegionIds: string[] = []
        devices.forEach((device) => {
            const ids = device.all_region?.split(",")
            ids?.forEach((id) => allRegionIds.push(id))
        })
        const deveicesRegion = await prisma.region.findMany({
            where: {
                id: {
                    in: allRegionIds
                }
            }
        })

        const devicesFormatted = devices.map((device) => {
            const regionName = device.all_region ? device.all_region.split(",").map((item) => deveicesRegion.find(i => i.id === item)?.name+" - ") : ""

            return {
                id: device.id,
                username: device.username,
                code: device.code,
                type: device.type,
                password: device.password,
                park: device.park ? device.park.name : "",
                parkId: device.park ? device.park.id : "",
                region: device.region ? device.region.name : regionName,
                regionId: device.region ? device.region.id : "",
                regionsSupervisor: device.all_region ? device.all_region.split(",") : []
            };
        })


        return { status: 200, data: devicesFormatted };
    } catch (error) {
        return { status: 500, data: null };
    }
}
export async function getCountDevices(searchQuery?: string, searchPark?: string, searchRegion?: string): Promise<{ status: number, data: any }> {

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
    if ((searchRegion && searchRegion !== "" && searchRegion !== "0")) {
        // @ts-ignore
        if (!searchConditions.AND)
            // @ts-ignore
            searchConditions.AND = []
        // @ts-ignore
        searchConditions.AND.push(
            { region: { id: searchRegion } }
        )
    }

    const e = await getTranslations('Error');
    try {
        const count = await prisma.device.count(
            {
                where: searchConditions,
            }
        );
        return { status: 200, data: count };
    } catch (error) {
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
        return { status: 500, data: null };
    }
}
