"use server"
import { prisma } from "@/lib/db";
import { getTranslations } from "next-intl/server";
import { withAuthorizationPermission, verifySession } from "../permissions";
import { z } from "zod";

export async function createVehicle(data: any) {
    const u = await getTranslations("Vehicle");
    const s = await getTranslations("System");
    const e = await getTranslations('Error');

    const schema = z.object({
        matricule: z.string().min(1, u("matriculerequired")),
        model: z.string().optional(),
        year: z.string().optional().refine((value) => value === null || value === '' || value === undefined || (Number(value) >= 1886 && Number(value) <= new Date().getFullYear()), {
            message: u("yearinvalid"),
        }),
        brand: z.string().optional(),
        vin: z.string().optional(),
        park: z.string().optional(),
    });

    try {
        const session = await verifySession()
        if (!session || session.status != 200) {
            return { status: 401, data: { message: e('unauthorized') } }
        }
        const hasPermissionAdd = await withAuthorizationPermission(['vehicles_create']);

        if (hasPermissionAdd.status != 200 || !hasPermissionAdd.data.hasPermission) {
            return { status: 403, data: { message: e('forbidden') } };
        }
        const result = schema.safeParse(data);

        if (!result.success) {
            console.log(result.error.errors);
            return { status: 400, data: { errors: result.error.errors } };
        }
        const { matricule, model, year, vin, park, brand } = result.data;

        const matriculeExists = await prisma.vehicle.findFirst({
            where: {
                matricule: matricule,
            }
        });
        if (matriculeExists) {
            return { status: 400, data: { message: u("matriculeexists") } };
        }

        if (vin) {
            const vinExists = await prisma.vehicle.findFirst({
                where: {
                    vin: vin,
                }
            });
            if (vinExists) {
                return { status: 400, data: { message: u("vinexists") } };
            }
        }


        const vehicle = await prisma.vehicle.create({
            data: {
                matricule,
                model,
                brand,
                year: year === "" ? null : Number(year),
                vin,
                added_from: session.data.user.id,
            },
        });

        if (park) {
            const hasPermissionAdd = await withAuthorizationPermission(['vehicles_park_create'])
            if (hasPermissionAdd.status === 200 && hasPermissionAdd.data.hasPermission) {
                const parkExists = await prisma.park.findFirst({ where: { id: park } });
                if (parkExists) {
                    await prisma.vehicle_park.create({
                        data: {
                            vehicle_id: vehicle.id,
                            park_id: park,
                            added_from: session.data.user.id,
                        },
                    });
                }
            }
        }

        return { status: 200, data: { message: s("createsuccess") } };
    } catch (error) {
        console.error("An error occurred in createVehicle" + error);
        return { status: 500, data: { message: s("createfail") } };
    }
}

export async function createVehicles(data: any) {
    const u = await getTranslations("Vehicle");
    const s = await getTranslations("System");
    const e = await getTranslations('Error');

    const schema = z.object({
        matricule: z.string().min(1, u("matriculerequired")),
        model: z.string().optional(),
        year: z.string().optional().refine((value) => !value || value === "null" || value === '' || value === undefined || (Number(value) >= 1886 && Number(value) <= new Date().getFullYear()), {
            message: u("yearinvalid"),
        }),
        brand: z.string().optional(),
        park: z.string().optional(),
        vin: z.string().optional(),
    });


    try {
        const session = await verifySession()
        if (!session || session.status != 200) {
            return { status: 401, data: { message: e('unauthorized') } }
        }
        const hasPermissionAdd = await withAuthorizationPermission(['vehicles_create']);

        if (hasPermissionAdd.status != 200 || !hasPermissionAdd.data.hasPermission) {
            return { status: 403, data: { message: e('forbidden') } };
        }

        const vehicles = data.map(async (userData: any) => {
            return await addVehicle(userData, schema, session, u, s);
        })

        const vehiclesResuls = await Promise.all(vehicles);

        return { status: 200, data: { message: s("createsuccess"), vehicles: vehiclesResuls } };
    } catch (error) {
        //@ts-ignore
        console.error("An error occurred in createVehicles" + error.message);
        return { status: 500, data: { message: s("createfail") } };
    }
}

const addVehicle = async (data: any, schema: any, session: any, u: any, s: any) => {
    try {
        const result = schema.safeParse({
            matricule: data.matricule === null ? undefined : data.matricule,
            model: data.model === null ? undefined : data.model,
            year: String(data.year),
            brand: data.brand === null ? undefined : data.brand,
            vin: data.vin === null ? undefined : data.vin,
            park: data.park === null ? undefined : data.park,
        });


        if (!result.success) {
            const message = result.error.errors.map((error: any) => {
                return error.message;
            }).join(', ')
            return { status: 400, data: { message: message, vehicle: data } };
        }

        const { matricule, model, year, vin, brand, park } = result.data;

        const matriculeExists = await prisma.vehicle.findFirst({ where: { matricule } });
        if (matriculeExists) {
            return { status: 400, data: { message: u("matriculeexists"), vehicle: data } };
        }

        if (vin) {
            const vinExists = await prisma.vehicle.findFirst({ where: { vin } });
            if (vinExists) {
                return { status: 400, data: { message: u("vinexists"), vehicle: data } };
            }
        }

        const vehicle = await prisma.vehicle.create({
            data: {
                matricule,
                model,
                brand,
                year: year === "" ? null : Number(year),
                vin,
                added_from: session.data.user.id,
            },
        });


        if (park) {
            const hasPermissionAdd = await withAuthorizationPermission(['vehicles_park_create'])
            if (hasPermissionAdd.status === 200 && hasPermissionAdd.data.hasPermission) {
                const parkExists = await prisma.park.findFirst({ where: { name: park } });
                if (parkExists) {
                    await prisma.vehicle_park.create({
                        data: {
                            vehicle_id: vehicle.id,
                            park_id: parkExists.id,
                            added_from: session.data.user.id,
                        },
                    });
                }
            }
        }
        return { status: 200, data: data };
    } catch (error) {
        // @ts-ignore
        console.error("An error occurred in addVehicle" + error.message);
        return { status: 500, data: { message: s("createfail"), vehicle: data } }
    };
}