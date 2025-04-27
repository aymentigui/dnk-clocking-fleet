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
            year: z.string().optional().refine((value) => value === null || value === '' || value === undefined || (Number(value) >= 1886 && Number(value) <= new Date().getFullYear()), {
                message: v("yearinvalid"),
            }),
            brand: z.string().optional(),
            vin: z.string().optional(),
            park: z.string().optional(),
            region: z.string().optional(),
        });

        const session = await verifySession();
        if (!session?.data?.user) {
            return { status: 401, data: { message: e("unauthorized") } };
        }
        const hasPermissionRes = await withAuthorizationPermission(['vehicles_update']);
        const hasPermissionUpdateParkRes = await withAuthorizationPermission(['vehicles_park_update']);
        const hasPermissionUpdateRegionRes = await withAuthorizationPermission(['vehicles_region_update']);

        let hasPermission = true
        let hasPermissionUpdatePark = true
        let hasPermissionUpdateRegion = true

        if (hasPermissionRes.status != 200 || !hasPermissionRes.data.hasPermission) {
            hasPermission = false
        }
        if (hasPermissionUpdateParkRes.status != 200 || !hasPermissionUpdateParkRes.data.hasPermission) {
            hasPermissionUpdatePark = false
        }
        if (hasPermissionUpdateRegionRes.status != 200 || !hasPermissionUpdateRegionRes.data.hasPermission) {
            hasPermissionUpdateRegion = false
        }

        const result = schema.safeParse(data);

        if (!result.success) {
            //console.log(result.error.errors);
            return { status: 400, data: { errors: result.error.errors } };
        }
        const { matricule, model, year, brand, vin, park, region } = result.data;

        const vehicle = await prisma.vehicle.findUnique({
            where: { id },
        });

        if (!vehicle) {
            return { status: 404, data: { message: v("vehiclenotfound") } };
        }

        if (hasPermission) {

            const matriculeExisting = await prisma.vehicle.findFirst({
                where: { matricule, id: { not: id } },
            });

            if (matriculeExisting) {
                return { status: 400, data: { message: v("matriculeexists") } };
            }

            if (vin) {
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
        }

        if (hasPermissionUpdatePark) {

            const parc_vehicle = await prisma.vehicle_park.findFirst({
                where: {
                    vehicle_id: id,
                },
                orderBy: {
                    added_at: 'desc',
                },
            });

            if ((parc_vehicle && parc_vehicle.park_id !== park) || (!parc_vehicle && park)) {

                const hasPermission = await withAuthorizationPermission(['vehicles_park_update']);
                if (hasPermission.status === 200 && hasPermission.data.hasPermission) {
                    const parkExists = await prisma.park.findFirst({ where: { id: park } });
                    if (parkExists)
                        await prisma.vehicle_park.create({
                            data: {
                                vehicle_id: id,
                                park_id: parkExists ? parkExists.id : null,
                                added_from: session.data.user.id,
                            },
                        });
                    else if (!park) {
                        await prisma.vehicle_park.create({
                            data: {
                                vehicle_id: id,
                                park_id: null,
                                added_from: session.data.user.id,
                            },
                        });
                    }
                }
            }

        }

        if (hasPermissionUpdateRegion) {
            const region_vehicle = await prisma.vehicle_region.findFirst({
                where: {
                    vehicle_id: id,
                },
                orderBy: {
                    added_at: 'desc',
                },
            });

            if ((region_vehicle && region_vehicle.region_id !== region) || (!region_vehicle && region)) {
                const hasPermission = await withAuthorizationPermission(['vehicles_region_update']);
                if (hasPermission.status === 200 && hasPermission.data.hasPermission) {
                    const regionExists = await prisma.region.findFirst({ where: { id: region } });
                    if (regionExists)
                        await prisma.vehicle_region.create({
                            data: {
                                vehicle_id: id,
                                region_id: regionExists ? regionExists.id : null,
                                added_from: session.data.user.id,
                            },
                        });
                    else if (!region)
                        await prisma.vehicle_region.create({
                            data: {
                                vehicle_id: id,
                                region_id: null,
                                added_from: session.data.user.id,
                            },
                        });
                }
            }
        }


        return { status: 200, data: { message: s("updatesuccess") } };
    } catch (error) {
        console.error("An error occurred in UpdateVehicle:", error);
        return { status: 500, data: { message: e("error") } };
    }
}



export async function UpdateVehiclesParc(vehicleIds: string[], parcId: string) {
    const e = await getTranslations('Error');
    const s = await getTranslations('System');
    const v = await getTranslations('Vehicle');

    try {

        const session = await verifySession();
        if (!session?.data?.user) {
            return { status: 401, data: { message: e("unauthorized") } };
        }
        const hasPermissionAdd = await withAuthorizationPermission(['vehicles_park_update']);

        if (hasPermissionAdd.status != 200 || !hasPermissionAdd.data.hasPermission) {
            return { status: 403, data: { message: e('forbidden') } };
        }

        if (parcId && parcId !== "null") {
            const parkExists = await prisma.park.findFirst({ where: { id: parcId } });
            if (!parkExists) {
                return { status: 404, data: { message: v("parknotfound") } };
            }
        }

        await prisma.vehicle_park.createMany({
            data: vehicleIds.map((id) => ({
                vehicle_id: id,
                park_id: parcId === "null" ? null : parcId,
                added_from: session.data.user.id,
            })),
        });

        return { status: 200, data: { message: s("updatesuccess") } };
    } catch (error) {
        console.error("An error occurred in UpdateVehiclesParc:", error);
        return { status: 500, data: { message: e("error") } };
    }
}


