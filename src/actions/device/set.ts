"use server"
import { prisma } from "@/lib/db";
import { getTranslations } from "next-intl/server";
import { withAuthorizationPermission, verifySession } from "../permissions";
import { z } from "zod";
import bcrypt from "bcrypt";

export async function createDevice(data: any) {
    const u = await getTranslations("Device");
    const s = await getTranslations("System");
    const e = await getTranslations('Error');

    const schema = z.object({
        code: z.string().min(1, u("coderequired")),
        username: z.string().min(1, u("usernamerequired")).refine(username => !username.includes(' '), {
            message: u("usernamecontainspace")
        }),
        password: z.string().min(6, u("password6")),
        park: z.string().optional(),
        type: z.number().optional(),
    });

    try {
        const session = await verifySession()
        if (!session || session.status != 200) {
            return { status: 401, data: { message: e('unauthorized') } }
        }
        const hasPermissionAdd = await withAuthorizationPermission(['devices_create']);

        if (hasPermissionAdd.status != 200 || !hasPermissionAdd.data.hasPermission) {
            return { status: 403, data: { message: e('forbidden') } };
        }
        const result = schema.safeParse(data);

        if (!result.success) {
            return { status: 400, data: { errors: result.error.errors } };
        }
        const { code, username, password, park , type} = result.data;

        const codeExists = await prisma.device.findFirst({ where: { code } });
        if (codeExists) {
            return { status: 400, data: { message: u("codeexists") } };
        }

        const usernameExists = await prisma.device.findFirst({ where: { username } });

        if (usernameExists) {
            return { status: 400, data: { message: u("usernameexists") } };
        }

        const usernameExistsUser = await prisma.user.findFirst({ where: { username } });

        if (usernameExistsUser) {
            return { status: 400, data: { message: u("usernameexists") } };
        }

        const emailExists = await prisma.user.findFirst({ where: { email: username + "@email.com" } });

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

        const user = await prisma.user.create({
            data: {
                username: username,
                email: "" + username + "@email.com",
                password: hashedPassword,
                is_admin: false,
                public: false,
            },
        });


        const device = await prisma.device.create({
            data: {
                code,
                username,
                password,
                type: type ? type : 0,
                added_from: session.data.user.id,
                user: {
                    connect: {
                        id: user.id
                    }
                },
            },
        });

        if(park && device){
            await prisma.device.update({
                where: {
                    id: device.id
                },
                data: {
                    park: {
                        connect: {
                            id: park
                        }
                    }
                }
            })
        }

        return { status: 200, data: { message: s("createsuccess") } };
    } catch (error) {
        console.error("An error occurred in createDevice" + error);
        return { status: 500, data: { message: s("createfail") } };
    }
}

export async function createDevices(data: any) {
    const u = await getTranslations("Device");
    const s = await getTranslations("System");
    const e = await getTranslations('Error');

    const schema = z.object({
        code: z.string().min(1, u("coderequired")),
        username: z.string().min(1, u("usernamerequired")).refine(username => !username.includes(' '), {
            message: u("usernamecontainspace")
        }),        password: z.string().min(6, u("password6")),
        park: z.string().optional(),
        type: z.number().optional(),
    });
    try {
        const session = await verifySession()
        if (!session || session.status != 200) {
            return { status: 401, data: { message: e('unauthorized') } }
        }
        const hasPermissionAdd = await withAuthorizationPermission(['devices_create']);

        if (hasPermissionAdd.status != 200 || !hasPermissionAdd.data.hasPermission) {
            return { status: 403, data: { message: e('forbidden') } };
        }

        const devices = data.map(async (userData: any) => {
            return await addDevice(userData, schema, session, u,s);
        })

        const devicesResuls = await Promise.all(devices);

        return { status: 200, data: { message: s("createsuccess"), devices: devicesResuls } };
    } catch (error) {
        //@ts-ignore
        console.error("An error occurred in createDevices" + error.message);
        return { status: 500, data: { message: s("createfail") } };
    }
}

const addDevice = async (data: any, userSchema: any, session: any, u: any, s:any) => {
    try {

        const result = userSchema.safeParse({
            code: String(data.code),
            username: String(data.username),
            password: String(data.password),
            park: String(data.park),
            type: parseInt(String(data.type)) || 0,
        });


        if (!result.success) {
            const message = result.error.errors.map((error: any) => {
                return error.message;
            }).join(', ')
            return { status: 400, data: { message: message, device: data } };
        }

        const { code, username, password, park, type } = result.data;

        const codeExists = await prisma.device.findFirst({ where: { code } });
        if (codeExists) {
            return { status: 400, data: { device: data, message: u("codeexists") } };
        }

        const usernameExists = await prisma.device.findFirst({ where: { username } });

        if (usernameExists) {
            return { status: 400, data: { device: data, message: u("usernameexists") } };
        }

        const usernameExistsUser = await prisma.user.findFirst({ where: { username } });

        if (usernameExistsUser) {
            return { status: 400, data: { device: data, message: u("usernameexists") } };
        }

        const emailExists = await prisma.user.findFirst({ where: { email: username + "@email.com" } });

        if (emailExists) {
            return { status: 400, data: { device: data, message: u("usernameexists") } };
        }
        console.log("park", park)
        
        if (park && park!=null && park!="null" && park != "" && park.trim() != "") {
            const parkExists = await prisma.park.findFirst({ where: { name: park } });

            if (!parkExists) {
                return { status: 400, data: { device: data, message: u("parknotexist") } };
            }
        }


        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                username: username,
                email: username + '@email.com',
                password: hashedPassword,
                is_admin: false,
                public: false,
            },
        });


        const device = await prisma.device.create({
            data: {
                code,
                username,
                password,
                type,
                added_from: session.data.user.id,
                user: {
                    connect: {
                        id: user.id
                    }
                },
            },
        });
        if(park && device && park.trim() != "" && park!=="null" ){
            await prisma.device.update({
                where: {
                    id: device.id
                },
                data: {
                    park: {
                        connect: {
                            name: park
                        }
                    }
                }
            })
        }


        return { status: 200, data: data };
    } catch (error) {
        // @ts-ignore
        console.error("An error occurred in addPDevice" + error.message);
        return { status: 500, data: { message: s("createfail"), device: data } }
    };
}