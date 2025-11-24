"use server"
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { verifySession } from "../permissions";
import { withAuthorizationPermission } from "../permissions";

export async function deleteConducteur(ids: string[]): Promise<{ status: number, data: { message: string } }> {
    const e = await getTranslations('Error');
    const s = await getTranslations('System');
    try {
        const session = await verifySession();
        if (!session?.data?.user) {
            return { status: 401, data: { message: e("unauthorized") } };
        }
        const hasPermissionAdd = await withAuthorizationPermission(['conducteur_delete'],session.data.user.id);

        if (hasPermissionAdd.status != 200 || !hasPermissionAdd.data.hasPermission) {
            return { status: 403, data: { message: e('forbidden') } };
        }

        await prisma.conducteur.deleteMany({ where: { id: { in: ids } } });

        return { status: 200, data: { message: s("deletesuccess") } };
    } catch (error) {
        return { status: 500, data: { message: e("error") } };
    }
}