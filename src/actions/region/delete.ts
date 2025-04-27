"use server"
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { verifySession } from "../permissions";
import { ISADMIN, withAuthorizationPermission } from "../permissions";
import { getUserName } from "../users/get";
import { sendEmail } from "../email";

export async function deleteRegion(ids: string[]): Promise<{ status: number, data: { message: string } }> {
    const e = await getTranslations('Error');
    const s = await getTranslations('System');
    try {
        const session = await verifySession();
        if (!session?.data?.user) {
            return { status: 401, data: { message: e("unauthorized") } };
        }
        const hasPermissionAdd = await withAuthorizationPermission(['region_delete'],session.data.user.id);

        if (hasPermissionAdd.status != 200 || !hasPermissionAdd.data.hasPermission) {
            return { status: 403, data: { message: e('forbidden') } };
        }

        const regions = await prisma.region.findMany({ where: { id: { in: ids } } });
        await prisma.region.deleteMany({ where: { id: { in: ids } } });

        const userName = (await getUserName(session.data.user.id)).data
        await prisma.notification.create(
            {
                data: {
                    title: ids.length > 1 ? "Des regions ont été supprimés" : "Une region a été supprimé",   
                    contenu: (ids.length > 1 ? "Des regions ont été supprimés" : "Une region a été supprimé") + " par " + userName + "\n Nombre de regions supprimée : " + ids.length + "\n Regions supprimée : " + regions.map(region => "\n Region : " + region.name+" "+region.address+" "+region.description),
                    user: {
                        connect: {
                            id: session.data.user.id
                        }
                    }
                }
            }
        )

        const emails = await prisma.user.findMany({ where: { is_admin: true } })
        await Promise.all(
            emails.map(async (email) => {
                if (email.email) {
                    try {
                        await sendEmail(
                            email.email,
                            ids.length > 1 ? "Des regions ont été supprimés" : "Une region a été supprimé",   
                            (ids.length > 1 ? "Des regions ont été supprimés" : "Une region a été supprimé") + " par " + userName + "\n Nombre de regions supprimée : " + ids.length + "\n Regions supprimée : " + regions.map(region => "\n Region : " + region.name+" "+region.address+" "+region.description),
                        )
                    } catch (erreur) {
                        console.log("error sendig mail analyse to" + email.email)
                    }
                }
            })
        )

        return { status: 200, data: { message: s("deletesuccess") } };
    } catch (error) {
        console.error("An error occurred in deleteRegion");
        return { status: 500, data: { message: e("error") } };
    }
}
