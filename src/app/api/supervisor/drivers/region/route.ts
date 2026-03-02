// Get drivers with clockings in a region
import { verifySession } from "@/actions/permissions";
import { withAuth } from "@/actions/util/with-auth";
import { prisma } from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";

export const GET = withAuth(async (request, { user }) => {
    try {

        const session = await verifySession()
        if (!session || session.status != 200) {
            return NextResponse.json(
                { message: "Not authorized" },
                { status: 401 }
            );
        }

        const device = await prisma.device.findFirst({ where: { user_id: session.data.user.id } })
        if (!device || device.type !== 5) {
            return NextResponse.json(
                { message: "Not authorized" },
                { status: 401 }
            );
        }


        const { searchParams } = new URL(request.url);
        const regionId = searchParams.get("regionId");
        const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

        if (!regionId) {
            return NextResponse.json(
                { message: "Region ID is required" },
                { status: 400 }
            );
        }

        const startOfDay = new Date(`${date}T00:00:00`);
        const endOfDay = new Date(`${date}T23:59:59`);

        // Get drivers with clockings in this region
        const drivers = await prisma.conducteur.findMany({
            where: {
                clocking: {
                    some: {
                        regionId: regionId,
                        created_at: {
                            gte: startOfDay,
                            lte: endOfDay,
                        },
                    },
                },
            },
            select: {
                id: true,
                matricule: true,
                firstname: true,
                lastname: true,
                status: true,
            },
            distinct: ["id"],
        });

        return NextResponse.json({ data: drivers }, { status: 200 });
    } catch (error) {
        console.error("Error fetching drivers:", error);
        return NextResponse.json(
            { message: "Failed to fetch drivers" },
            { status: 500 }
        );
    }
});
