"use server"

import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { withAuthorizationPermission, verifySession } from "../permissions";
import { z } from "zod";

export async function UpdateVehicle(id: string, data: any) {
    const e = await getTranslations('Error');
    const s = await getTranslations('System');
    const v = await getTranslations('Vehicle');

    try {
        const schema = z.object({
            matricule: z.string().min(1, v("matriculerequired")),
            model: z.string().optional(),
            year: z.string().optional().refine((value) =>  value === null || value === '' || value === undefined || (Number(value) >= 1886 && Number(value) <= new Date().getFullYear()), { 
                message: v("yearinvalid"),
            }),
            brand: z.string().optional(),
            vin: z.string().optional().refine((value) => value === null ||  value === '' || value === undefined || value.length === 17, {
              message: v("vininvalid"),
            }),
          });

        const session = await verifySession();
        if (!session?.data?.user) {
            return { status: 401, data: { message: e("unauthorized") } };
        }
        const hasPermissionAdd = await withAuthorizationPermission(['vehicles_update']);

        if (hasPermissionAdd.status != 200 || !hasPermissionAdd.data.hasPermission) {
            return { status: 403, data: { message: e('forbidden') } };
        }

        const result = schema.safeParse(data);

        if (!result.success) {
            console.log(result.error.errors);
            return { status: 400, data: { errors: result.error.errors } };
        }
        const { matricule, model, year, brand, vin } = result.data;

        const vehicle = await prisma.vehicle.findUnique({
            where: { id },
        });

        if (!vehicle) {
            return { status: 404, data: { message: v("vehiclenotfound") } };
        }

        const matriculeExisting = await prisma.vehicle.findFirst({
            where: { matricule, id: { not: id } },
        });
        
        if (matriculeExisting) {
            return { status: 400, data: { message: v("matriculeexists") } };
        }

        if(vin) {
            const vinExisting = await prisma.vehicle.findFirst({
                where: { vin, id: { not: id } },
            });
            if (vinExisting) {
                return { status: 400, data: { message: v("vinexists") } };
            }
        }

        await prisma.vehicle.update({
            where: { id },
            data: {
                matricule,
                model,
                year: year === "" ? null : Number(year),
                brand,
                vin,
            },
        })

        return { status: 200, data: { message: s("updatesuccess") } };
    } catch (error) {
        console.error("An error occurred in UpdateVehicle:", error);
        return { status: 500, data: { message: e("error") } };
    }
}
