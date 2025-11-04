"use server"

import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { withAuthorizationPermission, verifySession } from "../permissions";
import { z } from "zod";

// ============================================================================
// HELPERS
// ============================================================================

async function getPermissions(permissionKeys: string[]): Promise<Record<string, boolean>> {
    const results = await Promise.all(
        permissionKeys.map(key => withAuthorizationPermission([key]))
    );

    return permissionKeys.reduce((acc, key, index) => {
        acc[key] = !!(results[index].status === 200 && results[index].data.hasPermission);
        return acc;
    }, {} as Record<string, boolean>);
}

function createVehicleSchema(translations: any) {
    return z.object({
        matricule: z.string().min(1, translations("matriculerequired")),
        model: z.string().optional(),
        year: z.string().optional().refine(
            (value) => !value || value === '' ||
                (Number(value) >= 1886 && Number(value) <= new Date().getFullYear()),
            { message: translations("yearinvalid") }
        ),
        brand: z.string().optional(),
        vin: z.string().optional(),
        park: z.string().optional(),
        region: z.string().optional(),
    });
}

async function checkMatriculeUniqueness(matricule: string, excludeId: string, translations: any) {
    const existing = await prisma.vehicle.findFirst({
        where: { matricule, id: { not: excludeId } },
    });

    if (existing) {
        return { isValid: false, message: translations("matriculeexists") };
    }

    return { isValid: true };
}

async function checkVinUniqueness(vin: string | undefined, excludeId: string, translations: any) {
    if (!vin) return { isValid: true };

    const existing = await prisma.vehicle.findFirst({
        where: { vin, id: { not: excludeId } },
    });

    if (existing) {
        return { isValid: false, message: translations("vinexists") };
    }

    return { isValid: true };
}

async function updateVehicleBasicInfo(
    vehicleId: string,
    data: { matricule: string; model?: string; year?: string; brand?: string; vin?: string }
) {
    return prisma.vehicle.update({
        where: { id: vehicleId },
        data: {
            matricule: data.matricule,
            model: data.model,
            year: data.year === "" ? null : data.year ? Number(data.year) : undefined,
            brand: data.brand,
            vin: data.vin,
        },
    });
}

async function updateVehiclePark(
    vehicleId: string,
    newParkId: string | undefined,
    userId: string
) {
    const currentPark = await prisma.vehicle_park.findFirst({
        where: { vehicle_id: vehicleId },
        orderBy: { added_at: 'desc' },
    });

    const shouldUpdate = (currentPark && currentPark.park_id !== newParkId) ||
        (!currentPark && newParkId);

    if (!shouldUpdate) return;

    const parkExists = newParkId ? await prisma.park.findFirst({ where: { id: newParkId } }) : null;

    await prisma.vehicle_park.create({
        data: {
            vehicle_id: vehicleId,
            park_id: parkExists?.id || null,
            added_from: userId,
        },
    });

    await prisma.vehicle.update({
        where: { id: vehicleId },
        data: { park_id: parkExists?.id || null },
    });
}

async function updateVehicleRegion(
    vehicleId: string,
    newRegionId: string | undefined,
    userId: string
) {
    const currentRegion = await prisma.vehicle_region.findFirst({
        where: { vehicle_id: vehicleId },
        orderBy: { added_at: 'desc' },
    });

    const shouldUpdate = (currentRegion && currentRegion.region_id !== newRegionId) ||
        (!currentRegion && newRegionId);

    if (!shouldUpdate) return;

    const regionExists = newRegionId ? await prisma.region.findFirst({ where: { id: newRegionId } }) : null;

    await prisma.vehicle_region.create({
        data: {
            vehicle_id: vehicleId,
            region_id: regionExists?.id || null,
            added_from: userId,
        },
    });

    await prisma.vehicle.update({
        where: { id: vehicleId },
        data: { region_id: regionExists?.id || null },
    });
}

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

