"use server"

import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { withAuthorizationPermission,verifySession } from "../permissions";

export async function getNotifications(page: number): Promise<{ status: number, data: any, count: number }> {
    const e = await getTranslations('Error');
    try {
        const session = await verifySession();
        if (!session?.data?.user) {
            return { status: 401, data: { message: e("unauthorized") }, count: 0 };
        }
        const hasPermission = await withAuthorizationPermission(['notifications_view'],session.data.user.id);

        if(hasPermission.status != 200 || !hasPermission.data.hasPermission) {
            return { status: 403, data: { message: e('forbidden') }, count: 0 };
        }

        const notifications = await prisma.notification.findMany({
            skip: (page - 1) * 10,
            take: 10,
            include: {
                user: true
            },
            orderBy: {
                created_at: "desc",
            },
        });

        const notificationCount = await prisma.notification.count();

        const formattedNotifications = notifications.map(notification => ({
            id:notification.id,
            title:notification.title,
            contenu:notification.contenu,
            created_at: notification.created_at ? new Intl.DateTimeFormat('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(notification.created_at)) : '',
            view: notification.view_by?notification.view_by.includes(session.data.user.id):false,
        }));
        
        return { status: 200, data: formattedNotifications, count: notificationCount };
    } catch (error) {
        console.error("An error occurred in getNotifications");
        return { status: 500, data: { message: e("error") }, count: 0 };
    }
}

// muste have permission update
export async function getNotification(id: string): Promise<{ status: number, data: any }> {
    const e = await getTranslations('Error');
    try {
        const session = await verifySession();
        if (!session?.data?.user) {
            return { status: 401, data: { message: e("unauthorized") } };
        }
        const hasPermissionAdd = await withAuthorizationPermission(['notifications_view'],session.data.user.id);
        
        if(hasPermissionAdd.status != 200 || !hasPermissionAdd.data.hasPermission) {
            return { status: 403, data: { message: e('forbidden') } };
        }
        const notification = await prisma.notification.findUnique({ where: { id } });

        if(notification)
            await prisma.notification.update({ where: { id }, data: { view_by: notification.view_by ? notification.view_by+","+session.data.user.id : session.data.user.id+""} });

        return { status: 200, data: !notification ? null : {
            id:notification.id,
            title:notification.title,
            contenu:notification.contenu,
            created_at: notification.created_at ? new Intl.DateTimeFormat('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(notification.created_at)) : '',
            view: notification.view_by?notification.view_by.includes(session.data.user.id):false,
        } };
    } catch (error) {
        console.error("An error occurred in getNotification");
        return { status: 500, data: { message: e("error") } };
    }
}