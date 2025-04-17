"use server"
import { prisma } from "@/lib/db";
import { getTranslations } from "next-intl/server";
import { withAuthorizationPermission, verifySession } from "../permissions";
import { z } from "zod";

export async function createPark(data: any) {
    const u = await getTranslations("Park");
    const s = await getTranslations("System");
    const e = await getTranslations('Error');

    const schema = z.object({
        name: z.string().min(1, u("namerequired")),
        description: z.string().optional(),
        address: z.string().optional(),
    });
    try {
        const session = await verifySession()
        if (!session || session.status != 200) {
            return { status: 401, data: { message: e('unauthorized') } }
        }
        const hasPermissionAdd = await withAuthorizationPermission(['park_create']);

        if (hasPermissionAdd.status != 200 || !hasPermissionAdd.data.hasPermission) {
            return { status: 403, data: { message: e('forbidden') } };
        }
        const result = schema.safeParse(data);

        if (!result.success) {
            console.log(result.error.errors);
            return { status: 400, data: { errors: result.error.errors } };
        }
        const { name, description, address } = result.data;

        const nameExists = await prisma.park.findUnique({ where: { name } });
        if (nameExists) {
            return { status: 400, data: { message: u("nameexists") } };
        }

        await prisma.park.create({
            data: {
                name,
                description,
                address,
                added_from: session.data.user.id,
            },
        });

        return { status: 200, data: { message: s("createsuccess") } };
    } catch (error) {
        console.error("An error occurred in createPark" + error);
        return { status: 500, data: { message: s("createfail") } };
    }
}

export async function createParks(data: any) {
    const u = await getTranslations("Park");
    const s = await getTranslations("System");
    const e = await getTranslations('Error');

    const schema = z.object({
        name: z.string().min(1, u("namerequired")),
        description: z.string().optional(),
        address: z.string().optional(),
    });
    try {
        const session = await verifySession()
        if (!session || session.status != 200) {
            return { status: 401, data: { message: e('unauthorized') } }
        }
        const hasPermissionAdd = await withAuthorizationPermission(['park_create']);

        if (hasPermissionAdd.status != 200 || !hasPermissionAdd.data.hasPermission) {
            return { status: 403, data: { message: e('forbidden') } };
        }

        const parks =data.map(async (userData: any) => {
            return await addPark(userData, schema, session, u, s);
        })

        const parksResuls = await Promise.all(parks);

        return { status: 200, data: { message: s("createsuccess") , parks: parksResuls } };
    } catch (error) {
        //@ts-ignore
        console.error("An error occurred in createParks" + error.message);
        return { status: 500, data: { message: s("createfail") } };
    }
}

const addPark = async (data: any, userSchema: any, session: any, u:any, s:any) => {
    try {

        const result = userSchema.safeParse({
            name: String(data.name),
            description: String(data.description),
            address: String(data.address),
        });
        

        if (!result.success) {
            const message= result.error.errors.map((error: any) => {
                return error.message;
            }).join(', ')
            return { status: 400, data: { message: message , park : data} };
        }
        
        const { name, description, address } = result.data;

        const nameExists = await prisma.park.findUnique({ where: { name } });
        if (nameExists) {
            return { status: 400, data: { message: u("nameexists") , park : data} };
        }

        const park = await prisma.park.create({
            data: {
                name:name.trim(),
                description,
                address,
                added_from: session.data.user.id,
            },
        });

        return { status: 200, data: data };
    } catch (error) {
        // @ts-ignore
        console.error("An error occurred in addPark" + error.message);
        return { status: 500, data: { message: s("createfail") , park : data} }
    };
}