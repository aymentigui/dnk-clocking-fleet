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

    if (!park_id) {
      return NextResponse.json(
        { message: "Park ID is required" },
        { status: 400 },
      );
    }

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

    const url = new URL(request.url);
    const date = url.searchParams.get("date");

    const statDate = date ? new Date(date) : new Date();
    const endDate = date ? new Date(date) : new Date();
    endDate.setHours(23, 59, 59, 999);
    statDate.setHours(0, 0, 0, 0);

    const notExitVehiclesResults = await Promise.all(
      vehicles.map(async (vehicle) => {
        const haveClocking = await prisma.clocking.findFirst({
          where: {
            vehicle_id: vehicle.id,
            created_at: {
              gte: statDate,
              lte: endDate,
            },
          },
        });

        return haveClocking ? null : vehicle;
      }),
    );

    let filtredVehicles = notExitVehiclesResults.filter(
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
