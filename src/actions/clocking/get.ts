"use server";

import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { withAuthorizationPermission, verifySession } from "../permissions";
import { endOfDay, startOfDay } from "date-fns";

export async function getClockings(
  page: number,
  pageSize: number,
  searchDate?: string,
  park?: String,
  type?: number,
  status?: number,
): Promise<{
  status: number;
  data: any;
  count: number;
  countExit: number;
  total_clockings: number;
  totalScannBusHaveExistedParkAndNotEntredRegion: number;
  uniqueVehicles: number;
  uniqueConducteurs: number;
  scannBusHaveExistedParkAndNotEntredRegion: any[];
}> {
  const e = await getTranslations("Error");
  try {
    const session = await verifySession();
    if (!session?.data?.user) {
      return {
        status: 401,
        data: { message: e("unauthorized") },
        count: 0,
        countExit: 0,
        total_clockings: 0,
        totalScannBusHaveExistedParkAndNotEntredRegion: 0,
        uniqueVehicles: 0,
        uniqueConducteurs: 0,
        scannBusHaveExistedParkAndNotEntredRegion: [],
      };
    }
    const hasPermission = await withAuthorizationPermission(
      ["clocking_view"],
      session.data.user.id,
    );

    if (hasPermission.status != 200 || !hasPermission.data.hasPermission) {
      return {
        status: 403,
        data: { message: e("forbidden") },
        count: 0,
        countExit: 0,
        total_clockings: 0,
        totalScannBusHaveExistedParkAndNotEntredRegion: 0,
        uniqueVehicles: 0,
        uniqueConducteurs: 0,
        scannBusHaveExistedParkAndNotEntredRegion: [],
      };
    }

    // Build where condition for date filter
    const whereCondition: any = {};

    if (searchDate) {
      const start = new Date(searchDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(searchDate);
      end.setHours(23, 59, 59, 999);

      whereCondition.created_at = {
        gte: start,
        lte: end,
      };
    }

    if (park && park !== "all" && park !== "") {
      whereCondition.park_id = park;
    }

    if (type === 1 || type === 0 || type === 3 || type === 4) {
      whereCondition.type = type;
    }

    if (status === 1 || status === 0) {
      whereCondition.status = status;
    }

    // Get clockings with pagination
    const [clockings, totalCount] = await Promise.all([
      prisma.clocking.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: {
          created_at: "desc",
        },
        where: whereCondition,
        include: {
          park: {
            select: { name: true },
          },
          region: {
            select: { name: true },
          },
          conducteur: {
            select: {
              id: true,
              firstname: true,
              lastname: true,
              matricule: true,
            },
          },
          vehicle: {
            select: {
              matricule: true,
            },
          },
          device: {
            select: {
              code: true,
              type: true,
              park: {
                select: { name: true },
              },
            },
          },
        },
      }),
      prisma.clocking.count({
        where: whereCondition,
      }),
    ]);

    // Format clockings data
    const clockingFormatted = clockings.map((clocking) => {
      const date = new Date(clocking.created_at);
      const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;

      // Determine location based on device type
      let location = "";
      if (clocking.type !== 3 && clocking.type !== 4 && clocking.park) {
        location = clocking.park.name;
      } else if (clocking.region) {
        location = clocking.region.name;
      }

      return {
        id: clocking.id,
        created_at: formattedDate,
        vehicle: clocking.vehicle.matricule,
        device: clocking.device,
        deviceType: clocking.device.type,
        type: clocking.type,
        conducteur: clocking.conducteur,
        status: clocking.status,
        park: location,
        conducteur_name: clocking.conducteur_name,
        conducteur_id: clocking.conducteur_id,
        vehicle_id: clocking.vehicle_id,
      };
    });

    let countExit = 0;
    let total_clockings = 0;
    let totalScannBusHaveExistedParkAndNotEntredRegion = 0;
    let uniqueConducteurs = 0;
    let uniqueVehiclesCount = 0;
    let scannBusHaveExistedParkAndNotEntredRegion: any[] = [];

    try {
      // const whereCondition1 = { ...whereCondition };
      const uniqueVehicles = await prisma.clocking.findMany({
        where: whereCondition, // ⚠️ remplace si le champ a un autre nom
        select: { vehicle_id: true, type: true },
      });
      countExit = new Set(
        uniqueVehicles.filter((v) => v.type === 0).map((v) => v.vehicle_id),
      ).size;
      uniqueVehiclesCount = new Set(uniqueVehicles.map((v) => v.vehicle_id))
        .size;

      total_clockings = await prisma.clocking.count({
        where: whereCondition,
      });

      // Count vehicles that have exited park but not entered region
      const whereCondition2 = { ...whereCondition };
      whereCondition2.type = 0;
      const exitedVehicles = await prisma.clocking.findMany({
        where: whereCondition2,
        distinct: ["vehicle_id"],
        select: { vehicle_id: true },
      });
      const exitedVehicleIds = exitedVehicles.map((v) => v.vehicle_id);
      const enteredOrExistVehiclesFromRegion = await prisma.clocking.findMany({
        where: {
          created_at: whereCondition.created_at,
          OR: [{ type: 4 }, { type: 3 }],
          vehicle_id: { in: exitedVehicleIds },
        },
        distinct: ["vehicle_id"],
        select: { vehicle_id: true },
      });
      const enteredVehicleIds = new Set(
        enteredOrExistVehiclesFromRegion.map((v) => v.vehicle_id),
      );
      const vehiclesWithoutRegion = await prisma.clocking.findMany({
        where: {
          ...whereCondition,
          type: 0,
          vehicle_id: {
            in: exitedVehicleIds.filter((id) => !enteredVehicleIds.has(id)),
          },
        },
        distinct: ["vehicle_id"],
        include: {
          vehicle: {
            select: { matricule: true },
          },
          park: {
            select: { name: true },
          },
          conducteur: {
            select: {
              firstname: true,
              lastname: true,
              matricule: true,
            },
          },
        },
        orderBy: {
          created_at: "desc",
        },
      });
      scannBusHaveExistedParkAndNotEntredRegion = vehiclesWithoutRegion.map(
        (clocking) => ({
          id: clocking.id,
          vehicle_id: clocking.vehicle_id,
          vehicle_matricule: clocking.vehicle.matricule,
          exit_time: new Date(clocking.created_at).toLocaleString("fr-FR"),
          exit_park: clocking.park?.name || "Inconnu",
          conducteur_name: clocking.conducteur
            ? `${clocking.conducteur.firstname} ${clocking.conducteur.lastname}`.trim()
            : undefined,
          conducteur_matricule: clocking.conducteur?.matricule,
          conducteur_id: clocking.conducteur_id,
        }),
      );

      totalScannBusHaveExistedParkAndNotEntredRegion =
        scannBusHaveExistedParkAndNotEntredRegion.length;

      // Count unique conducteurs (all types)
      const uniqueConducteursResult = await prisma.clocking.findMany({
        where: {
          ...whereCondition,
          conducteur_id: { not: null }, // Exclude null conducteur_id
        },
        distinct: ["conducteur_id"],
        select: { conducteur_id: true },
      });
      uniqueConducteurs = uniqueConducteursResult.length;
    } catch (error) {
      console.error("An error occurred while counting unique vehicles:", error);
    }

    return {
      status: 200,
      data: clockingFormatted,
      count: totalCount,
      countExit,
      total_clockings,
      totalScannBusHaveExistedParkAndNotEntredRegion,
      uniqueVehicles: uniqueVehiclesCount,
      uniqueConducteurs,
      scannBusHaveExistedParkAndNotEntredRegion:
        scannBusHaveExistedParkAndNotEntredRegion,
    };
  } catch (error) {
    console.error("An error occurred in getClockings:", error);
    return {
      status: 500,
      data: { message: e("error") },
      count: 0,
      countExit: 0,
      total_clockings: 0,
      totalScannBusHaveExistedParkAndNotEntredRegion: 0,
      uniqueVehicles: 0,
      uniqueConducteurs: 0,
      scannBusHaveExistedParkAndNotEntredRegion: [],
    };
  }
}

