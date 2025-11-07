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
            return { status: 401, data: { message: "غير مصرح لك" } }
        }


        const existingDevice = await prisma.device.findFirst({
            where: { user_id: session.data.user.id },
            include: { park: true, region: true },
        });

        if (!existingDevice) return { status: 404, data: { message: "لم يتم التعرف على جهازك" } };

        if (!existingDevice.park_id && !existingDevice.region_id) return { status: 404, data: { message: "لم يتم تكوين جهازك" } };

        if (existingDevice.park_id) {
            const existingPark = await prisma.park.findFirst({
                where: { id: existingDevice.park_id },
            });

            if (!existingPark) return { status: 404, data: { message: "موقف الحافلات غير موجود" } };
        }

        if (existingDevice.region_id) {
            const existingPark = await prisma.region.findFirst({
                where: { id: existingDevice.region_id },
            });

            if (!existingPark) return { status: 404, data: { message: "المحطة غير موجودة" } };
        }

        const existingVehicle = await prisma.vehicle.findFirst({
            where: { matricule: data.matricule },
            include: {
                park: true,
                region: true,
            }
        });

        if (!existingVehicle) return { status: 404, data: { message: "الحافلة غير موجودة" } };

        if (existingVehicle.in_park && (data.type === 1 || data.type === 3 || data.type === 4)) {
            return {
                status: 400, data: {
                    message: "المركبة موجودة في موقف الحافلات"
                }
            }

        } else if ((data.type === 0)) {
            await prisma.vehicle.update({
                where: { id: existingVehicle.id },
                data: { in_park: false },
            });
        } else if (data.type === 1) {
            await prisma.vehicle.update({
                where: { id: existingVehicle.id },
                data: { in_park: true },
            });
        }

        const existingConducteur = await prisma.conducteur.findFirst({
            where: { matricule: data.conducteur_matricule },
        });

        if (!existingConducteur) return {
            status: 404, data: {
                message: "السائق غير موجود"
                // message: u("conducteurnotfound")
            }
        };


        const status = (data.type === 3 || data.type === 4) ?
            (existingVehicle.region_id && existingDevice.region_id && existingVehicle.region_id == existingDevice.region_id ? 1 : 0)
            : (existingVehicle.park_id && existingDevice.park_id && existingVehicle.park_id == existingDevice.park_id ? 1 : 0)


        await prisma.clocking.create({
            data: {
                vehicle_id: existingVehicle.id,
                device_id: existingDevice.id,
                park_id: existingDevice.park_id ?? null,
                regionId: existingDevice.region_id ?? null,
                type: data.type ?? 0,
                status: status,
                conducteur_id: existingConducteur.id,
                conducteur_matricule: existingConducteur.matricule,
                conducteur_name: `${existingConducteur.firstname} ${existingConducteur.lastname}`,
            },
        });

        let course = null;

        switch (data.type) {
            case 0:
                await prisma.vehicle.update({
                    where: { id: existingVehicle.id },
                    data: { status: "exit_from_park" },
                });
                break;
            case 1:
                await prisma.vehicle.update({
                    where: { id: existingVehicle.id },
                    data: { status: "entry_to_park" },
                });
                break;
            case 3:
                await prisma.vehicle.update({
                    where: { id: existingVehicle.id },
                    data: { status: "exit_from_region" },
                });
                break;
            case 4:
                await prisma.vehicle.update({
                    where: { id: existingVehicle.id },
                    data: { status: "entry_to_region" },
                });
                const date = new Date();
                course = await prisma.course.findFirst({
                    where: {
                        vehicle_id: existingVehicle.id,
                        end_date: null,
                        start_date: {
                            lte: date
                        }
                    },
                });
                if (course) {
                    await prisma.course.update({
                        where: { id: course.id },
                        data: {
                            end_date: date,
                        },
                    });
                } else {
                    await prisma.course.create({
                        data: {
                            vehicle_id: existingVehicle.id,
                            conducteur_id: existingConducteur.id,
                            conducteur_matricule: existingConducteur.matricule,
                            conducteur_name: `${existingConducteur.firstname} ${existingConducteur.lastname}`,
                            start_date: date,
                            start_station: existingDevice.region_id,
                        },
                    });
                }
                break;
        }

        if (status == 0) {
            const emails = await prisma.user.findMany({ where: { is_admin: true } })

            Promise.all(
                emails.map(async (email) => {
                    if (email.email) {
                        try {
                            await sendEmail(
                                email.email,
                                "un mauvais pointage d'une véhicule",
                                "La véhicule " + existingVehicle.matricule + "(de parc :" + existingVehicle?.park?.name + " et parc :" + existingVehicle?.region?.name + ")" + " vient de passer un pointage incorrect" + (existingDevice.park ? " dans la parc " + existingDevice.park.name + "(" + existingDevice.park.address + ")" : existingDevice.region ? " dans la region " + existingDevice.region.name + "(" + existingDevice.region.address + ")" : " avec un appareil qui n'a pas de parc et pas de région")
                            )
                        } catch (erreur) {
                            // console.log("error sendig mail analyse to" + email.email)
                        }
                    }
                })
            )
            prisma.notification.create({
                data: {
                    title: "un mauvais pointage d'une véhicule",
                    contenu: "La véhicule " + existingVehicle.matricule + "(de parc :" + existingVehicle?.park?.name + " et parc :" + existingVehicle?.region?.name + ")" + " vient de passer un pointage incorrect" + (existingDevice.park ? " dans la parc " + existingDevice.park.name + "(" + existingDevice.park.address + ")" : existingDevice.region ? " dans la region " + existingDevice.region.name + "(" + existingDevice.region.address + ")" : " avec un appareil qui n'a pas de parc et pas de région"),
                    user: {
                        connect: {
                            id: session.data.user.id
                        }
                    }
                }
            })
        }

        const conducteur_name = `${existingConducteur?.firstname ?? ''} ${existingConducteur?.lastname ?? ''}`.trim();
        const vehicle = [existingVehicle?.matricule, existingVehicle?.model, existingVehicle?.brand]
            .filter(Boolean)
            .join(' --- ') || 'N/A';
        return { status: 200, data: { message: "تم الاستقبال بنجاج", conducteur_name: conducteur_name, vehicle: vehicle } };
    } catch (error) {
        // console.log("An error occurred in createColocking" + error);
        return { status: 500, data: { message: "حدث مشكل" } };
    }
}
