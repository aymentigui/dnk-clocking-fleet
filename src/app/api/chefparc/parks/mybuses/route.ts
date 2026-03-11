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
    const vehicles = await prisma.vehicle.findMany({
      where: {
        park_id: park_id,
      },
      select: {
        id: true,
        matricule: true,
        brand: true,
        model: true,
        year: true,
        status: true,
        last_region: true,
      },
      orderBy: {
        created_at: "desc",
      },
      distinct: ["id"],
    });

    const filtredVehicles = await Promise.all(
      vehicles.map(async (vehicle) => {
        let status = "في الحظيرة";
        if (vehicle.status === "exit_from_park") {
          status = "خرجت من الحظيرة";
        } else if (vehicle.status === "entry_to_park") {
          status = "دخلت الحظيرة";
        } else if (vehicle.status === "maintenance") {
          status = "في الصيانة";
        } else if (vehicle.status === "entry_to_region") {
          status = "دخلت المنطقة";
        } else if (vehicle.status === "exit_from_region") {
          status = "خرجت من المنطقة";
        }

        const region = vehicle.last_region
          ? await prisma.region.findFirst({
              where: { id: vehicle.last_region },
            })
          : null;

        return {
          id: vehicle.id,
          matricule: vehicle.matricule,
          brand: vehicle.brand,
          year: vehicle.year,
          model: vehicle.model,
          status: status,
          last_region: region?.name,
        };
      }),
    );

    return NextResponse.json(
      {
        data: filtredVehicles,
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
