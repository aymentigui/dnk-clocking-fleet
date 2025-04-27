"use server"
import { prisma } from "@/lib/db";
import { getTranslations } from "next-intl/server";
import { withAuthorizationPermission, verifySession } from "../permissions";
import { z } from "zod";
import { getUserName } from "../users/get";
import { sendEmail } from "../email";

export async function createRegion(data: any) {
    const u = await getTranslations("Region");
    const s = await getTranslations("System");
    const e = await getTranslations('Error');

    const schema = z.object({
        name: z.string().min(1, u("namerequired")),
        description: z.string().optional(),
        address: z.string().optional(),
    });
    try {
        const session = await verifySession()
        if (!session || session.status != 200) {
            return { status: 401, data: { message: e('unauthorized') } }
        }
        const hasPermissionAdd = await withAuthorizationPermission(['region_create']);

        if (hasPermissionAdd.status != 200 || !hasPermissionAdd.data.hasPermission) {
            return { status: 403, data: { message: e('forbidden') } };
        }
        const result = schema.safeParse(data);

        if (!result.success) {
            //console.log(result.error.errors);
            return { status: 400, data: { errors: result.error.errors } };
        }
        const { name, description, address } = result.data;

        const nameExists = await prisma.region.findUnique({ where: { name } });
        if (nameExists) {
            return { status: 400, data: { message: u("nameexists") } };
        }

        await prisma.region.create({
            data: {
                name,
                description,
                address,
                added_from: session.data.user.id,
            },
        });
        const userName = (await getUserName(session.data.user.id)).data
        await prisma.notification.create({
            data: {
                title: "nouvelle region",
                contenu: "Une nouvelle region a été ajouté par " + userName + "\n Nom du region : " + name + "\n Description : " + description + "\n Adresse : " + address,
                user: {
                    connect: {
                        id: session.data.user.id
                    }
                }
            }
        })

        const emails = await prisma.user.findMany({ where: { is_admin: true } })
        await Promise.all(
            emails.map(async (email) => {
                if (email.email) {
                    try {
                        await sendEmail(
                            email.email,
                            "nouvelle region",
                            "Une nouvelle region a été ajouté par " + userName + "\n Nom du region : " + name + "\n Description : " + description + "\n Adresse : " + address,
                        )
                    } catch (erreur) {
                        console.log("error sendig mail analyse to" + email.email)
                    }
                }
            })
        )

        return { status: 200, data: { message: s("createsuccess") } };
    } catch (error) {
        console.error("An error occurred in createRegion" + error);
        return { status: 500, data: { message: s("createfail") } };
    }
}

export async function createRegions(data: any) {
    const u = await getTranslations("Region");
    const s = await getTranslations("System");
    const e = await getTranslations('Error');

    const schema = z.object({
        name: z.string().min(1, u("namerequired")),
        description: z.string().optional(),
        address: z.string().optional(),
    });
    try {
        const session = await verifySession()
        if (!session || session.status != 200) {
            return { status: 401, data: { message: e('unauthorized') } }
        }
        const hasPermissionAdd = await withAuthorizationPermission(['region_create']);

        if (hasPermissionAdd.status != 200 || !hasPermissionAdd.data.hasPermission) {
            return { status: 403, data: { message: e('forbidden') } };
        }

        const regions = data.map(async (userData: any) => {
            return await addRegion(userData, schema, session, u, s);
        })

        const regionsResuls = await Promise.all(regions);
        const userName = (await getUserName(session.data.user.id)).data
        prisma.notification.create({
            data: {
                title: "nouvelles regions",
                contenu: "Des nouvelles regions ont éte ajouté par " + userName
                    + regions.map((region: any) => {
                        return "\n Nom du region : " + region.data.name + " Description : " + region.data.description + " Adresse : " + region.data.address
                    })
                ,
                user: {
                    connect: {
                        id: session.data.user.id
                    }
                }
            }
        })

        return { status: 200, data: { message: s("createsuccess"), regions: regionsResuls } };
    } catch (error) {
        //@ts-ignore
        console.error("An error occurred in createRegions" + error.message);
        return { status: 500, data: { message: s("createfail") } };
    }
}

const addRegion = async (data: any, userSchema: any, session: any, u: any, s: any) => {
    try {

        const result = userSchema.safeParse({
            name: String(data.name).trim(),
            description: String(data.description),
            address: String(data.address),
        });


        if (!result.success) {
            const message = result.error.errors.map((error: any) => {
                return error.message;
            }).join(', ')
            return { status: 400, data: { message: message, region: data } };
        }

        const { name, description, address } = result.data;

        const nameExists = await prisma.region.findUnique({ where: { name } });
        if (nameExists) {
            return { status: 400, data: { message: u("nameexists"), region: data } };
        }

        const region = await prisma.region.create({
            data: {
                name: name.trim(),
                description,
                address,
                added_from: session.data.user.id,
            },
        });

        return { status: 200, data: data };
    } catch (error) {
        // @ts-ignore
        console.error("An error occurred in addRegion" + error.message);
        return { status: 500, data: { message: s("createfail"), region: data } }
    };
}