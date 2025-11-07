"use server"
import { prisma } from "@/lib/db";
import { getTranslations } from "next-intl/server";
import { withAuthorizationPermission, verifySession } from "../permissions";
import { z } from "zod";

export async function createEntreprise(data: any) {
    const u = await getTranslations("Company");
    const s = await getTranslations("System");
    const e = await getTranslations('Error');

    const schema = z.object({
        name: z.string().min(1, u("namerequired")),
        description: z.string().optional(),
        phone : z.string().optional(),
        address: z.string().optional(),
    });
    try {
        const session = await verifySession()
        if (!session || session.status != 200) {
            return { status: 401, data: { message: e('unauthorized') } }
        }
        const hasPermissionAdd = await withAuthorizationPermission(['entreprise_create']);

        if (hasPermissionAdd.status != 200 || !hasPermissionAdd.data.hasPermission) {
            return { status: 403, data: { message: e('forbidden') } };
        }
        const result = schema.safeParse(data);

        if (!result.success) {
            //console.log(result.error.errors);
            return { status: 400, data: { errors: result.error.errors } };
        }
        const { name, description, address, phone } = result.data;

        const nameExists = await prisma.entreprise.findUnique({ where: { name } });
        if (nameExists) {
            return { status: 400, data: { message: u("nameexists") } };
        }

        await prisma.entreprise.create({
            data: {
                name,
                description,
                address,
                phone,
                added_from: session.data.user.id,
            },
        });

        return { status: 200, data: { message: s("createsuccess") } };
    } catch (error) {
        console.log("An error occurred in createentreprise" + error);
        return { status: 500, data: { message: s("createfail") } };
    }
}

export async function createentreprises(data: any) {
    const u = await getTranslations("entreprise");
    const s = await getTranslations("System");
    const e = await getTranslations('Error');

    const schema = z.object({
        name: z.string().min(1, u("namerequired")),
        description: z.string().optional(),
        address: z.string().optional(),
        phone : z.string().optional()
    });
    try {
        const session = await verifySession()
        if (!session || session.status != 200) {
            return { status: 401, data: { message: e('unauthorized') } }
        }
        const hasPermissionAdd = await withAuthorizationPermission(['entreprise_create']);

        if (hasPermissionAdd.status != 200 || !hasPermissionAdd.data.hasPermission) {
            return { status: 403, data: { message: e('forbidden') } };
        }

        const entreprises = data.map(async (userData: any) => {
            return await addentreprise(userData, schema, session, u, s);
        })

        const entreprisesResuls = await Promise.all(entreprises);

        return { status: 200, data: { message: s("createsuccess"), entreprises: entreprisesResuls } };
    } catch (error) {
        //@ts-ignore
        console.log("An error occurred in createentreprises" + error.message);
        return { status: 500, data: { message: s("createfail") } };
    }
}

const addentreprise = async (data: any, userSchema: any, session: any, u: any, s: any) => {
    try {

        const result = userSchema.safeParse({
            name: String(data.name).trim(),
            description: String(data.description),
            address: String(data.address),
            phone: String(data.phone)
        });


        if (!result.success) {
            const message = result.error.errors.map((error: any) => {
                return error.message;
            }).join(', ')
            return { status: 400, data: { message: message, entreprise: data } };
        }

        const { name, description, address, phone } = result.data;

        const nameExists = await prisma.entreprise.findUnique({ where: { name } });
        if (nameExists) {
            return { status: 400, data: { message: u("nameexists"), entreprise: data } };
        }

        const entreprise = await prisma.entreprise.create({
            data: {
                name: name.trim(),
                description,
                address,
                phone,
                added_from: session.data.user.id,
            },
        });

        return { status: 200, data: data };
    } catch (error) {
        // @ts-ignore
        console.log("An error occurred in addentreprise" + error.message);
        return { status: 500, data: { message: s("createfail"), entreprise: data } }
    };
}

export async function createEntrepriseRoute(data: any) {
    const u = await getTranslations("Company");
    const r = await getTranslations("Region");
    const s = await getTranslations("System");
    const e = await getTranslations('Error');

    const schema = z.object({
        entreprise_id: z.string(),
        distance: z.number().optional(),
        region_depart : z.string(),
        region_arrive: z.string(),
    });
    try {
        const session = await verifySession()
        if (!session || session.status != 200) {
            return { status: 401, data: { message: e('unauthorized') } }
        }
        const hasPermissionAdd = await withAuthorizationPermission(['entreprise_route_create']);

        if (hasPermissionAdd.status != 200 || !hasPermissionAdd.data.hasPermission) {
            return { status: 403, data: { message: e('forbidden') } };
        }
        const result = schema.safeParse(data);

        if (!result.success) {
            //console.log(result.error.errors);
            return { status: 400, data: { errors: result.error.errors } };
        }
        const { entreprise_id, distance, region_arrive, region_depart } = result.data;

        const entrepriseExists = await prisma.entreprise.findUnique({ where: { id: entreprise_id } });
        if (!entrepriseExists) {
            return { status: 400, data: { message: u("no_companies") } };
        }

        const region_arriveExists = await prisma.region.findUnique({ where: { id: region_arrive } });
        if (!region_arriveExists) {
            return { status: 400, data: { message: r("regionnotfound") + " (arrive)" } };
        }
        const region_departExists = await prisma.region.findUnique({ where: { id: region_depart } });
        if (!region_departExists) {
            return { status: 400, data: { message: r("regionnotfound") + " (depart)" } };
        }

        await prisma.entreprise_route.create({
            data: {
                entreprise_id,
                distance,
                region_arrive,
                region_depart,
                added_from: session.data.user.id,
            },
        });

        return { status: 200, data: { message: s("createsuccess") } };
    } catch (error) {
        console.log("An error occurred in createentrepriseRoute" + error);
        return { status: 500, data: { message: s("createfail") } };
    }
}