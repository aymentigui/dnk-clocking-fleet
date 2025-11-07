"use server"

import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { withAuthorizationPermission, verifySession } from "../permissions";
import { z } from "zod";
import { getUserName } from "../users/get";
import { sendEmail } from "../email";

export async function UpdateEntreprise(id: string, data: any) {
    const e = await getTranslations('Error');
    const p = await getTranslations('Company');

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

        const hasPermissionAdd = await withAuthorizationPermission(['entreprise_update'], session.data.user.id);
        
        if (hasPermissionAdd.status != 200 || !hasPermissionAdd.data.hasPermission) {
            return { status: 403, data: { message: e('forbidden') } };
        }

        const entreprise = await prisma.entreprise.findUnique({
            where: { id },
        });
        if (!entreprise) {
            return { status: 404, data: { message: p("entreprisenotfound") } };
        }

        const result = schema.safeParse(data);
        if (!result.success) {
            return { status: 400, data: { errors: result.error.errors } };
        }

        const { name, description, address } = result.data;

        // Vérifier si une autre entreprise a le même nom
        const existingEntreprise = await prisma.entreprise.findFirst({ 
            where: { 
                name,
                NOT: { id } 
            } 
        });
        if (existingEntreprise) {
            return { status: 409, data: { message: p("nameexists") } };
        }

        // Mettre à jour l'entreprise
        const updatedEntreprise = await prisma.entreprise.update({
            where: { id },
            data: {
                name,
                description,
                address,
            },
        });


        return { status: 200, data: { message: p("update_success") } };
    } catch (error) {
        console.log("An error occurred in UpdateEntreprise:", error);
        return { status: 500, data: { message: e("error") } };
    }
}