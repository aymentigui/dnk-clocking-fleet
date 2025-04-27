"use server"

import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { withAuthorizationPermission, verifySession } from "../permissions";
import { z } from "zod";
import { getUserName } from "../users/get";
import { sendEmail } from "../email";

export async function UpdatePark(id: string, data: any) {
    const e = await getTranslations('Error');
    const s = await getTranslations('System');
    const p = await getTranslations('Park');

    try {
        const schema = z.object({
            name: z.string().min(1, p("namerequired")),
            description: z.string().optional(),
            address: z.string().optional(),
        });

        const session = await verifySession();
        if (!session?.data?.user) {
            return { status: 401, data: { message: e("unauthorized") } };
        }
        const hasPermissionUpdate = await withAuthorizationPermission(['park_update']);

        if (hasPermissionUpdate.status != 200 || !hasPermissionUpdate.data.hasPermission) {
            return { status: 403, data: { message: e('forbidden') } };
        }

        const park = await prisma.park.findUnique({
            where: { id },
        });
        if (!park) {
            return { status: 404, data: { message: p("parknotfound") } };
        }

        const result = schema.safeParse(data);

        if (!result.success) {
            //console.log(result.error.errors);
            return { status: 400, data: { errors: result.error.errors } };
        }
        const { name, description, address } = result.data;

        const existingPark = await prisma.park.findUnique({ where: { NOT: { id }, name } });
        if (existingPark) {
            return { status: 404, data: { message: p("nameexists") } };
        }

        await prisma.park.update({
            where: { id },
            data: {
                name: name,
                description,
                address,
            },
        })

        const userName = (await getUserName(session.data.user.id)).data
        await prisma.notification.create({
            data: {
                title: "mise à jour parc",
                contenu: "Un parc a été mise à jour par " + userName + "\n Nom du parc : " + name + "\n Description : " + description + "\n Adresse : " + address + "\n Ancien parc : " + park.name + "\n Ancienne description : " + park.description + "\n Ancienne adresse : " + park.address,
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
                            "mise à jour parc",
                            "Un parc a été mise à jour par " + userName + "\n Nom du parc : " + name + "\n Description : " + description + "\n Adresse : " + address + "\n Ancien parc : " + park.name + "\n Ancienne description : " + park.description + "\n Ancienne adresse : " + park.address,
                        )
                    } catch (erreur) {
                        console.log("error sendig mail analyse to" + email.email)
                    }
                }
            })
        )

        return { status: 200, data: { message: s("updatesuccess") } };
    } catch (error) {
        console.error("An error occurred in UpdatePark");
        return { status: 500, data: { message: e("error") } };
    }
}
