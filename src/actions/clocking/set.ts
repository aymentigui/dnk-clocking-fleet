"use server"
import { prisma } from "@/lib/db";
import { getTranslations } from "next-intl/server";
import { verifySession } from "../permissions";

export async function createClocking(data: any) {
    const u = await getTranslations("Clocking");
    const s = await getTranslations("System");
    const e = await getTranslations('Error');

    try {

        const session = await verifySession()
        if (!session || session.status != 200) {
            return { status: 401, data: { message: e('unauthorized') } }
        }


        const existingDevice = await prisma.device.findFirst({
            where: { user_id: session.data.user.id },
        });

        console.log(existingDevice);

        if (!existingDevice) return { status: 404, data: { message: u("devicenotfound") } };

        if (!existingDevice.park_id && !existingDevice.region_id) return { status: 404, data: { message: u("parknotfound") } };

        if (existingDevice.park_id) {
            const existingPark = await prisma.park.findFirst({
                where: { id: existingDevice.park_id },
            });

            if (!existingPark) return { status: 404, data: { message: u("parknotfound") } };
        }

        if (existingDevice.region_id) {
            const existingPark = await prisma.region.findFirst({
                where: { id: existingDevice.region_id },
            });

            if (!existingPark) return { status: 404, data: { message: u("regionnotfound") } };
        }


        const existingVehicle = await prisma.vehicle.findFirst({
            where: { matricule: data.matricule },
        });

        if (!existingVehicle) return { status: 404, data: { message: u("vehiclenotfound") } };

        const existingVehiclePark = await prisma.vehicle_park.findFirst({
            where: {
                vehicle_id: existingVehicle.id,
            },
            orderBy: {
                added_at: "desc",
            },
            take: 1,
        });

        const existingVehicleRegion = await prisma.vehicle_region.findFirst({
            where: {
                vehicle_id: existingVehicle.id,
            },
            orderBy: {
                added_at: "desc",
            },
            take: 1,
        });

        await prisma.clocking.create({
            data: {
                vehicle_id: existingVehicle.id,
                device_id: existingDevice.id,
                park_id: existingDevice.park_id ?? null,
                regionId: existingDevice.region_id ?? null,
                type: data.type ?? 0,
                status: data.type !== 3 ?
                    (existingVehiclePark && existingDevice.park_id && existingVehiclePark.park_id == existingDevice.park_id ? 1 : 0)
                    : (existingVehicleRegion && existingDevice.region_id && existingVehicleRegion.region_id == existingDevice.region_id ? 1 : 0),
            },
        });

        return { status: 200, data: { message: s("createsuccess") } };
    } catch (error) {
        console.error("An error occurred in createColocking" + error);
        return { status: 500, data: { message: s("createfail") } };
    }
}