export async function getClockingsVehicleNow(
  vehicle_id?: string,
  park?: string,
  region?: string,
  date?: string,
): Promise<{ status: number; data: any }> {
  try {
    const e = await getTranslations("Error");

    const session = await verifySession();
    if (!session?.data?.user) {
      return { status: 401, data: { message: e("unauthorized") } };
    }
    const hasPermission = await withAuthorizationPermission(
      ["clocking_view"],
      session.data.user.id,
    );

    if (hasPermission.status != 200 || !hasPermission.data.hasPermission) {
      return { status: 403, data: { message: e("forbidden") } };
    }

    const conditions: any = {};

    if (vehicle_id && vehicle_id !== "") {
      conditions.vehicle_id = vehicle_id;
    }

    if (park && park !== "all" && park !== "") {
      conditions.park_id = park;
    }
    if (region && region !== "all" && region !== "") {
      conditions.region_id = region;
    }
    if (date && date !== "") {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);

      const end = new Date(date);
      end.setHours(23, 59, 59, 999);

      conditions.created_at = {
        gte: start,
        lte: end,
      };
    } else {
      conditions.created_at = {
        gte: new Date(new Date().setHours(0, 0, 0, 0)),
        lt: new Date(new Date().setHours(23, 59, 59, 999)),
      };
    }

    let countClockings = 0;
    let countExitParcClockings = 0;
    let countExitParcClockings2 = 0;
    let countEnterParcClockings = 0;
    let countEnterRegionClockings = 0;
    let countExitRegionClockings = 0;
    let countVehicleWithoutEnteringRegion = 0;
    let countVehicles = 0;

    const clockings = await prisma.clocking.findMany({
      where: {
        ...conditions,
      },
      orderBy: {
        created_at: "asc",
      },
      include: {
        vehicle: true,
        conducteur: true,
      },
    });

    countClockings = clockings.length;

    // Filtrer pour garder uniquement le premier clocking de chaque véhicule
    const firstClockingsByVehicle = new Map();

    clockings.forEach((clocking) => {
      if (!firstClockingsByVehicle.has(clocking.vehicle_id)) {
        firstClockingsByVehicle.set(clocking.vehicle_id, clocking);
      }
    });

    // Filtrer ceux où park_id est null
    const result = Array.from(firstClockingsByVehicle.values()).filter(
      (clocking) => clocking.park_id === null,
    );

    countExitParcClockings2 = new Set(
      clockings.filter((c) => c.type === 0).map((c) => c.vehicle_id),
    ).size;
    countEnterParcClockings = new Set(
      clockings.filter((c) => c.type === 1).map((c) => c.vehicle_id),
    ).size;
    countEnterRegionClockings = new Set(
      clockings.filter((c) => c.type === 3).map((c) => c.vehicle_id),
    ).size;
    countExitRegionClockings = new Set(
      clockings.filter((c) => c.type === 4).map((c) => c.vehicle_id),
    ).size;
    countExitParcClockings = countExitParcClockings2 + result.length;

    const exitedVehicles = await prisma.clocking.findMany({
      where: {
        created_at: {
          gte: date
            ? new Date(new Date(date).setHours(0, 0, 0, 0))
            : new Date(new Date().setHours(0, 0, 0, 0)),
          lt: date
            ? new Date(new Date(date).setHours(23, 59, 59, 999))
            : new Date(new Date().setHours(23, 59, 59, 999)),
        },
        ...(conditions.park_id ? { park_id: conditions.park_id } : {}),
        ...(conditions.region_id ? { region_id: conditions.region_id } : {}),
        type: 0,
      },
      distinct: ["vehicle_id"],
      select: { vehicle_id: true },
    });

    const exitedVehicleIds = exitedVehicles.map((v) => v.vehicle_id);
    const enteredOrExistVehiclesFromRegion = await prisma.clocking.findMany({
      where: {
        created_at: {
          gte: date
            ? new Date(new Date(date).setHours(0, 0, 0, 0))
            : new Date(new Date().setHours(0, 0, 0, 0)),
          lt: date
            ? new Date(new Date(date).setHours(23, 59, 59, 999))
            : new Date(new Date().setHours(23, 59, 59, 999)),
        },
        OR: [{ type: 4 }, { type: 3 }],
        // ...conditions.park_id ? { park_id: conditions.park_id } : {},
        // ...conditions.region_id ? { region_id: conditions.region_id } : {},
        vehicle_id: { in: exitedVehicleIds },
      },
      distinct: ["vehicle_id"],
      select: { vehicle_id: true },
    });
    const enteredOrExitVehicleFromRegionIds = new Set(
      enteredOrExistVehiclesFromRegion.map((v) => v.vehicle_id),
    );
    const vehicleWithoutEnteringRegion = exitedVehicleIds.filter(
      (id) => !enteredOrExitVehicleFromRegionIds.has(id),
    );
    countVehicleWithoutEnteringRegion = vehicleWithoutEnteringRegion.length;

    countVehicles = await prisma.vehicle.count({
      where: {
        ...(conditions.park_id ? { park_id: conditions.park_id } : {}),
        ...(conditions.region_id ? { region_id: conditions.region_id } : {}),
        ...(conditions.region_id ? { region_id2: conditions.region_id } : {}),
      },
    });

    return {
      status: 200,
      data: {
        clocking: null,
        countClockings,
        countExitParcClockings,
        countExitParcClockings2,
        countEnterParcClockings,
        countEnterRegionClockings,
        countExitRegionClockings,
        countVehicleWithoutEnteringRegion,
        countVehicles,
        vehicleWithoutEnteringRegion,
      },
    };
  } catch (error) {
    const e = await getTranslations("Error");
    return { status: 500, data: { message: e("error") } };
  }
}

