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
            where: { user_id: session.data.user.id},
        });

        if (!existingDevice) return { status: 404, data: { message: u("devicenotfound") } };

        if (!existingDevice.park_id) return { status: 404, data: { message: u("parknotfound") } };


        const existingPark = await prisma.park.findFirst({
            where: { id: existingDevice.park_id },
        });

        if (!existingPark) return { status: 404, data: { message: u("parknotfound") } };

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


        await prisma.clocking.create({
            data: {
                vehicle_id: existingVehicle.id,
                device_id: existingDevice.id,
                park_id: existingDevice.park_id??null,
                type: data.type?? 0,
                status: existingVehiclePark && existingDevice.park_id  && existingVehiclePark.park_id == existingDevice.park_id ? 1 : 0,
            },
        });

        return { status: 200, data: { message: s("createsuccess") } };
    } catch (error) {
        console.error("An error occurred in createColocking" + error);
        return { status: 500, data: { message: s("createfail") } };
    }
}
