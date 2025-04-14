"use server"

import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { withAuthorizationPermission, verifySession } from "../permissions";
import { z } from "zod";
import bcrypt from "bcrypt";

export async function UpdateDevice(id: string, data: any) {
    const e = await getTranslations('Error');
    const s = await getTranslations('System');
    const u = await getTranslations('Parks');

    try {
        const schema = z.object({
            code: z.string().min(1, u("coderequired")),
            username: z.string().min(1, u("usernamerequired")).refine(username => !username.includes(' '), {
                message: u("usernamecontainspace")
            }),            password: z.string().min(6, u("password6")),
            park: z.string().optional(),
        });

        const session = await verifySession();
        if (!session?.data?.user) {
            return { status: 401, data: { message: e("unauthorized") } };
        }
        const hasPermissionAdd = await withAuthorizationPermission(['devices_update']);

        if (hasPermissionAdd.status != 200 || !hasPermissionAdd.data.hasPermission) {
            return { status: 403, data: { message: e('forbidden') } };
        }

        const result = schema.safeParse(data);

        if (!result.success) {
            console.log(result.error.errors);
            return { status: 400, data: { errors: result.error.errors } };
        }
        const { code, username, password, park } = result.data;

        const deviceExists = await prisma.device.findFirst({ where: { id } });

        if (!deviceExists || !deviceExists.user_id) {
            return { status: 400, data: { message: u("devicenotfound") } };
        }
        const codeExists = await prisma.device.findFirst({ where: { code, id: { not: id } } });
        if (codeExists) {
            return { status: 400, data: { message: u("codeexists") } };
        }

        const usernameExists = await prisma.device.findFirst({
            where: { username, id: { not: id } }
        });

        if (usernameExists) {
            return { status: 400, data: { message: u("usernameexists") } };
        }

        const usernameExistsUser = await prisma.user.findFirst({
            where: {
                username, id: { not: deviceExists.user_id }
            }
        });

        if (usernameExistsUser) {
            return { status: 400, data: { message: u("usernameexists") } };
        }

        const emailExists = await prisma.user.findFirst({ where: { email: username + "@email.com", id: { not: deviceExists.user_id } } });

        if (emailExists) {
            return { status: 400, data: { message: u("usernameexists") } };
        }

        if (park) {
            const parkExists = await prisma.park.findFirst({ where: { id: park } });

            if (!parkExists) {
                return { status: 400, data: { message: u("parknotexist") } };
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.update({
            where: {
                id: deviceExists.user_id
            },
            data: {
                username: username,
                email: "" + username + "@email.com",
                password: hashedPassword,
                is_admin: false,
                public: false,
            },
        });


        await prisma.device.update({
            where: {
                id
            },
            data: {
                code,
                username,
                password,
                added_from: session.data.user.id,
                user: {
                    connect: {
                        id: user.id
                    }
                },
            },
        });

        if (!park) {
            await prisma.device.update({
                where: {
                    id
                },
                data: {
                    park: {
                        disconnect: true
                    },
                },
            })
        } else {
            await prisma.device.update({
                where: {
                    id
                },
                data: {
                    park: {
                        connect: {
                            id: park
                        }
                    },
                },
            })
        }

        return { status: 200, data: { message: s("updatesuccess") } };
    } catch (error) {
        console.error("An error occurred in UpdatePark");
        return { status: 500, data: { message: e("error") } };
    }
}
