"use server"

import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { withAuthorizationPermission,verifySession } from "../permissions";

export async function getEntreprises(): Promise<{ status: number, data: any }> {
    const e = await getTranslations('Error');
    try {
        const session = await verifySession();
        if (!session?.data?.user) {
            return { status: 401, data: { message: e("unauthorized") } };
        }
        const hasPermission = await withAuthorizationPermission(['entreprise_view'],session.data.user.id);

        if(hasPermission.status != 200 || !hasPermission.data.hasPermission) {
            return { status: 403, data: { message: e('forbidden') } };
        }

        const entreprises = await prisma.entreprise.findMany();

        return { status: 200, data: entreprises };
    } catch (error) {
        console.log("An error occurred in getentreprises");
        return { status: 500, data: { message: e("error") } };
    }
}

// Get a single role
// muste have permission update
export async function getEnteprise(id: string): Promise<{ status: number, data: any }> {
    const e = await getTranslations('Error');
    try {
        const session = await verifySession();
        if (!session?.data?.user) {
            return { status: 401, data: { message: e("unauthorized") } };
        }
        const hasPermissionAdd = await withAuthorizationPermission(['entreprise_view'],session.data.user.id);
        
        if(hasPermissionAdd.status != 200 || !hasPermissionAdd.data.hasPermission) {
            return { status: 403, data: { message: e('forbidden') } };
        }
        const device = await prisma.entreprise.findUnique({ where: { id } });
        return { status: 200, data: device };
    } catch (error) {
        console.log("An error occurred in getentreprise");
        return { status: 500, data: { message: e("error") } };
    }
}

export async function getEnteprisesWithIds(entrepriseIds: string[]): Promise<{ status: number, data: any }> {

    const e = await getTranslations('Error');
    try {
        const session = await verifySession()
        if (!session || session.status != 200) {
            return { status: 401, data: { message: e('unauthorized') } }
        }
        const hasPermissionAdd = await withAuthorizationPermission(['entreprise_view']);

        if (hasPermissionAdd.status != 200 || !hasPermissionAdd.data.hasPermission) {
            return { status: 403, data: { message: e('forbidden') } };
        }
        const entreprises = await prisma.entreprise.findMany({
            where: {
                id: {
                    in: entrepriseIds,
                }

            },
        });

        return { status: 200, data: entreprises };
    } catch (error) {
        console.log("Error fetching getentreprisesWithIds:", error);
        return { status: 500, data: null };
    }
}


export async function getEnteprisesAdmin(): Promise<{ status: number, data: any }> {
    const e = await getTranslations('Error');
    try {
        const session = await verifySession()
        if (!session || session.status != 200) {
            return { status: 401, data: { message: e('unauthorized') } }
        }

        const entreprises = await prisma.entreprise.findMany();
        return { status: 200, data: entreprises };
    } catch (error) {
        console.log("An error occurred in getentreprisesPublic");
        return { status: 500, data: { message: e("error") } };
    }
}

export async function getEnteprisesName(id: string): Promise<{ status: number, data: any }> {
    const e = await getTranslations('Error');
    try {
        const session = await verifySession()
        if (!session || session.status != 200) {
            return { status: 401, data: { message: e('unauthorized') } }
        }

        if(!id) {
            return { status: 400, data: { message: e('badrequest') } }
        }

        const name = await prisma.entreprise.findUnique({
            where: {
                id: id
            },
            select: {
                name: true
            }
        });
        
        return { status: 200, data: name };
    } catch (error) {
        console.log("An error occurred in getentreprisesPublic");
        return { status: 500, data: { message: e("error") } };
    }
}
