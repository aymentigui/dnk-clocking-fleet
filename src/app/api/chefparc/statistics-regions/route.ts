// Get all regions for current supervisor
import { verifySession } from "@/actions/permissions";
import { withAuth } from "@/actions/util/with-auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export const GET = withAuth(async (request, { user }) => {
  try {
    const session = await verifySession();
    if (session?.status != 200) {
      return NextResponse.json({ message: "Not authorized" }, { status: 401 });
    }

    const regionsRes = await prisma.region.findMany({
      select: {
        id: true,
      },
    });

    // Parse region IDs from comma-separated string
    const regionIds = regionsRes.map((region) => region.id);
    const { searchParams } = new URL(request.url);
    const date =
      searchParams.get("date") || new Date().toISOString().split("T")[0];
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    // Fetch regions data
    const regions = await prisma.region.findMany({
      where: {
        id: { in: regionIds },
        deleted_at: null,
      },
      include: {
        clocking: {
          where: {
            created_at: {
              gte: startDate,
              lte: endDate,
            },
          },
          include: {
            vehicle: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const statistics = regions.map((region) => {
      const clockings = region.clocking;

      // Total clockings
      const totalClockings = clockings.length;

      // Clockings by type
      const exitClockings = clockings.filter((c) => c.type === 3).length;
      const entryClockings = clockings.filter((c) => c.type === 4).length;

      // Unique vehicles
      const exitVehicles = new Set(
        clockings.filter((c) => c.type === 3).map((c) => c.vehicle_id),
      );
      const entryVehicles = new Set(
        clockings.filter((c) => c.type === 4).map((c) => c.vehicle_id),
      );
      const allVehicles = new Set(clockings.map((c) => c.vehicle_id));

      return {
        id: region.id,
        name: region.name,
        description: region.description,
        address: region.address,
        totalClockings,
        exitClockings,
        entryClockings,
        uniqueExitVehicles: exitVehicles.size,
        uniqueEntryVehicles: entryVehicles.size,
        uniqueTotalVehicles: allVehicles.size,
        nbrVehicles: region.nbr_buses ?? 0,
      };
    });

    return NextResponse.json({ data: statistics }, { status: 200 });
  } catch (error) {
    console.error("Error fetching regions:", error);
    return NextResponse.json(
      { message: "Failed to fetch regions" },
      { status: 500 },
    );
  }
});
