"use server"

import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { withAuthorizationPermission, verifySession } from "../permissions";

export async function getEntreprises(): Promise<{ status: number, data: any }> {
    const e = await getTranslations('Error');
    try {
        const session = await verifySession();
        if (!session?.data?.user) {
            return { status: 401, data: { message: e("unauthorized") } };
        }
        const hasPermission = await withAuthorizationPermission(['entreprise_view'], session.data.user.id);

        if (hasPermission.status != 200 || !hasPermission.data.hasPermission) {
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
        const hasPermissionAdd = await withAuthorizationPermission(['entreprise_view'], session.data.user.id);

        if (hasPermissionAdd.status != 200 || !hasPermissionAdd.data.hasPermission) {
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
        console.log("An error occurred in getentreprisesAdmin");
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

        if (!id) {
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
        console.log("An error occurred in getentreprisesNames");
        return { status: 500, data: { message: e("error") } };
    }
}


// actions/entreprise/get.ts
export async function getEntreprisesRoutes(
    page: number = 1,
    entreprise_id?: string,
    region_depart?: string,
    region_arrive?: string,
    enableAll?: boolean,
    pageSize: number = 20
): Promise<{ status: number, data: any }> {
    const e = await getTranslations('Error');
    try {
        const session = await verifySession();
        if (!session?.data?.user) {
            return { status: 401, data: { message: e("unauthorized") } };
        }
        const hasPermission = await withAuthorizationPermission(['entreprise_route_view'], session.data.user.id);

        if (hasPermission.status != 200 || !hasPermission.data.hasPermission) {
            return { status: 403, data: { message: e('forbidden') } };
        }

        const skip = (page - 1) * pageSize;
        const take = pageSize;

        // Compter le nombre total
        const whereConditions: any = {
            AND: [
                entreprise_id ? { entreprise_id: entreprise_id } : {},
                region_depart && !enableAll ? { region_depart: region_depart } :
                    (region_depart && enableAll ? { OR: [{ region_depart: region_depart }, { region_arrive: region_depart }] } : {}),
                region_arrive && !enableAll ? { region_arrive: region_arrive } :
                    (region_arrive && enableAll ? { OR: [{ region_arrive: region_arrive }, { region_depart: region_arrive }] } : {}),
            ]
        };

        const [routes, totalCount] = await Promise.all([
            prisma.entreprise_route.findMany({
                skip: skip,
                take: take,
                where: whereConditions,
                include: {
                    entreprise: {
                        select: { name: true }
                    }
                },
                orderBy: { added_at: 'desc' }
            }),
            prisma.entreprise_route.count({
                where: whereConditions
            })
        ]);

        return {
            status: 200,
            data: {
                routes,
                totalCount,
                currentPage: page,
                totalPages: Math.ceil(totalCount / take)
            }
        };
    } catch (error) {
        console.log("An error occurred in getentreprisesRoutes");
        return { status: 500, data: { message: e("error") } };
    }
}