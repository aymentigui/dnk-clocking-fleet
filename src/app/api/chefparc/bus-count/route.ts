// Get all vehicles with clockings in supervisor's regions (with filters)
import {
  verifySession,
  withAuthorizationPermission,
} from "@/actions/permissions";
import { withAuth } from "@/actions/util/with-auth";
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
    const park_id = searchParams.get("park_id");

    // Get vehicles
    const total = await prisma.vehicle.count({
      where: park_id
        ? {
            park_id: park_id,
          }
        : {},
    });

    return NextResponse.json(
      {
        data: total,
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
