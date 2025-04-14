"use server"
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { verifySession } from "../permissions";
import { ISADMIN, withAuthorizationPermission } from "../permissions";

export async function deleteDevices(ids: string[]): Promise<{ status: number, data: { message: string } }> {
    const e = await getTranslations('Error');
    const s = await getTranslations('System');
    try {
        const session = await verifySession();
        if (!session?.data?.user) {
            return { status: 401, data: { message: e("unauthorized") } };
        }
        const hasPermissionAdd = await withAuthorizationPermission(['devices_delete'],session.data.user.id);

        if (hasPermissionAdd.status != 200 || !hasPermissionAdd.data.hasPermission) {
            return { status: 403, data: { message: e('forbidden') } };
        }


        const devices = await prisma.device.findMany({
            where: {
                id: {
                    in: ids,
                },
            },
            select: {
                id: true,
                user: {
                    select: {
                        id: true,
                    },
                },
            },
        });

        console.log(1)

        const userIds = devices.map((device) => device.user.id).filter((id) => id !== null);

        await prisma.user.deleteMany({
            where: {
                id: {
                    in: userIds,
                },
            },
        });

        await prisma.device.deleteMany({
            where: {
                id: {
                    in: ids,
                },
            },
        });
        return { status: 200, data: { message: s("deletesuccess") } };
    } catch (error) {
        // @ts-ignore
        console.error("An error occurred in deleteDevice"+error.message);
        return { status: 500, data: { message: e("error") } };
    }
}
