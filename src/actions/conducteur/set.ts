"use server"
import { prisma } from "@/lib/db";
import { getTranslations } from "next-intl/server";
import { withAuthorizationPermission, verifySession } from "../permissions";
import { z } from "zod";

export async function createConducteur(data: any) {
    const s = await getTranslations("System");
    const e = await getTranslations('Error');

    const schema = z.object({
        matricule: z.string().min(1),
        firstname: z.string().optional(),
        lastname: z.string().optional(),
        phone : z.string().optional(),
    });
    try {
        const session = await verifySession()
        if (!session || session.status != 200) {
            return { status: 401, data: { message: e('unauthorized') } }
        }
        const hasPermissionAdd = await withAuthorizationPermission(['conducteur_create']);

        if (hasPermissionAdd.status != 200 || !hasPermissionAdd.data.hasPermission) {
            return { status: 403, data: { message: e('forbidden') } };
        }
        const result = schema.safeParse(data);

        if (!result.success) {
            //console.log(result.error.errors);
            return { status: 400, data: { errors: result.error.errors } };
        }
        const { matricule, firstname, lastname, phone } = result.data;

        const matriculeExists = await prisma.conducteur.findUnique({ where: { matricule } });
        if (matriculeExists) {
            return { status: 400, data: { message: "Matricule existe" } };
        }

        await prisma.conducteur.create({
            data: {
                matricule,
                firstname,
                lastname,
                phone,
                added_from: session.data.user.id,
            },
        });


        return { status: 200, data: { message: s("createsuccess") } };
    } catch (error) {
        console.log("An error occurred in createconducteur" + error);
        return { status: 500, data: { message: s("createfail") } };
    }
}

export async function createConducteurs(data: any) {
    const s = await getTranslations("System");
    const e = await getTranslations('Error');

    const schema = z.object({
        matricule: z.string().min(1),
        firstname: z.string().optional(),
        lastname: z.string().optional(),
        phone : z.string().optional()
    });
    try {
        const session = await verifySession()
        if (!session || session.status != 200) {
            return { status: 401, data: { message: e('unauthorized') } }
        }
        const hasPermissionAdd = await withAuthorizationPermission(['conducteur_create']);

        if (hasPermissionAdd.status != 200 || !hasPermissionAdd.data.hasPermission) {
            return { status: 403, data: { message: e('forbidden') } };
        }

        const conducteurs = data.map(async (userData: any) => {
            return await addconducteur(userData, schema, session, s);
        })

        const conducteursResuls = await Promise.all(conducteurs);

        return { status: 200, data: { message: s("createsuccess"), conducteurs: conducteursResuls } };
    } catch (error) {
        //@ts-ignore
        console.log("An error occurred in createconducteurs" + error.message);
        return { status: 500, data: { message: s("createfail") } };
    }
}

const addconducteur = async (data: any, userSchema: any, session: any, s: any) => {
    try {

        const result = userSchema.safeParse({
            matricule: String(data.matricule).trim(),
            firstname: String(data.firstname),
            lastname: String(data.lastname),
            phone: String(data.phone)
        });


        if (!result.success) {
            const message = result.error.errors.map((error: any) => {
                return error.message;
            }).join(', ')
            return { status: 400, data: { message: message, conducteur: data } };
        }

        const { matricule, firstname, lastname, phone } = result.data;

        const nameExists = await prisma.conducteur.findUnique({ where: { matricule } });
        if (nameExists) {
            return { status: 400, data: { message: "Matricule existe", conducteur: data } };
        }

        const conducteur = await prisma.conducteur.create({
            data: {
                matricule: matricule.trim(),
                firstname,
                lastname,
                phone,
                added_from: session.data.user.id,
            },
        });

        return { status: 200, data: data };
    } catch (error) {
        // @ts-ignore
        console.log("An error occurred in addconducteur" + error.message);
        return { status: 500, data: { message: s("createfail"), conducteur: data } }
    };
}