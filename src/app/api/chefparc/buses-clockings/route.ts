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
    // Get supervisor's regions
    const device = await prisma.device.findFirst({
      where: { user_id: session.data.user.id },
    });

    const hasPermissionAdd = await withAuthorizationPermission([
      "vehicles_view",
    ]);

    if (
      (!device?.park_id || device.type !== 2) &&
      (hasPermissionAdd.status != 200 || !hasPermissionAdd.data.hasPermission)
    ) {
      return NextResponse.json(
        { message: "No regions found for this supervisor" },
        { status: 404 },
      );
    }

    let whereClause;
    if (device?.park_id) {
      whereClause = {
        park_id: device.park_id,
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
        year: true,
        status: true,
        last_region: true,
      },
      orderBy: {
        created_at: "desc",
      },
      distinct: ["id"],
    });

    const url = new URL(request.url);
    const date = url.searchParams.get("date");
    const type = url.searchParams.get("type");
    const filter = url.searchParams.get("filter");

    const statDate = date ? new Date(date) : new Date();
    const endDate = date ? new Date(date) : new Date();
    endDate.setHours(23, 59, 59, 999);
    statDate.setHours(0, 0, 0, 0);

    const filtredVehiclesResults = await Promise.all(
      vehicles.map(async (vehicle) => {
        const haveClocking = await prisma.clocking.findFirst({
          where: {
            vehicle_id: vehicle.id,
            type: Number(type ?? 0),
            created_at: {
              gte: statDate,
              lte: endDate,
            },
          },
        });

        return haveClocking ? vehicle : null;
      }),
    );

    let filtredVehicles = filtredVehiclesResults.filter(
      (v): v is (typeof vehicles)[number] => v !== null,
    );

    if (filtredVehicles.length === 0) {
      return NextResponse.json(
        {
          data: [],
        },
        { status: 200 },
      );
    }

    if (filter) {
      const newFiltredVehiclesResults = await Promise.all(
        filtredVehicles.map(async (vehicle) => {
          const haveClocking = await prisma.clocking.findMany({
            where: {
              vehicle_id: vehicle.id,
              type: { in: [3, 4] },
              created_at: {
                gte: statDate,
                lte: endDate,
              },
            },
          });

          return haveClocking.length === 0 ? vehicle : null;
        }),
      );

      const newFiltredVehicles = newFiltredVehiclesResults.filter(
        (v): v is (typeof vehicles)[number] => v !== null,
      );

      filtredVehicles = newFiltredVehicles;
    }

    const vehiclesFormatted = filtredVehicles.map((vehicle) => {
      return {
        id: vehicle.id,
        matricule: vehicle.matricule,
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        status: vehicle.status,
        last_region: vehicle.last_region,
      };
    });

    return NextResponse.json(
      {
        data: vehiclesFormatted,
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
