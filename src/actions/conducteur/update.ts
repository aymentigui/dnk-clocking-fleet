"use server"

import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { withAuthorizationPermission,verifySession } from "../permissions";
import { z } from "zod";

export async function UpdateConducteur(id:string, data: any) {
    const e = await getTranslations('Error');
    const s = await getTranslations('System');

    try {
        const schema = z.object({
            matricule: z.string().min(1),
            firstname: z.string().optional(),
            lastname: z.string().optional(),
            phone: z.string().optional(),
        });

        const session = await verifySession();
        if (!session?.data?.user) {
            return { status: 401, data: { message: e("unauthorized") } };
        }
        const hasPermissionAdd = await withAuthorizationPermission(['conducteur_update']);
        
        if(hasPermissionAdd.status != 200 || !hasPermissionAdd.data.hasPermission) {
            return { status: 403, data: { message: e('forbidden') } };
        }

        const conducteur = await prisma.conducteur.findUnique({
            where: { id },
        });
        if (!conducteur) {
            return { status: 404, data: { message: "Conducteur non trouve" } };
        }

        const result = schema.safeParse(data);

        if (!result.success) {
            //console.log(result.error.errors);
            return { status: 400, data: { errors: result.error.errors } };
        }
        const { matricule } = result.data;

        const existingconducteur = await prisma.conducteur.findUnique({ where: { NOT: { id }, matricule } });
        if (existingconducteur) {
            return { status: 404, data: { message: "Matricule existe" } };
        }

        await prisma.conducteur.update({
            where: { id },
            data: {
                ...result.data,
            },
        })


        return { status: 200, data: { message: s("updatesuccess") } };
    } catch (error) {
        console.log("An error occurred in Updateconducteur");
        return { status: 500, data: { message: e("error") } };
    }
}


export async function updateWorkStatusConducteur(ids: string[], workStatus: boolean): Promise<{ status: number, data: { message: string } }> {
    const e = await getTranslations('Error');
    const s = await getTranslations('System');
    try {
        const session = await verifySession();
        if (!session?.data?.user) {
            return { status: 401, data: { message: e("unauthorized") } };
        }
        const hasPermissionUpdate = await withAuthorizationPermission(['conducteur_update'], session.data.user.id);

        if (hasPermissionUpdate.status != 200 || !hasPermissionUpdate.data.hasPermission) {
            return { status: 403, data: { message: e('forbidden') } };
        }

        await prisma.conducteur.updateMany({
            where: { id: { in: ids } },
            data: { work_status: workStatus },
        });

        return { status: 200, data: { message: s("updatesuccess") } };
    } catch (error) {
        console.log("An error occurred in updateWorkStatusConducteur", error);
        return { status: 500, data: { message: e("error") } };
    }
}