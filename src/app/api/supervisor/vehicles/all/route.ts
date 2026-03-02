// Get all vehicles with clockings in supervisor's regions (with filters)
import { verifySession } from "@/actions/permissions";
import { withAuth } from "@/actions/util/with-auth";
import { prisma } from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";

export const GET = withAuth(async (request, { user }) => {
    try {
        const session = await verifySession()
        if (!session || session.status != 200) {
            return NextResponse.json(
                { message: "Failed to fetch vehicles auth" },
                { status: 500 }
            );
        }

        const { searchParams } = new URL(request.url);
        const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "10", 10);
        const statusFilter = searchParams.get("status"); // Optional: "entry_to_region", "exit_from_region", etc.
        const regionFilter = searchParams.get("region"); // Optional: region ID
        const matriculeFilter = searchParams.get("matricule"); // Optional: vehicle matricule
        // Get supervisor's regions
        const device = await prisma.device.findFirst({
            where: { user_id: session.data.user.id },
        });

        if (!device || !device.all_region || device.type !== 5) {
            return NextResponse.json(
                { message: "No regions found for this supervisor" },
                { status: 404 }
            );
        }

        const regionIds = device.all_region.split(",").map((id) => id.trim());
        const startOfDay = new Date(`${date}T00:00:00`);
        const endOfDay = new Date(`${date}T23:59:59`);
        const skip = (page - 1) * limit;

        // Build where clause
        let whereClause: any = {
            clocking: {
                some: {
                    regionId: { in: regionIds },
                    created_at: {
                        gte: startOfDay,
                        lte: endOfDay,
                    },
                },
            },
        };

        if (statusFilter) {
            whereClause.status = statusFilter;
        }

        if (matriculeFilter) {
            whereClause.matricule = {
                contains: matriculeFilter,
            };
        }

        // Get vehicles
        const vehicles = await prisma.vehicle.findMany({
            where: whereClause,
            select: {
                id: true,
                matricule: true,
                brand: true,
                model: true,
                status: true,
                last_region: true,
                clocking: {
                    where: {
                        regionId: regionFilter ? regionFilter : { in: regionIds },
                        created_at: {
                            gte: startOfDay,
                            lte: endOfDay,
                        },
                    },
                    select: {
                        id: true,
                        type: true,
                        regionId: true,
                        created_at: true,
                    },
                    orderBy: {
                        created_at: "desc",
                    },
                },
            },
            skip,
            take: limit,
            orderBy: {
                created_at: "desc",
            },
            distinct: ["id"],
        });

        const enrichedVehicles = await Promise.all(
            vehicles.map(async (v) => {
                let regionName = null;

                if (v.last_region) {
                    const region = await prisma.region.findUnique({
                        where: { id: v.last_region },
                        select: { name: true }, // On ne récupère que le nom
                    });
                    regionName = region?.name ?? null;
                }

                return {
                    ...v,
                    last_region_name: regionName,
                };
            })
        );


        const totalCount = await prisma.vehicle.count({
            where: whereClause,
        });

        const totalPages = Math.ceil(totalCount / limit);

        return NextResponse.json(
            {
                data: enrichedVehicles,
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
        return NextResponse.json(
            { message: "Failed to fetch vehicles" },
            { status: 500 }
        );
    }
});