export async function UpdateVehiclesRegion(vehicleIds: string[], regionId: string) {
    const e = await getTranslations('Error');
    const s = await getTranslations('System');
    const v = await getTranslations('Vehicle');

    try {

        const session = await verifySession();
        if (!session?.data?.user) {
            return { status: 401, data: { message: e("unauthorized") } };
        }
        const hasPermissionAdd = await withAuthorizationPermission(['vehicles_region_update']);

        if (hasPermissionAdd.status != 200 || !hasPermissionAdd.data.hasPermission) {
            return { status: 403, data: { message: e('forbidden') } };
        }

        if (regionId && regionId !== "null") {
            const regionExists = await prisma.region.findFirst({ where: { id: regionId } });
            if (!regionExists) {
                return { status: 404, data: { message: v("regionnotfound") } };
            }
        }

        await prisma.vehicle_region.createMany({
            data: vehicleIds.map((id) => ({
                vehicle_id: id,
                region_id: regionId === "null" ? null : regionId,
                added_from: session.data.user.id,
            })),
        });

        return { status: 200, data: { message: s("updatesuccess") } };
    } catch (error) {
        console.error("An error occurred in UpdateVehiclesRegion:", error);
        return { status: 500, data: { message: e("error") } };
    }
}

export async function UpdateVehiclesParcMatricule(vehicleMatriculesPark: { matricule: string, park: string }[]) {
    const e = await getTranslations('Error');
    const s = await getTranslations('System');
    const v = await getTranslations('Vehicle');

    try {

        const session = await verifySession();
        if (!session?.data?.user) {
            return { status: 401, data: { message: e("unauthorized") } };
        }
        const hasPermissionAdd = await withAuthorizationPermission(['vehicles_park_update']);

        if (hasPermissionAdd.status != 200 || !hasPermissionAdd.data.hasPermission) {
            return { status: 403, data: { message: e('forbidden') } };
        }


        await Promise.all(vehicleMatriculesPark.map(async (vehicleMatricule) => {

            const vehicleExists = await prisma.vehicle.findFirst({ where: { matricule: vehicleMatricule.matricule } });
            const parkExists = !vehicleMatricule.park
                || vehicleMatricule.park === null
                || vehicleMatricule.park === "null"
                || vehicleMatricule.park === ""
                ? null
                : await prisma.park.findFirst({
                    where: {
                        name: {
                            equals: vehicleMatricule.park,
                            mode: 'insensitive',
                        },
                    },
                });
            if (parkExists && vehicleExists) {
                await prisma.vehicle_park.create({
                    data: {
                        vehicle_id: vehicleExists.id,
                        park_id: parkExists.id,
                        added_from: session.data.user.id,
                    },
                });
            }
        }));

        return { status: 200, data: { message: s("updatesuccess") } };
    } catch (error) {
        console.error("An error occurred in UpdateVehiclesParc:", error);
        return { status: 500, data: { message: e("error") } };
    }
}


export async function UpdateVehiclesRegionMatricules(vehicleMatriculesRegion: { matricule: string, region: string }[]) {
    const e = await getTranslations('Error');
    const s = await getTranslations('System');
    const v = await getTranslations('Vehicle');

    try {
        const session = await verifySession();
        if (!session?.data?.user) {
            return { status: 401, data: { message: e("unauthorized") } };
        }
        const hasPermissionAdd = await withAuthorizationPermission(['vehicles_region_update']);

        if (hasPermissionAdd.status != 200 || !hasPermissionAdd.data.hasPermission) {
            return { status: 403, data: { message: e('forbidden') } };
        }

        await Promise.all(vehicleMatriculesRegion.map(async (vehicleMatricule) => {
            const vehicleExists = await prisma.vehicle.findFirst({ where: { matricule: vehicleMatricule.matricule } });
            const regionExists = !vehicleMatricule.region
                || vehicleMatricule.region === null
                || vehicleMatricule.region === "null"
                || vehicleMatricule.region === ""
                ? null
                : await prisma.region.findFirst({
                    where: {
                        name: {
                            equals: vehicleMatricule.region,
                            mode: 'insensitive',
                        },
                    },
                });
            if (regionExists && vehicleExists)
                await prisma.vehicle_region.create({
                    data: {
                        vehicle_id: vehicleExists.id,
                        region_id: regionExists.id,
                        added_from: session.data.user.id,
                    },
                });
        }));

        return { status: 200, data: { message: s("updatesuccess") } };
    } catch (error) {
        console.error("An error occurred in UpdateVehiclesRegion:", error);
        return { status: 500, data: { message: e("error") } };
    }
}