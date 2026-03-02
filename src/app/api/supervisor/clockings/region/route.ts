// Get clockings for specific region with pagination
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
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "10", 10);

        if (!regionId) {
            return NextResponse.json(
                { message: "Region ID is required" },
                { status: 400 }
            );
        }

        // Parse date to get start and end of day
        const startOfDay = new Date(`${date}T00:00:00`);
        const endOfDay = new Date(`${date}T23:59:59`);

        const skip = (page - 1) * limit;

        // Get clockings for region with pagination
        const clockings = await prisma.clocking.findMany({
            where: {
                regionId: regionId,
                created_at: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
            include: {
                vehicle: {
                    select: {
                        id: true,
                        matricule: true,
                        model: true,
                    },
                },
                region:{
                    select:{
                        id: true,
                        name:true
                    }
                },
                conducteur: {
                    select: {
                        id: true,
                        firstname: true,
                        lastname: true,
                        matricule: true,
                    },
                },
                device: {
                    select: {
                        code: true,
                    },
                },
            },
            orderBy: {
                created_at: "desc",
            },
            skip,
            take: limit,
        });

        const totalCount = await prisma.clocking.count({
            where: {
                regionId: regionId,
                created_at: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
        });

        const totalPages = Math.ceil(totalCount / limit);

        return NextResponse.json(
            {
                data: clockings,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalCount,
                    limit,
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error fetching clockings:", error);
        return NextResponse.json(
            { message: "Failed to fetch clockings" },
            { status: 500 }
        );
    }
});
