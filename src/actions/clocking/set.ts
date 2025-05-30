"use server"
import { prisma } from "@/lib/db";
import { getTranslations } from "next-intl/server";
import { verifySession } from "../permissions";
import { sendEmail } from "../email";

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
            include: { park: true, region: true },
        });

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
            include: {
                park: true
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
            include: {
                region: true
            },
            orderBy: {
                added_at: "desc",
            },
            take: 1,
        });

        const status = data.type !== 3 ?
            (existingVehiclePark && existingDevice.park_id && existingVehiclePark.park_id == existingDevice.park_id ? 1 : 0)
            : (existingVehicleRegion && existingDevice.region_id && existingVehicleRegion.region_id == existingDevice.region_id ? 1 : 0)

        await prisma.clocking.create({
            data: {
                vehicle_id: existingVehicle.id,
                device_id: existingDevice.id,
                park_id: existingDevice.park_id ?? null,
                regionId: existingDevice.region_id ?? null,
                type: data.type ?? 0,
                status: status,
            },
        });

        if (status == 0) {
            const emails = await prisma.user.findMany({ where: { is_admin: true } })

            await Promise.all(
                emails.map(async (email) => {
                    if (email.email) {
                        try {
                            await sendEmail(
                                email.email,
                                "un mauvais pointage d'une véhicule",
                                "La véhicule " + existingVehicle.matricule + "(de parc :" + existingVehiclePark?.park?.name + " et station :" + existingVehicleRegion?.region?.name + ")" + " vient de passer un pointage incorrect" + (existingDevice.park ? " dans la station " + existingDevice.park.name + "(" + existingDevice.park.address + ")" : existingDevice.region ? " dans la region " + existingDevice.region.name + "(" + existingDevice.region.address + ")" : " avec un appareil qui n'a pas de parc et pas de région")
                            )
                        } catch (erreur) {
                            console.log("error sendig mail analyse to" + email.email)
                        }
                    }
                })
            )
            await prisma.notification.create({
                data: {
                    title: "un mauvais pointage d'une véhicule",
                    contenu: "La véhicule " + existingVehicle.matricule + "(de parc :" + existingVehiclePark?.park?.name + " et station :" + existingVehicleRegion?.region?.name + ")" + " vient de passer un pointage incorrect" + (existingDevice.park ? " dans la station " + existingDevice.park.name + "(" + existingDevice.park.address + ")" : existingDevice.region ? " dans la region " + existingDevice.region.name + "(" + existingDevice.region.address + ")" : " avec un appareil qui n'a pas de parc et pas de région"),
                    user: {
                        connect: {
                            id: session.data.user.id
                        }
                    }
                }
            })
        }


        return { status: 200, data: { message: s("createsuccess") } };
    } catch (error) {
        console.error("An error occurred in createColocking" + error);
        return { status: 500, data: { message: s("createfail") } };
    }
}
