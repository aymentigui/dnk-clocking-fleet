// Get all vehicles with clockings in supervisor's regions (with filters)
import {
  verifySession,
  withAuthorizationPermission,
} from "@/actions/permissions";
import { withAuth } from "@/actions/util/with-auth";
import { getPositionVehicle } from "@/actions/vehicle/get";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export const GET = withAuth(async (request, { user }) => {
  try {
    const session = await verifySession();
    if (session?.status != 200) {
      return NextResponse.json(
        { message: "Failed to fetch vehicles auth" },
        { status: 500 },
      );
    }

    const hasPermissionAdd = await withAuthorizationPermission([
      "vehicles_view",
    ]);

    if (
      hasPermissionAdd.status != 200 ||
      !hasPermissionAdd.data.hasPermission
    ) {
      return NextResponse.json(
        { message: "No regions found for this supervisor" },
        { status: 404 },
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const date = searchParams.get("date");

    if (!id || !date) {
      return NextResponse.json(
        { message: "Vehicle ID and date are required" },
        { status: 400 },
      );
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
    });

    if (!vehicle) {
      return NextResponse.json(
        { message: "Vehicle not found" },
        { status: 404 },
      );
    }

    const startOfDay = new Date(date);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    startOfDay.setHours(0, 0, 0, 0);

    // Get clockings
    const clockings = await prisma.clocking.findMany({
      where: {
        vehicle_id: vehicle.id,
        created_at: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        region: true,
        park: true,
      },
      orderBy: { created_at: "desc" },
    });

    const filtredClockings = clockings.map((clocking) => {
      return {
        id: clocking.id,
        vehicle_id: clocking.vehicle_id,
        region: clocking.region?.name,
        park: clocking.park?.name,
        status:
          clocking.type === 0
            ? "خرجت من الحظيرة"
            : clocking.type === 1
              ? "دخلت الحظيرة"
              : clocking.type === 3
                ? "خرجت من المنطقة"
                : clocking.type === 4
                  ? "دخلت المنطقة"
                  : clocking.type === 5
                    ? "في الصيانة"
                    : "في الحظيرة",
        conducteur: clocking.conducteur_name,
        created_at: clocking.created_at,
      };
    });

    return NextResponse.json(
      {
        data: filtredClockings,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch vehicles" },
      { status: 500 },
    );
  }
});
