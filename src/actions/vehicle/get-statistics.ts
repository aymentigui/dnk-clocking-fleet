"use server";

import { prisma } from "@/lib/db";
import { startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from "date-fns";

// Types pour les périodes
export type PeriodType = "today" | "3days" | "week" | "month" | "3months" | "year";

// Fonction utilitaire pour obtenir les dates de début et fin selon la période
function getPeriodDates(period: PeriodType): { startDate: Date; endDate: Date } {
  const now = new Date();
  
  switch (period) {
    case "today":
      return { startDate: startOfDay(now), endDate: endOfDay(now) };
    case "3days":
      return { startDate: startOfDay(subDays(now, 2)), endDate: endOfDay(now) };
    case "week":
      return { startDate: startOfWeek(now, { weekStartsOn: 1 }), endDate: endOfWeek(now, { weekStartsOn: 1 }) };
    case "month":
      return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
    case "3months":
      return { startDate: startOfMonth(subMonths(now, 2)), endDate: endOfMonth(now) };
    case "year":
      return { startDate: startOfYear(now), endDate: endOfYear(now) };
    default:
      return { startDate: startOfDay(now), endDate: endOfDay(now) };
  }
}

// ============= PAGE 1: STATISTIQUES GLOBALES =============

export async function getGlobalStatistics(period: PeriodType) {
  try {
    const { startDate, endDate } = getPeriodDates(period);

    // Total des véhicules actifs
    const totalVehicles = await prisma.vehicle.count({
      where: { deleted_at: null }
    });

    // Véhicules qui ont travaillé (fait au moins un clocking)
    const vehiclesWithClocking = await prisma.clocking.findMany({
      where: {
        created_at: { gte: startDate, lte: endDate },
        type: { in: [0, 1, 3, 4] }
      },
      select: { vehicle_id: true },
      distinct: ["vehicle_id"]
    });

    const totalWorkedVehicles = vehiclesWithClocking.length;

    // Véhicules sans clocking
    const vehiclesWithoutClocking = totalVehicles - totalWorkedVehicles;

    // Véhicules avec courses
    const vehiclesWithCourses = await prisma.course.findMany({
      where: {
        start_date: { gte: startDate, lte: endDate }
      },
      select: { vehicle_id: true },
      distinct: ["vehicle_id"]
    });

    const totalVehiclesWithCourses = vehiclesWithCourses.length;

    // Véhicules sans courses
    const vehiclesWithoutCourses = totalVehicles - totalVehiclesWithCourses;

    // Total des clockings par type
    const clockingsByType = await prisma.clocking.groupBy({
      by: ["type"],
      where: {
        created_at: { gte: startDate, lte: endDate }
      },
      _count: { id: true }
    });

    // Total des courses
    const totalCourses = await prisma.course.count({
      where: {
        start_date: { gte: startDate, lte: endDate }
      }
    });

    // Courses complètes
    const completedCourses = await prisma.course.count({
      where: {
        start_date: { gte: startDate, lte: endDate },
        end_date: { not: null },
        end_station: { not: null }
      }
    });

    // Courses en attente
    const waitingCourses = await prisma.course.count({
      where: {
        start_date: { gte: startDate, lte: endDate },
        waiting: true
      }
    });

    // Courses pending
    const pendingCourses = await prisma.course.count({
      where: {
        start_date: { gte: startDate, lte: endDate },
        end_station: null,
        waiting: false
      }
    });

    // Top 10 véhicules avec le plus de clockings
    const topVehiclesByClocking = await prisma.clocking.groupBy({
      by: ["vehicle_id"],
      where: {
        created_at: { gte: startDate, lte: endDate },
        type: { in: [0, 1, 3, 4] }
      },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10
    });

    // Récupérer les infos des véhicules
    const vehicleIds = topVehiclesByClocking.map(v => v.vehicle_id);
    const vehicles = await prisma.vehicle.findMany({
      where: { id: { in: vehicleIds } },
      select: { id: true, matricule: true, model: true, brand: true }
    });

    const topVehicles = topVehiclesByClocking.map(v => {
      const vehicle = vehicles.find(vh => vh.id === v.vehicle_id);
      return {
        vehicle_id: v.vehicle_id,
        matricule: vehicle?.matricule || "N/A",
        model: vehicle?.model || "N/A",
        brand: vehicle?.brand || "N/A",
        count: v._count.id
      };
    });

    // Top 10 véhicules avec le plus de courses
    const topVehiclesByCourses = await prisma.course.groupBy({
      by: ["vehicle_id"],
      where: {
        start_date: { gte: startDate, lte: endDate }
      },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10
    });

    const vehicleIdsCourses = topVehiclesByCourses.map(v => v.vehicle_id);
    const vehiclesCourses = await prisma.vehicle.findMany({
      where: { id: { in: vehicleIdsCourses } },
      select: { id: true, matricule: true, model: true, brand: true }
    });

    const topVehiclesCourses = topVehiclesByCourses.map(v => {
      const vehicle = vehiclesCourses.find(vh => vh.id === v.vehicle_id);
      return {
        vehicle_id: v.vehicle_id,
        matricule: vehicle?.matricule || "N/A",
        model: vehicle?.model || "N/A",
        brand: vehicle?.brand || "N/A",
        count: v._count.id
      };
    });

    // Taux d'utilisation
    const utilizationRate = totalVehicles > 0 ? (totalWorkedVehicles / totalVehicles) * 100 : 0;

    return {
      success: true,
      data: {
        period,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        totalVehicles,
        totalWorkedVehicles,
        vehiclesWithoutClocking,
        totalVehiclesWithCourses,
        vehiclesWithoutCourses,
        utilizationRate: Math.round(utilizationRate * 100) / 100,
        clockingsByType: clockingsByType.map(c => ({
          type: c.type,
          count: c._count.id
        })),
        totalCourses,
        completedCourses,
        waitingCourses,
        pendingCourses,
        topVehiclesByClocking: topVehicles,
        topVehiclesByCourses: topVehiclesCourses
      }
    };
  } catch (error) {
    console.error("Error in getGlobalStatistics:", error);
    return { success: false, error: "Failed to fetch statistics" };
  }
}

// ============= PAGE 2: STATISTIQUES DES CLOCKINGS =============

export async function getClockingStatistics(
  date: Date,
  clockingType?: number,
  minClockings?: number,
  page: number = 1,
  pageSize: number = 20
) {
  try {
    const startDate = startOfDay(date);
    const endDate = endOfDay(date);

    // Véhicules sans clockings du type spécifié
    const allVehicles = await prisma.vehicle.findMany({
      where: { deleted_at: null },
      select: { id: true, matricule: true, model: true, brand: true, park: { select: { name: true } } }
    });

    const vehiclesWithClockings = await prisma.clocking.findMany({
      where: {
        created_at: { gte: startDate, lte: endDate },
        ...(clockingType !== undefined && { type: clockingType })
      },
      select: { vehicle_id: true }
    });

    const vehicleIdsWithClockings = new Set(vehiclesWithClockings.map(c => c.vehicle_id));
    
    const vehiclesWithoutClockings = allVehicles.filter(v => !vehicleIdsWithClockings.has(v.id));

    // Véhicules avec X clockings
    const clockingCounts = await prisma.clocking.groupBy({
      by: ["vehicle_id"],
      where: {
        created_at: { gte: startDate, lte: endDate },
        ...(clockingType !== undefined && { type: clockingType })
      },
      _count: { id: true }
    });

    let filteredCounts = clockingCounts;
    if (minClockings !== undefined && minClockings >= 0) {
      filteredCounts = clockingCounts.filter(c => c._count.id === minClockings);
    }

    // Pagination
    const totalItems = filteredCounts.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (page - 1) * pageSize;
    const paginatedCounts = filteredCounts.slice(startIndex, startIndex + pageSize);

    const vehicleIds = paginatedCounts.map(c => c.vehicle_id);
    const vehicles = await prisma.vehicle.findMany({
      where: { id: { in: vehicleIds } },
      select: { 
        id: true, 
        matricule: true, 
        model: true, 
        brand: true,
        park: { select: { name: true } },
        region: { select: { name: true } }
      }
    });

    const vehiclesWithClockingCount = paginatedCounts.map(c => {
      const vehicle = vehicles.find(v => v.id === c.vehicle_id);
      return {
        vehicle_id: c.vehicle_id,
        matricule: vehicle?.matricule || "N/A",
        model: vehicle?.model || "N/A",
        brand: vehicle?.brand || "N/A",
        park: vehicle?.park?.name || "N/A",
        region: vehicle?.region?.name || "N/A",
        clockingCount: c._count.id
      };
    });

    // Statistiques par type
    const clockingsByType = await prisma.clocking.groupBy({
      by: ["type"],
      where: {
        created_at: { gte: startDate, lte: endDate }
      },
      _count: { id: true }
    });

    return {
      success: true,
      data: {
        date: date.toISOString(),
        vehiclesWithoutClockings: vehiclesWithoutClockings.map(v => ({
          id: v.id,
          matricule: v.matricule || "N/A",
          model: v.model || "N/A",
          brand: v.brand || "N/A",
          park: v.park?.name || "N/A"
        })),
        vehiclesWithClockings: vehiclesWithClockingCount,
        clockingsByType: clockingsByType.map(c => ({
          type: c.type,
          count: c._count.id
        })),
        pagination: {
          currentPage: page,
          totalPages,
          totalItems,
          pageSize
        }
      }
    };
  } catch (error) {
    console.error("Error in getClockingStatistics:", error);
    return { success: false, error: "Failed to fetch clocking statistics" };
  }
}

// ============= PAGE 3: STATISTIQUES DES COURSES =============

export async function getCourseStatistics(
  date: Date,
  minCourses?: number,
  page: number = 1,
  pageSize: number = 20
) {
  try {
    const startDate = startOfDay(date);
    const endDate = endOfDay(date);

    // Véhicules sans courses
    const allVehicles = await prisma.vehicle.findMany({
      where: { deleted_at: null },
      select: { id: true, matricule: true, model: true, brand: true, park: { select: { name: true } } }
    });

    const vehiclesWithCourses = await prisma.course.findMany({
      where: {
        start_date: { gte: startDate, lte: endDate }
      },
      select: { vehicle_id: true }
    });

    const vehicleIdsWithCourses = new Set(vehiclesWithCourses.map(c => c.vehicle_id));
    
    const vehiclesWithoutCourses = allVehicles.filter(v => !vehicleIdsWithCourses.has(v.id));

    // Courses complètes, pending, waiting
    const completedCourses = await prisma.course.count({
      where: {
        start_date: { gte: startDate, lte: endDate },
        end_date: { not: null },
        end_station: { not: null }
      }
    });

    const pendingCourses = await prisma.course.count({
      where: {
        start_date: { gte: startDate, lte: endDate },
        end_station: null,
        waiting: false
      }
    });

    const waitingCourses = await prisma.course.count({
      where: {
        start_date: { gte: startDate, lte: endDate },
        waiting: true
      }
    });

    // Véhicules avec X courses complètes
    const completedCourseCounts = await prisma.course.groupBy({
      by: ["vehicle_id"],
      where: {
        start_date: { gte: startDate, lte: endDate },
        end_date: { not: null },
        end_station: { not: null }
      },
      _count: { id: true }
    });

    let filteredCounts = completedCourseCounts;
    if (minCourses !== undefined && minCourses >= 0) {
      filteredCounts = completedCourseCounts.filter(c => c._count.id === minCourses);
    }

    // Pagination
    const totalItems = filteredCounts.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (page - 1) * pageSize;
    const paginatedCounts = filteredCounts.slice(startIndex, startIndex + pageSize);

    const vehicleIds = paginatedCounts.map(c => c.vehicle_id);
    const vehicles = await prisma.vehicle.findMany({
      where: { id: { in: vehicleIds } },
      select: { 
        id: true, 
        matricule: true, 
        model: true, 
        brand: true,
        park: { select: { name: true } },
        region: { select: { name: true } }
      }
    });

    const vehiclesWithCompletedCourses = paginatedCounts.map(c => {
      const vehicle = vehicles.find(v => v.id === c.vehicle_id);
      return {
        vehicle_id: c.vehicle_id,
        matricule: vehicle?.matricule || "N/A",
        model: vehicle?.model || "N/A",
        brand: vehicle?.brand || "N/A",
        park: vehicle?.park?.name || "N/A",
        region: vehicle?.region?.name || "N/A",
        completedCourseCount: c._count.id
      };
    });

    // Véhicules avec courses pending
    const vehiclesWithPending = await prisma.course.findMany({
      where: {
        start_date: { gte: startDate, lte: endDate },
        end_station: null,
        waiting: false
      },
      select: {
        vehicle_id: true,
        vehicle: {
          select: {
            matricule: true,
            model: true,
            brand: true,
            park: { select: { name: true } }
          }
        }
      },
      distinct: ["vehicle_id"]
    });

    // Véhicules avec courses waiting
    const vehiclesWithWaiting = await prisma.course.findMany({
      where: {
        start_date: { gte: startDate, lte: endDate },
        waiting: true
      },
      select: {
        vehicle_id: true,
        vehicle: {
          select: {
            matricule: true,
            model: true,
            brand: true,
            park: { select: { name: true } }
          }
        }
      },
      distinct: ["vehicle_id"]
    });

    return {
      success: true,
      data: {
        date: date.toISOString(),
        vehiclesWithoutCourses: vehiclesWithoutCourses.map(v => ({
          id: v.id,
          matricule: v.matricule || "N/A",
          model: v.model || "N/A",
          brand: v.brand || "N/A",
          park: v.park?.name || "N/A"
        })),
        completedCourses,
        pendingCourses,
        waitingCourses,
        vehiclesWithCompletedCourses,
        vehiclesWithPending: vehiclesWithPending.map(c => ({
          vehicle_id: c.vehicle_id,
          matricule: c.vehicle.matricule || "N/A",
          model: c.vehicle.model || "N/A",
          brand: c.vehicle.brand || "N/A",
          park: c.vehicle.park?.name || "N/A"
        })),
        vehiclesWithWaiting: vehiclesWithWaiting.map(c => ({
          vehicle_id: c.vehicle_id,
          matricule: c.vehicle.matricule || "N/A",
          model: c.vehicle.model || "N/A",
          brand: c.vehicle.brand || "N/A",
          park: c.vehicle.park?.name || "N/A"
        })),
        pagination: {
          currentPage: page,
          totalPages,
          totalItems,
          pageSize
        }
      }
    };
  } catch (error) {
    console.error("Error in getCourseStatistics:", error);
    return { success: false, error: "Failed to fetch course statistics" };
  }
}