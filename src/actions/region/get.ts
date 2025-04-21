"use server"

import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { withAuthorizationPermission,verifySession } from "../permissions";

export async function getRegions(): Promise<{ status: number, data: any }> {
    const e = await getTranslations('Error');
    try {
        const session = await verifySession();
        if (!session?.data?.user) {
            return { status: 401, data: { message: e("unauthorized") } };
        }
        const hasPermission = await withAuthorizationPermission(['region_view'],session.data.user.id);

        if(hasPermission.status != 200 || !hasPermission.data.hasPermission) {
            return { status: 403, data: { message: e('forbidden') } };
        }

        const regions = await prisma.region.findMany();

        return { status: 200, data: regions };
    } catch (error) {
        console.error("An error occurred in getRegions");
        return { status: 500, data: { message: e("error") } };
    }
}

// Get a single role
// muste have permission update
export async function getRegion(id: string): Promise<{ status: number, data: any }> {
    const e = await getTranslations('Error');
    try {
        const session = await verifySession();
        if (!session?.data?.user) {
            return { status: 401, data: { message: e("unauthorized") } };
        }
        const hasPermissionAdd = await withAuthorizationPermission(['region_view'],session.data.user.id);
        
        if(hasPermissionAdd.status != 200 || !hasPermissionAdd.data.hasPermission) {
            return { status: 403, data: { message: e('forbidden') } };
        }
        const device = await prisma.region.findUnique({ where: { id } });
        return { status: 200, data: device };
    } catch (error) {
        console.error("An error occurred in getRegion");
        return { status: 500, data: { message: e("error") } };
    }
}

export async function getRegionsWithIds(regionIds: string[]): Promise<{ status: number, data: any }> {

    const e = await getTranslations('Error');
    try {
        const session = await verifySession()
        if (!session || session.status != 200) {
            return { status: 401, data: { message: e('unauthorized') } }
        }
        const hasPermissionAdd = await withAuthorizationPermission(['region_view']);

        if (hasPermissionAdd.status != 200 || !hasPermissionAdd.data.hasPermission) {
            return { status: 403, data: { message: e('forbidden') } };
        }
        const regions = await prisma.region.findMany({
            where: {
                id: {
                    in: regionIds,
                }

            },
        });

        return { status: 200, data: regions };
    } catch (error) {
        console.error("Error fetching getRegionsWithIds:", error);
        return { status: 500, data: null };
    }
}


export async function getRegionsAdmin(): Promise<{ status: number, data: any }> {
    const e = await getTranslations('Error');
    try {
        const session = await verifySession()
        if (!session || session.status != 200) {
            return { status: 401, data: { message: e('unauthorized') } }
        }

        const regions = await prisma.region.findMany();
        return { status: 200, data: regions };
    } catch (error) {
        console.error("An error occurred in getRegionsPublic");
        return { status: 500, data: { message: e("error") } };
    }
}

export async function getRegionsName(id: string): Promise<{ status: number, data: any }> {
    const e = await getTranslations('Error');
    try {
        const session = await verifySession()
        if (!session || session.status != 200) {
            return { status: 401, data: { message: e('unauthorized') } }
        }

        if(!id) {
            return { status: 400, data: { message: e('badrequest') } }
        }

        const name = await prisma.region.findUnique({
            where: {
                id: id
            },
            select: {
                name: true
            }
        });
        
        return { status: 200, data: name };
    } catch (error) {
        console.error("An error occurred in getRegionsPublic");
        return { status: 500, data: { message: e("error") } };
    }
}
