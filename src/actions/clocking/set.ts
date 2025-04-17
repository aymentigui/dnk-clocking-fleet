"use server"
import { prisma } from "@/lib/db";
import { getTranslations } from "next-intl/server";

export async function createClocking(data: any) {
    const u = await getTranslations("Clocking");
    const s = await getTranslations("System");
    const e = await getTranslations('Error');

    try {
        const existingUser = await prisma.user.findFirst({
            where: { username: data.user_id },
        });

        if (!existingUser) return { status: 404, data: { message: u("usernotfound") } };

        const existingDevice = await prisma.device.findFirst({
            where: { user_id: existingUser.id },
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


        await prisma.clocking.create({
            data: {
                vehicle_id: existingVehicle.id,
                device_id: existingDevice.id,
                type: data.type?? existingDevice.type,
            },
        });

        return { status: 200, data: { message: s("createsuccess") } };
    } catch (error) {
        console.error("An error occurred in createColocking" + error);
        return { status: 500, data: { message: s("createfail") } };
    }
}
