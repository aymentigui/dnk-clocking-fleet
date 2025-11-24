// Get all regions for current supervisor
import { verifySession } from "@/actions/permissions";
import { withAuth } from "@/actions/util/with-auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export const GET = withAuth(async (request, { user }) => {
    try {
        const session = await verifySession()
        if (!session || session.status != 200) {
            return NextResponse.json(
                { message: "Failed to fetch vehicles auth" },
                { status: 500 }
            );
        }
        // Get supervisor's device with all_region
        const device = await prisma.device.findFirst({
            where: { user_id: session.data.user.id },
        });

        if (!device || !device.all_region) {
            return NextResponse.json(
                { message: "No regions found for this supervisor" },
                { status: 404 }
            );
        }

        // Parse region IDs from comma-separated string
        const regionIds = device.all_region.split(",").map((id) => id.trim());

        // Fetch regions data
        const regions = await prisma.region.findMany({
            where: {
                id: { in: regionIds },
                deleted_at: null,
            },
            select: {
                id: true,
                name: true,
                description: true,
                address: true,
            },
        });

        return NextResponse.json({ data: regions }, { status: 200 });
    } catch (error) {
        console.error("Error fetching regions:", error);
        return NextResponse.json(
            { message: "Failed to fetch regions" },
            { status: 500 }
        );
    }
});
