"use server"

import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { withAuthorizationPermission, verifySession } from "../permissions";

export async function getConducteurs(page: number = 1, pageSize: number = 10, searchQuery?: string): Promise<{ status: number, data: any, totalCount?: number, totalPages?: number }> {
    const e = await getTranslations('Error');
    try {
        const session = await verifySession();
        if (!session?.data?.user) {
            return { status: 401, data: { message: e("unauthorized") }, totalCount: 0, totalPages: 0 };
        }
        const hasPermission = await withAuthorizationPermission(['conducteur_view'], session.data.user.id);

        if (hasPermission.status != 200 || !hasPermission.data.hasPermission) {
            return { status: 403, data: { message: e('forbidden') }, totalCount: 0, totalPages: 0 };
        }

        const skip = (page - 1) * pageSize;

        const searchConditions = searchQuery && searchQuery !== ""
            ? {
                OR: [
                    { firstname: { contains: searchQuery } },
                    { lastname: { contains: searchQuery } },
                    { matricule: { contains: searchQuery } },
                ],
            }
            : {};

        const [conducteurs, totalCount] = await Promise.all([
            prisma.conducteur.findMany({
                skip: skip, // Nombre d'éléments à sauter
                take: pageSize === 0 ? undefined : pageSize, // Nombre d'éléments à prendre
                where: searchConditions,
            }),
            prisma.conducteur.count({
                where: searchConditions,
            })
        ]);

        const totalPages = pageSize === 0 ? 1 : Math.ceil(totalCount / pageSize);

        return { status: 200, data: conducteurs, totalCount, totalPages };
    } catch (error) {
        console.log("An error occurred in getconducteurs");
        return { status: 500, data: { message: e("error") }, totalCount: 0, totalPages: 0 };
    }
}

// Get a single role
// muste have permission update
export async function getConducteur(id: string): Promise<{ status: number, data: any }> {
    const e = await getTranslations('Error');
    try {
        const session = await verifySession();
        if (!session?.data?.user) {
            return { status: 401, data: { message: e("unauthorized") } };
        }
        const hasPermissionAdd = await withAuthorizationPermission(['conducteur_view'], session.data.user.id);

        if (hasPermissionAdd.status != 200 || !hasPermissionAdd.data.hasPermission) {
            return { status: 403, data: { message: e('forbidden') } };
        }
        const device = await prisma.conducteur.findUnique({ where: { id } });
        return { status: 200, data: device };
    } catch (error) {
        console.log("An error occurred in getconducteur");
        return { status: 500, data: { message: e("error") } };
    }
}

export async function getConducteursWithIds(conducteurIds: string[]): Promise<{ status: number, data: any }> {

    const e = await getTranslations('Error');
    try {
        const session = await verifySession()
        if (!session || session.status != 200) {
            return { status: 401, data: { message: e('unauthorized') } }
        }
        const hasPermissionAdd = await withAuthorizationPermission(['conducteur_view']);

        if (hasPermissionAdd.status != 200 || !hasPermissionAdd.data.hasPermission) {
            return { status: 403, data: { message: e('forbidden') } };
        }
        const conducteurs = await prisma.conducteur.findMany({
            where: {
                id: {
                    in: conducteurIds,
                }

            },
        });

        return { status: 200, data: conducteurs };
    } catch (error) {
        console.log("Error fetching getconducteursWithIds:", error);
        return { status: 500, data: null };
    }
}


export async function getConducteursAdmin(): Promise<{ status: number, data: any }> {
    const e = await getTranslations('Error');
    try {
        const session = await verifySession()
        if (!session || session.status != 200) {
            return { status: 401, data: { message: e('unauthorized') } }
        }

        const conducteurs = await prisma.conducteur.findMany();
        return { status: 200, data: conducteurs };
    } catch (error) {
        console.log("An error occurred in getconducteursPublic");
        return { status: 500, data: { message: e("error") } };
    }
}

export async function getConducteursMatricules(id: string): Promise<{ status: number, data: any }> {
    const e = await getTranslations('Error');
    try {
        const session = await verifySession()
        if (!session || session.status != 200) {
            return { status: 401, data: { message: e('unauthorized') } }
        }

        if (!id) {
            return { status: 400, data: { message: e('badrequest') } }
        }

        const matricule = await prisma.conducteur.findUnique({
            where: {
                id: id
            },
            select: {
                matricule: true
            }
        });

        return { status: 200, data: matricule };
    } catch (error) {
        console.log("An error occurred in getconducteursMatricules");
        return { status: 500, data: { message: e("error") } };
    }
}

export async function getConducteursNames(id: string): Promise<{ status: number, data: any }> {
    const e = await getTranslations('Error');
    try {
        const session = await verifySession()
        if (!session || session.status != 200) {
            return { status: 401, data: { message: e('unauthorized') } }
        }

        if (!id) {
            return { status: 400, data: { message: e('badrequest') } }
        }

        const conducteur = await prisma.conducteur.findUnique({
            where: {
                id: id
            },
            select: {
                firstname: true,
                lastname: true
            }
        });

        return { status: 200, data: conducteur?.firstname + " " + conducteur?.lastname };
    } catch (error) {
        console.log("An error occurred in getconducteursNames");
        return { status: 500, data: { message: e("error") } };
    }
}
