"use server"
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { verifySession } from "../permissions";
import { ISADMIN, withAuthorizationPermission } from "../permissions";
import { getUserName } from "../users/get";
import { sendEmail } from "../email";

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

        const conducteurs = await prisma.conducteur.findMany({ where: { id: { in: ids } } });
        await prisma.conducteur.deleteMany({ where: { id: { in: ids } } });

        const userName = (await getUserName(session.data.user.id)).data
        await prisma.notification.create(
            {
                data: {
                    title: ids.length > 1 ? "Des conducteurs ont été supprimés" : "Une conducteur a été supprimé",   
                    contenu: (ids.length > 1 ? "Des conducteurs ont été supprimés" : "Une conducteur a été supprimé") + " par " + userName + "\n Nombre de conducteur supprimée : " + ids.length + "\n conducteur supprimée : " + conducteurs.map(conducteur => "\n conducteur : " + conducteur.matricule+" "+conducteur.firstname+" "+conducteur.lastname),
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
                            ids.length > 1 ? "Des conducteurs ont été supprimés" : "Une conducteur a été supprimé",   
                            (ids.length > 1 ? "Des conducteurs ont été supprimés" : "Une conducteur a été supprimé") + " par " + userName + "\n Nombre de conducteurs supprimée : " + ids.length + "\n conducteurs supprimée : " + conducteurs.map(conducteur => "\n conducteur : " + conducteur.matricule+" "+conducteur.firstname+" "+conducteur.lastname),
                        )
                    } catch (erreur) {
                        console.log("error sendig mail analyse to" + email.email)
                    }
                }
            })
        )

        return { status: 200, data: { message: s("deletesuccess") } };
    } catch (error) {
        console.log("An error occurred in deleteconducteur");
        return { status: 500, data: { message: e("error") } };
    }
}