export async function UpdateVehicle(id: string, data: any) {
    const [e, s, v] = await Promise.all([
        getTranslations('Error'),
        getTranslations('System'),
        getTranslations('Vehicle')
    ]);

    try {
        // Authentication
        const session = await verifySession();
        if (!session?.data?.user) {
            return { status: 401, data: { message: e("unauthorized") } };
        }

        // Permissions
        const permissions = await getPermissions([
            'vehicles_update',
            'vehicles_park_update',
            'vehicles_region_update'
        ]);

        // Validation
        const schema = createVehicleSchema(v);
        const result = schema.safeParse(data);

        if (!result.success) {
            return { status: 400, data: { errors: result.error.errors } };
        }

        const { matricule, model, year, brand, vin, park, region } = result.data;

        // Check vehicle exists
        const vehicle = await prisma.vehicle.findUnique({ where: { id } });
        if (!vehicle) {
            return { status: 404, data: { message: v("vehiclenotfound") } };
        }

        // Update basic info
        if (permissions['vehicles_update']) {
            const matriculeCheck = await checkMatriculeUniqueness(matricule, id, v);
            if (!matriculeCheck.isValid) {
                return { status: 400, data: { message: matriculeCheck.message } };
            }

            const vinCheck = await checkVinUniqueness(vin, id, v);
            if (!vinCheck.isValid) {
                return { status: 400, data: { message: vinCheck.message } };
            }

            await updateVehicleBasicInfo(id, { matricule, model, year, brand, vin });
        }

        // Update park
        if (permissions['vehicles_park_update']) {
            await updateVehiclePark(id, park, session.data.user.id);
        }

        // Update region
        if (permissions['vehicles_region_update']) {
            await updateVehicleRegion(id, region, session.data.user.id);
        }

        return { status: 200, data: { message: s("updatesuccess") } };

    } catch (error) {
        console.log("An error occurred in UpdateVehicle:", error);
        return { status: 500, data: { message: e("error") } };
    }
}

export async function UpdateVehiclesParcMatricule(
    vehicleMatriculesPark: { matricule: string; park: string }[]
) {
    const [e, s] = await Promise.all([
        getTranslations('Error'),
        getTranslations('System')
    ]);

    try {
        // Authentication
        const session = await verifySession();
        if (!session?.data?.user) {
            return { status: 401, data: { message: e("unauthorized") } };
        }

        // Permission check
        const hasPermission = await withAuthorizationPermission(['vehicles_park_update']);
        if (hasPermission.status !== 200 || !hasPermission.data.hasPermission) {
            return { status: 403, data: { message: e('forbidden') } };
        }

        // Process updates
        await Promise.all(vehicleMatriculesPark.map(async ({ matricule, park }) => {
            const vehicle = await prisma.vehicle.findFirst({ where: { matricule } });
            if (!vehicle) return;

            const shouldSkipPark = !park || park === "null" || park === "";
            const parkRecord = shouldSkipPark ? null : await prisma.park.findFirst({
                where: { name: { equals: park } }
            });

            if (!parkRecord) return;

            await prisma.vehicle_park.create({
                data: {
                    vehicle_id: vehicle.id,
                    park_id: parkRecord.id,
                    added_from: session.data.user.id,
                },
            });

            await prisma.vehicle.update({
                where: { id: vehicle.id },
                data: { park_id: parkRecord.id },
            });
        }));

        return { status: 200, data: { message: s("updatesuccess") } };

    } catch (error) {
        console.log("An error occurred in UpdateVehiclesParc:", error);
        return { status: 500, data: { message: e("error") } };
    }
}

export async function UpdateVehiclesRegionMatricules(
    vehicleMatriculesRegion: { matricule: string; region: string }[]
) {
    const [e, s] = await Promise.all([
        getTranslations('Error'),
        getTranslations('System')
    ]);

    try {
        // Authentication
        const session = await verifySession();
        if (!session?.data?.user) {
            return { status: 401, data: { message: e("unauthorized") } };
        }

        // Permission check
        const hasPermission = await withAuthorizationPermission(['vehicles_region_update']);
        if (hasPermission.status !== 200 || !hasPermission.data.hasPermission) {
            return { status: 403, data: { message: e('forbidden') } };
        }

        // Process updates
        await Promise.all(vehicleMatriculesRegion.map(async ({ matricule, region }) => {
            const vehicle = await prisma.vehicle.findFirst({ where: { matricule } });
            if (!vehicle) return;

            const shouldSkipRegion = !region || region === "null" || region === "";
            const regionRecord = shouldSkipRegion ? null : await prisma.region.findFirst({
                where: { name: { equals: region } }
            });

            if (!regionRecord) return;

            await prisma.vehicle_region.create({
                data: {
                    vehicle_id: vehicle.id,
                    region_id: regionRecord.id,
                    added_from: session.data.user.id,
                },
            });

            await prisma.vehicle.update({
                where: { id: vehicle.id },
                data: { region_id: regionRecord.id },
            });
        }));

        return { status: 200, data: { message: s("updatesuccess") } };

    } catch (error) {
        console.log("An error occurred in UpdateVehiclesRegion:", error);
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

        await prisma.vehicle.updateMany({
            where: { id: { in: vehicleIds } },
            data: { park_id: parcId === "null" ? null : parcId },
        });

        return { status: 200, data: { message: s("updatesuccess") } };
    } catch (error) {
        console.log("An error occurred in UpdateVehiclesParc:", error);
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

        await prisma.vehicle.updateMany({
            where: { id: { in: vehicleIds } },
            data: { region_id: regionId === "null" ? null : regionId },
        });

        return { status: 200, data: { message: s("updatesuccess") } };
    } catch (error) {
        console.log("An error occurred in UpdateVehiclesRegion:", error);
        return { status: 500, data: { message: e("error") } };
    }
}
