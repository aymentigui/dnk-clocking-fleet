"use server"

import { prisma } from "@/lib/db";
import { getTranslations } from "next-intl/server";
import { withAuthorizationPermission, verifySession } from "../permissions";
import { z } from "zod";

// ============================================================================
// TYPES & SCHEMAS
// ============================================================================

interface VehicleData {
    matricule: string;
    model?: string;
    year?: string;
    brand?: string;
    vin?: string;
    park?: string;
    region?: string;
}

function createVehicleSchema(translations: any) {
    return z.object({
        matricule: z.string().min(1, translations("matriculerequired")),
        model: z.string().optional(),
        year: z.string().optional().refine(
            (value) => !value || value === '' || value === 'null' ||
                (Number(value) >= 1886 && Number(value) <= new Date().getFullYear()),
            { message: translations("yearinvalid") }
        ),
        brand: z.string().optional(),
        vin: z.string().optional(),
        park: z.string().optional(),
        region: z.string().optional(),
    });
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

async function validateMatriculeUniqueness(matricule: string, translations: any) {
    const exists = await prisma.vehicle.findFirst({ where: { matricule } });

    if (exists) {
        return { isValid: false, message: translations("matriculeexists") };
    }

    return { isValid: true };
}

async function validateVinUniqueness(vin: string | undefined, translations: any) {
    if (!vin) return { isValid: true };

    const exists = await prisma.vehicle.findFirst({ where: { vin } });

    if (exists) {
        return { isValid: false, message: translations("vinexists") };
    }

    return { isValid: true };
}

// ============================================================================
// VEHICLE CREATION
// ============================================================================

async function createVehicleRecord(
    data: VehicleData,
    userId: string
) {
    return prisma.vehicle.create({
        data: {
            matricule: data.matricule,
            model: data.model,
            brand: data.brand,
            year: data.year === "" ? null : data.year ? Number(data.year) : null,
            vin: data.vin,
            park_id: data.park || null,
            region_id: data.region || null,
            added_from: userId,
        },
    });
}

async function assignVehiclePark(
    vehicleId: string,
    parkId: string,
    userId: string
) {
    const hasPermission = await withAuthorizationPermission(['vehicles_park_update']);
    if (hasPermission.status !== 200 || !hasPermission.data.hasPermission) {
        return;
    }

    const parkExists = await prisma.park.findFirst({ where: { id: parkId } });
    if (!parkExists) return;

    await prisma.vehicle_park.create({
        data: {
            vehicle_id: vehicleId,
            park_id: parkId,
            added_from: userId,
        },
    });

    await prisma.vehicle.update({
        where: { id: vehicleId },
        data: { park_id: parkId },
    });
}

async function assignVehicleRegion(
    vehicleId: string,
    regionId: string,
    userId: string
) {
    const hasPermission = await withAuthorizationPermission(['vehicles_region_update']);
    if (hasPermission.status !== 200 || !hasPermission.data.hasPermission) {
        return;
    }

    const regionExists = await prisma.region.findFirst({ where: { id: regionId } });
    if (!regionExists) return;

    await prisma.vehicle_region.create({
        data: {
            vehicle_id: vehicleId,
            region_id: regionId,
            added_from: userId,
        },
    });

    await prisma.vehicle.update({
        where: { id: vehicleId },
        data: { region_id: regionId },
    });
}

// ============================================================================
// BULK CREATION HELPER
// ============================================================================

async function addSingleVehicle(
    data: any,
    schema: z.ZodSchema,
    session: any,
    translations: { vehicle: any; system: any }
) {
    try {
        // Normalize data
        const normalizedData = {
            matricule: data.matricule ?? undefined,
            model: data.model ?? undefined,
            year: String(data.year),
            brand: data.brand ?? undefined,
            vin: data.vin ?? undefined,
            park: data.park ?? undefined,
            region: data.region ?? undefined,
        };

        // Validate
        const result = schema.safeParse(normalizedData);
        if (!result.success) {
            const message = result.error.errors.map(err => err.message).join(', ');
            return { status: 400, data: { message, vehicle: data } };
        }

        const { matricule, model, year, vin, brand, park, region } = result.data;

        // Check uniqueness
        const matriculeCheck = await validateMatriculeUniqueness(matricule, translations.vehicle);
        if (!matriculeCheck.isValid) {
            return { status: 400, data: { message: matriculeCheck.message, vehicle: data } };
        }

        const vinCheck = await validateVinUniqueness(vin, translations.vehicle);
        if (!vinCheck.isValid) {
            return { status: 400, data: { message: vinCheck.message, vehicle: data } };
        }

        // Create vehicle
        const vehicle = await createVehicleRecord(
            { matricule, model, year, vin, brand, park, region },
            session.data.user.id
        );

        // Assign park (by name for bulk import)
        if (park) {
            const hasPermission = await withAuthorizationPermission(['vehicles_park_update']);
            if (hasPermission.status === 200 && hasPermission.data.hasPermission) {
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

        // Assign region (by name for bulk import)
        if (region) {
            const hasPermission = await withAuthorizationPermission(['vehicles_region_update']);
            if (hasPermission.status === 200 && hasPermission.data.hasPermission) {
                const regionExists = await prisma.region.findFirst({ where: { name: park } });
                if (regionExists) {
                    await prisma.vehicle_region.create({
                        data: {
                            vehicle_id: vehicle.id,
                            region_id: regionExists.id,
                            added_from: session.data.user.id,
                        },
                    });
                }
            }
        }

        return { status: 200, data: data };

    } catch (error) {
        console.log("An error occurred in addVehicle:", error);
        return { status: 500, data: { message: translations.system("createfail"), vehicle: data } };
    }
}

// ============================================================================
// PUBLIC API
// ============================================================================

export async function createVehicle(data: any) {
    const [u, s, e] = await Promise.all([
        getTranslations("Vehicle"),
        getTranslations("System"),
        getTranslations("Error")
    ]);

    try {
        // Authentication
        const session = await verifySession();
        if (!session || session.status !== 200) {
            return { status: 401, data: { message: e('unauthorized') } };
        }

        // Permission check
        const hasPermission = await withAuthorizationPermission(['vehicles_create']);
        if (hasPermission.status !== 200 || !hasPermission.data.hasPermission) {
            return { status: 403, data: { message: e('forbidden') } };
        }

        // Validation
        const schema = createVehicleSchema(u);
        const result = schema.safeParse(data);

        if (!result.success) {
            return { status: 400, data: { errors: result.error.errors } };
        }

        const { matricule, model, year, vin, brand, park, region } = result.data;

        // Check uniqueness
        const matriculeCheck = await validateMatriculeUniqueness(matricule, u);
        if (!matriculeCheck.isValid) {
            return { status: 400, data: { message: matriculeCheck.message } };
        }

        const vinCheck = await validateVinUniqueness(vin, u);
        if (!vinCheck.isValid) {
            return { status: 400, data: { message: vinCheck.message } };
        }

        // Create vehicle
        const vehicle = await createVehicleRecord(
            { matricule, model, year, vin, brand },
            session.data.user.id
        );

        // Assign park (by ID for single creation)
        if (park) {
            await assignVehiclePark(vehicle.id, park, session.data.user.id);
        }

        // Assign region (by ID for single creation)
        if (region) {
            await assignVehicleRegion(vehicle.id, region, session.data.user.id);
        }

        return { status: 200, data: { message: s("createsuccess") } };

    } catch (error) {
        console.log("An error occurred in createVehicle:", error);
        return { status: 500, data: { message: s("createfail") } };
    }
}

export async function createVehicles(data: any) {
    const [u, s, e] = await Promise.all([
        getTranslations("Vehicle"),
        getTranslations("System"),
        getTranslations("Error")
    ]);

    try {
        // Authentication
        const session = await verifySession();
        if (!session || session.status !== 200) {
            return { status: 401, data: { message: e('unauthorized') } };
        }

        // Permission check
        const hasPermission = await withAuthorizationPermission(['vehicles_create']);
        if (hasPermission.status !== 200 || !hasPermission.data.hasPermission) {
            return { status: 403, data: { message: e('forbidden') } };
        }

        // Create schema
        const schema = createVehicleSchema(u);

        // Process all vehicles in parallel
        const vehiclePromises = data.map((vehicleData: any) =>
            addSingleVehicle(vehicleData, schema, session, { vehicle: u, system: s })
        );

        const vehiclesResults = await Promise.all(vehiclePromises);

        return {
            status: 200,
            data: {
                message: s("createsuccess"),
                vehicles: vehiclesResults
            }
        };

    } catch (error) {
        console.log("An error occurred in createVehicles:", error);
        return { status: 500, data: { message: s("createfail") } };
    }
}