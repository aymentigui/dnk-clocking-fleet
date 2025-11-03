"use server"
import { prisma } from "@/lib/db";
import { getTranslations } from "next-intl/server";
import { withAuthorizationPermission, verifySession } from "../permissions";
import { z } from "zod";
import { getUserName } from "../users/get";
import { sendEmail } from "../email";

export async function createEntreprise(data: any) {
    const u = await getTranslations("entreprise");
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
        const userName = (await getUserName(session.data.user.id)).data
        await prisma.notification.create({
            data: {
                title: "nouvelle entreprise",
                contenu: "Une nouvelle entreprise a été ajouté par " + userName + "\n Nom du entreprise : " + name + "\n Description : " + description + "\n Adresse : " + address,
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
                            "nouvelle entreprise",
                            "Une nouvelle entreprise a été ajouté par " + userName + "\n Nom du entreprise : " + name + "\n Description : " + description + "\n Adresse : " + address,
                        )
                    } catch (erreur) {
                        console.log("error sendig mail analyse to" + email.email)
                    }
                }
            })
        )

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
        const userName = (await getUserName(session.data.user.id)).data
        prisma.notification.create({
            data: {
                title: "nouvelles entreprises",
                contenu: "Des nouvelles entreprises ont éte ajouté par " + userName
                    + entreprises.map((entreprise: any) => {
                        return "\n Nom du entreprise : " + entreprise.data.name + " Description : " + entreprise.data.description + " Adresse : " + entreprise.data.address
                    })
                ,
                user: {
                    connect: {
                        id: session.data.user.id
                    }
                }
            }
        })

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