/**
 * Get region statistics for clockings
 * @param date - The date to filter clockings (default: today)
 * @returns Array of regions with their clocking statistics
 */
export async function getRegionStatistics(date?: Date) {
  try {
    const targetDate = date || new Date();
    const startDate = startOfDay(targetDate);
    const endDate = endOfDay(targetDate);

    const regions = await prisma.region.findMany({
      where: {
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

    return { success: true, data: statistics };
  } catch (error) {
    console.error("Error fetching region statistics:", error);
    return { success: false, error: "Failed to fetch region statistics" };
  }
}

/**
 * Get detailed clockings for a specific region
 * @param regionId - The region ID
 * @param date - The date to filter clockings (default: today)
 * @returns Array of clockings for the region
 */
export async function getRegionClockings(regionId: string, date?: Date) {
  try {
    const targetDate = date || new Date();
    const startDate = startOfDay(targetDate);
    const endDate = endOfDay(targetDate);

    const clockings = await prisma.clocking.findMany({
      where: {
        regionId: regionId,
        created_at: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        vehicle: true,
        conducteur: true,
        device: true,
        park: true,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    return { success: true, data: clockings };
  } catch (error) {
    console.error("Error fetching region clockings:", error);
    return { success: false, error: "Failed to fetch region clockings" };
  }
}

/**
 * Get vehicles with exit or entry clockings that exceed 1 hour since last clocking
 * @param date - The date to filter clockings (default: today)
 * @param thresholdHours - Hours threshold (default: 1)
 * @returns Array of vehicles with their last clocking info
 */
export async function getVehiclesExceedingThreshold(
  date?: Date,
  thresholdHours: number = 1,
) {
  try {
    const targetDate = date || new Date();
    const startDate = startOfDay(targetDate);
    const endDate = endOfDay(targetDate);
    const now = new Date();

    // Get all exit (type 3) and entry (type 4) clockings for today
    const clockings = await prisma.clocking.findMany({
      where: {
        created_at: {
          gte: startDate,
          lte: endDate,
        },
        OR: [{ type: 3 }, { type: 4 }],
      },
      include: {
        vehicle: {
          include: {
            region: true,
            park: true,
          },
        },
        conducteur: true,
        device: true,
        park: true,
        region: true,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    // Group by vehicle and get the latest clocking
    const vehicleMap = new Map();

    clockings.forEach((clocking) => {
      const vehicleId = clocking.vehicle_id;

      if (!vehicleMap.has(vehicleId)) {
        vehicleMap.set(vehicleId, clocking);
      }
    });

    // Filter vehicles that exceed threshold
    const thresholdMs = thresholdHours * 60 * 60 * 1000;
    const results = Array.from(vehicleMap.values())
      .filter((clocking) => {
        const timeDiff =
          now.getTime() - new Date(clocking.created_at).getTime();
        return timeDiff > thresholdMs;
      })
      .map((clocking) => {
        const timeDiff =
          now.getTime() - new Date(clocking.created_at).getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);

        return {
          id: clocking.id,
          vehicle: clocking.vehicle,
          conducteur: clocking.conducteur,
          device: clocking.device,
          park: clocking.park,
          region: clocking.region,
          type: clocking.type,
          typeName: clocking.type === 3 ? "Exit" : "Entry",
          created_at: clocking.created_at,
          hoursSince: parseFloat(hoursDiff.toFixed(2)),
          conducteur_name: clocking.conducteur_name,
          conducteur_matricule: clocking.conducteur_matricule,
        };
      })
      .sort((a, b) => {
        // Sort by oldest first
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });

    return { success: true, data: results };
  } catch (error) {
    console.error("Error fetching vehicles exceeding threshold:", error);
    return { success: false, error: "Failed to fetch vehicles" };
  }
}

export async function getClockingsChefParc(
  page: number,
  pageSize: number,
  searchDate?: string,
  type?: number,
  status?: number,
): Promise<{
  status: number;
  data: {
    clockingFormatted: any;
    message?: string;
    count: number;
    countExit: number;
    total_clockings: number;
    totalScannBusHaveExistedParkAndNotEntredRegion: number;
    uniqueVehicles: number;
    uniqueConducteurs: number;
    scannBusHaveExistedParkAndNotEntredRegion: any[];
  };
}> {
  const e = await getTranslations("Error");
  try {
    const session = await verifySession();
    if (!session?.data?.user) {
      return {
        status: 401,
        data: {
          message: e("unauthorized"),
          clockingFormatted: [],
          count: 0,
          countExit: 0,
          total_clockings: 0,
          totalScannBusHaveExistedParkAndNotEntredRegion: 0,
          uniqueVehicles: 0,
          uniqueConducteurs: 0,
          scannBusHaveExistedParkAndNotEntredRegion: [],
        },
      };
    }

    const device = await prisma.device.findFirst({
      where: {
        user_id: session.data.user.id,
      },
    });

    if (!device || device.type !== 2) {
      return {
        status: 401,
        data: {
          message: e("unauthorized"),
          clockingFormatted: [],
          count: 0,
          countExit: 0,
          total_clockings: 0,
          totalScannBusHaveExistedParkAndNotEntredRegion: 0,
          uniqueVehicles: 0,
          uniqueConducteurs: 0,
          scannBusHaveExistedParkAndNotEntredRegion: [],
        },
      };
    }

    // Build where condition for date filter
    const whereCondition: any = {};

    if (searchDate) {
      const start = new Date(searchDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(searchDate);
      end.setHours(23, 59, 59, 999);

      whereCondition.created_at = {
        gte: start,
        lte: end,
      };
    }

    whereCondition.park_id = device.park_id;

    if (type === 1 || type === 0 || type === 2 || type === 3) {
      whereCondition.type = type;
    }

    if (status === 1 || status === 0) {
      whereCondition.status = status;
    }

    // Get clockings with pagination
    const [clockings, totalCount] = await Promise.all([
      prisma.clocking.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: {
          created_at: "desc",
        },
        where: whereCondition,
        include: {
          park: {
            select: { name: true },
          },
          region: {
            select: { name: true },
          },
          conducteur: {
            select: {
              id: true,
              firstname: true,
              lastname: true,
              matricule: true,
            },
          },
          vehicle: {
            select: {
              matricule: true,
            },
          },
          device: {
            select: {
              code: true,
              type: true,
              park: {
                select: { name: true },
              },
            },
          },
        },
      }),
      prisma.clocking.count({
        where: whereCondition,
      }),
    ]);

    // Format clockings data
    const clockingFormatted = clockings.map((clocking) => {
      const date = new Date(clocking.created_at);
      const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;

      // Determine location based on device type
      let location = "";
      if (clocking.type !== 3 && clocking.type !== 4 && clocking.park) {
        location = clocking.park.name;
      } else if (clocking.region) {
        location = clocking.region.name;
      }

      return {
        id: clocking.id,
        created_at: formattedDate,
        vehicle: clocking.vehicle.matricule,
        device: clocking.device,
        deviceType: clocking.device.type,
        type: clocking.type,
        conducteur: clocking.conducteur,
        status: clocking.status,
        park: location,
        conducteur_name: clocking.conducteur_name,
        conducteur_id: clocking.conducteur_id,
        vehicle_id: clocking.vehicle_id,
      };
    });

    let countExit = 0;
    let total_clockings = 0;
    let totalScannBusHaveExistedParkAndNotEntredRegion = 0;
    let uniqueConducteurs = 0;
    let uniqueVehiclesCount = 0;
    let scannBusHaveExistedParkAndNotEntredRegion: any[] = [];

    try {
      // const whereCondition1 = { ...whereCondition };
      const uniqueVehicles = await prisma.clocking.findMany({
        where: whereCondition, // ⚠️ remplace si le champ a un autre nom
        select: { vehicle_id: true, type: true },
      });
      countExit = new Set(
        uniqueVehicles.filter((v) => v.type === 0).map((v) => v.vehicle_id),
      ).size;
      uniqueVehiclesCount = new Set(uniqueVehicles.map((v) => v.vehicle_id))
        .size;

      total_clockings = await prisma.clocking.count({
        where: whereCondition,
      });

      // Count vehicles that have exited park but not entered region
      const whereCondition2 = { ...whereCondition };
      whereCondition2.type = 0;
      const exitedVehicles = await prisma.clocking.findMany({
        where: whereCondition2,
        distinct: ["vehicle_id"],
        select: { vehicle_id: true },
      });
      const exitedVehicleIds = exitedVehicles.map((v) => v.vehicle_id);
      const enteredOrExistVehiclesFromRegion = await prisma.clocking.findMany({
        where: {
          created_at: whereCondition.created_at,
          OR: [{ type: 4 }, { type: 3 }],
          vehicle_id: { in: exitedVehicleIds },
        },
        distinct: ["vehicle_id"],
        select: { vehicle_id: true },
      });
      const enteredVehicleIds = new Set(
        enteredOrExistVehiclesFromRegion.map((v) => v.vehicle_id),
      );
      const vehiclesWithoutRegion = await prisma.clocking.findMany({
        where: {
          ...whereCondition,
          type: 0,
          vehicle_id: {
            in: exitedVehicleIds.filter((id) => !enteredVehicleIds.has(id)),
          },
        },
        distinct: ["vehicle_id"],
        include: {
          vehicle: {
            select: { matricule: true },
          },
          park: {
            select: { name: true },
          },
          conducteur: {
            select: {
              firstname: true,
              lastname: true,
              matricule: true,
            },
          },
        },
        orderBy: {
          created_at: "desc",
        },
      });
      scannBusHaveExistedParkAndNotEntredRegion = vehiclesWithoutRegion.map(
        (clocking) => ({
          id: clocking.id,
          vehicle_id: clocking.vehicle_id,
          vehicle_matricule: clocking.vehicle.matricule,
          exit_time: new Date(clocking.created_at).toLocaleString("fr-FR"),
          exit_park: clocking.park?.name || "Inconnu",
          conducteur_name: clocking.conducteur
            ? `${clocking.conducteur.firstname} ${clocking.conducteur.lastname}`.trim()
            : undefined,
          conducteur_matricule: clocking.conducteur?.matricule,
          conducteur_id: clocking.conducteur_id,
        }),
      );

      totalScannBusHaveExistedParkAndNotEntredRegion =
        scannBusHaveExistedParkAndNotEntredRegion.length;

      // Count unique conducteurs (all types)
      const uniqueConducteursResult = await prisma.clocking.findMany({
        where: {
          ...whereCondition,
          conducteur_id: { not: null }, // Exclude null conducteur_id
        },
        distinct: ["conducteur_id"],
        select: { conducteur_id: true },
      });
      uniqueConducteurs = uniqueConducteursResult.length;
    } catch (error) {
      console.error("An error occurred while counting unique vehicles:", error);
    }

    return {
      status: 200,
      data: {
        clockingFormatted,
        count: totalCount,
        countExit,
        total_clockings,
        totalScannBusHaveExistedParkAndNotEntredRegion,
        uniqueVehicles: uniqueVehiclesCount,
        uniqueConducteurs,
        scannBusHaveExistedParkAndNotEntredRegion:
          scannBusHaveExistedParkAndNotEntredRegion,
      },
    };
  } catch (error) {
    console.error("An error occurred in getClockings:", error);
    return {
      status: 500,
      data: {
        message: e("error"),
        clockingFormatted: [],
        count: 0,
        countExit: 0,
        total_clockings: 0,
        totalScannBusHaveExistedParkAndNotEntredRegion: 0,
        uniqueVehicles: 0,
        uniqueConducteurs: 0,
        scannBusHaveExistedParkAndNotEntredRegion: [],
      },
    };
  }
}
