"use server"
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { verifySession } from "../permissions";
import { ISADMIN, withAuthorizationPermission } from "../permissions";
import { getUserName } from "../users/get";
import { sendEmail } from "../email";

export async function deleteEntreprise(ids: string[]): Promise<{ status: number, data: { message: string } }> {
    const e = await getTranslations('Error');
    const s = await getTranslations('System');
    const c = await getTranslations('Company');

    try {
        const session = await verifySession();
        if (!session?.data?.user) {
            return { status: 401, data: { message: e("unauthorized") } };
        }
        const hasPermissionAdd = await withAuthorizationPermission(['entreprise_delete'], session.data.user.id);

        if (hasPermissionAdd.status != 200 || !hasPermissionAdd.data.hasPermission) {
            return { status: 403, data: { message: e('forbidden') } };
        }

        const entreprises = await prisma.entreprise.findMany({ where: { id: { in: ids } } });
        await prisma.entreprise.deleteMany({ where: { id: { in: ids } } });

        const successMessage = ids.length > 1 ? c("delete_success_plural") : c("delete_success");
        return { status: 200, data: { message: successMessage } };
    } catch (error) {
        return { status: 500, data: { message: e("error") } };
    }
}


export async function deleteEntrepriseRoutes(ids: string[]): Promise<{ status: number, data: { message: string } }> {
    const e = await getTranslations('Error');
    const s = await getTranslations('System');
    const c = await getTranslations('Company');

    try {
        const session = await verifySession();
        if (!session?.data?.user) {
            return { status: 401, data: { message: e("unauthorized") } };
        }
        const hasPermissionAdd = await withAuthorizationPermission(['entreprise_route_delete'], session.data.user.id);

        if (hasPermissionAdd.status != 200 || !hasPermissionAdd.data.hasPermission) {
            return { status: 403, data: { message: e('forbidden') } };
        }

        await prisma.entreprise_route.deleteMany({ where: { id: { in: ids } } });

        const successMessage = ids.length > 1 ? c("delete_success_plural") : c("delete_success");
        return { status: 200, data: { message: successMessage } };
    } catch (error) {
        return { status: 500, data: { message: e("error") } };
    }
}
