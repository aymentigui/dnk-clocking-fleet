// Get vehicles with clockings in a region (today or specific date)
import { verifySession } from "@/actions/permissions";
import { withAuth } from "@/actions/util/with-auth";
import { getPositionVehicle } from "@/actions/vehicle/get";
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
        const matricule = searchParams.get("matricule");

        if (!matricule) {
            return NextResponse.json(
                { message: "Matricule is required" },
                { status: 400 }
            );
        }

        // Get vehicles with clockings in this region for today
        const vehicle = await prisma.vehicle.findFirst({
            where: {
                matricule
            }
        });

        if(!vehicle) {
            return NextResponse.json(
                { message: "No vehicle found" },
                { status: 404 }
            );
        }

        if(!vehicle.imei){
            return NextResponse.json(
                { message: "Vehicle has no IMEI" },
                { status: 404 }
            );
        }

        const response = await getPositionVehicle(vehicle.id)

        return NextResponse.json(response);
    } catch (error) {
        console.error("Error fetching vehicles:", error);
        return NextResponse.json(
            { message: "Failed to fetch vehicles" },
            { status: 500 }
        );
    }
});
