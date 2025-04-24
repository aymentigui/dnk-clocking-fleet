"use server"
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { verifySession } from "../permissions";
import { ISADMIN, withAuthorizationPermission } from "../permissions";
import { getUserName } from "../users/get";

export async function deletePark(ids: string[]): Promise<{ status: number, data: { message: string } }> {
    const e = await getTranslations('Error');
    const s = await getTranslations('System');
    try {
        const session = await verifySession();
        if (!session?.data?.user) {
            return { status: 401, data: { message: e("unauthorized") } };
        }
        const hasPermissionAdd = await withAuthorizationPermission(['park_delete'],session.data.user.id);

        if (hasPermissionAdd.status != 200 || !hasPermissionAdd.data.hasPermission) {
            return { status: 403, data: { message: e('forbidden') } };
        }

        const parcs = await prisma.park.findMany({ where: { id: { in: ids } } });
        await prisma.park.deleteMany({ where: { id: { in: ids } } });

        await prisma.notification.create(
            {
                data: {
                    title: ids.length > 1 ? "Des parcs ont été supprimés" : "Un parc a été supprimé",   
                    contenu: (ids.length > 1 ? "Des parcs ont été supprimés" : "Un parc a été supprimé") + " par " + getUserName(session.data.user.id) + "\n Nombre de parcs supprimé : " + ids.length + "\n Parcs supprimé : " + parcs.map(park => "\n Parc : " + park.name+" "+park.address+" "+park.description),
                    user: {
                        connect: {
                            id: session.data.user.id
                        }
                    }
                }
            }
        )

        return { status: 200, data: { message: s("deletesuccess") } };
    } catch (error) {
        console.error("An error occurred in deletePark");
        return { status: 500, data: { message: e("error") } };
    }
}
