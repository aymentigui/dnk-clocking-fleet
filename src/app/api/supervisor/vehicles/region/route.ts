// Get vehicles with clockings in a region (today or specific date)
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

        // Get vehicles with clockings in this region for today
        const vehicles = await prisma.vehicle.findMany({
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
                brand: true,
                model: true,
                status: true,
                last_region: true,
                clocking: {
                    where: {
                        regionId: regionId,
                        created_at: {
                            gte: startOfDay,
                            lte: endOfDay,
                        },
                    },
                    select: {
                        id: true,
                        type: true,
                        created_at: true,
                    },
                    orderBy: {
                        created_at: "desc",
                    },
                    take: 1,
                },
            },
            distinct: ["id"],
        });

        // Enrich with region name
        const regionName = await prisma.region.findUnique({
            where: { id: regionId },
            select: { name: true },
        });

        const enrichedVehicles = await Promise.all(
            vehicles.map(async (v) => {
                let regionName2 = null;

                if (v.last_region) {
                    const region = await prisma.region.findUnique({
                        where: { id: v.last_region },
                        select: { name: true }, // On ne récupère que le nom
                    });
                    regionName2 = region?.name ?? null;
                }

                return {
                    ...v,
                    last_region_name: regionName2,
                };
            })
        );

        return NextResponse.json(
            { data: enrichedVehicles, regionName },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error fetching vehicles:", error);
        return NextResponse.json(
            { message: "Failed to fetch vehicles" },
            { status: 500 }
        );
    }
});
