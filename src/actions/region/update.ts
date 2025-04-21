"use server"

import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { withAuthorizationPermission,verifySession } from "../permissions";
import { z } from "zod";

export async function UpdateRegion(id:string, data: any) {
    const e = await getTranslations('Error');
    const s = await getTranslations('System');
    const p = await getTranslations('Region');

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
        const hasPermissionAdd = await withAuthorizationPermission(['region_update']);
        
        if(hasPermissionAdd.status != 200 || !hasPermissionAdd.data.hasPermission) {
            return { status: 403, data: { message: e('forbidden') } };
        }

        const region = await prisma.region.findUnique({
            where: { id },
        });
        if (!region) {
            return { status: 404, data: { message: p("regionnotfound") } };
        }

        const result = schema.safeParse(data);

        if (!result.success) {
            //console.log(result.error.errors);
            return { status: 400, data: { errors: result.error.errors } };
        }
        const { name, description, address } = result.data;

        const existingRegion = await prisma.region.findUnique({ where: { NOT: { id }, name } });
        if (existingRegion) {
            return { status: 404, data: { message: p("nameexists") } };
        }

        await prisma.region.update({
            where: { id },
            data: {
                name: name,
                description,
                address,
            },
        })
        return { status: 200, data: { message: s("updatesuccess") } };
    } catch (error) {
        console.error("An error occurred in UpdateRegion");
        return { status: 500, data: { message: e("error") } };
    }
}
