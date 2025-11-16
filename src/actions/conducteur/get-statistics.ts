"use server"

import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { withAuthorizationPermission, verifySession } from "../permissions";
import { 
  startOfWeek, 
  startOfMonth, 
  subMonths, 
  startOfYear, 
  subYears, 
  subWeeks,
  startOfDay,
  endOfDay,
  subDays,
  format 
} from 'date-fns';

export async function getConducteursStatistics(periodParms?: string): Promise<{ status: number, data: any }> {
    const e = await getTranslations('Error');
    try {
        const session = await verifySession();
        if (!session?.data?.user) {
            return { status: 401, data: { message: e("unauthorized") } };
        }
        const hasPermission = await withAuthorizationPermission(['conducteur_view'], session.data.user.id);

        if (hasPermission.status != 200 || !hasPermission.data.hasPermission) {
            return { status: 403, data: { message: e('forbidden') } };
        }

        const period = periodParms || 'week';

        const { currentRange, previousRange } = getDateRanges(period);

        const [currentStats, previousStats, summary, dailyTopWorkers] = await Promise.all([
            getDriverStats(currentRange.start, currentRange.end),
            getDriverStats(previousRange.start, previousRange.end),
            getSummaryStats(currentRange.start, currentRange.end),
            getDailyTopWorkers(7) // Top travailleurs des 7 derniers jours
        ]);

        return {
            status: 200, 
            data: {
                current: currentStats,
                previous: previousStats,
                summary,
                dailyTopWorkers,
                period
            }
        };
    } catch (error) {
        console.log("An error occurred in getconducteursStatistics", error);
        return { status: 500, data: { message: e("error") } };
    }
}

function getDateRanges(period: string) {
    const now = new Date();

    switch (period) {
        case 'week':
            return {
                currentRange: {
                    start: startOfWeek(now),
                    end: now
                },
                previousRange: {
                    start: startOfWeek(subWeeks(now, 1)),
                    end: subWeeks(now, 1)
                }
            };

        case 'month':
            return {
                currentRange: {
                    start: startOfMonth(now),
                    end: now
                },
                previousRange: {
                    start: startOfMonth(subMonths(now, 1)),
                    end: subMonths(now, 1)
                }
            };

        case 'threeMonths':
            return {
                currentRange: {
                    start: subMonths(now, 3),
                    end: now
                },
                previousRange: {
                    start: subMonths(now, 6),
                    end: subMonths(now, 3)
                }
            };

        case 'year':
            return {
                currentRange: {
                    start: startOfYear(now),
                    end: now
                },
                previousRange: {
                    start: startOfYear(subYears(now, 1)),
                    end: subYears(now, 1)
                }
            };

        default:
            return getDateRanges('week');
    }
}

async function getDriverStats(startDate: Date, endDate: Date): Promise<any[]> {
    const drivers = await prisma.conducteur.findMany({
        where: {
            AND:[
                {deleted_at:null},
                {work_status:true}
            ]
        },
        include: {
            clocking: {
                where: {
                    created_at: {
                        gte: startDate,
                        lte: endDate
                    }
                }
            },
            course: {
                where: {
                    created_at: {
                        gte: startDate,
                        lte: endDate
                    }
                }
            }
        }
    });

    return drivers.map(driver => ({
        id: driver.id,
        matricule: driver.matricule,
        firstname: driver.firstname,
        lastname: driver.lastname,
        rotations: driver.course.length,
        clockins: driver.clocking.length,
        totalActivities: driver.course.length + driver.clocking.length
    }));
}

async function getSummaryStats(startDate: Date, endDate: Date) {
    const drivers = await getDriverStats(startDate, endDate);
    const totalDrivers = drivers.length;
    const activeDrivers = drivers.filter(d => d.rotations > 0 || d.clockins > 0).length;
    const workingDrivers = drivers.filter(d => d.rotations > 0).length;

    const totalRotations = drivers.reduce((sum, d) => sum + d.rotations, 0);
    const totalClockins = drivers.reduce((sum, d) => sum + d.clockins, 0);
    const totalActivities = drivers.reduce((sum, d) => sum + d.totalActivities, 0);

    return {
        totalDrivers,
        activeDrivers,
        workingDrivers,
        nonWorkingDrivers: totalDrivers - workingDrivers,
        averageRotations: totalDrivers > 0 ? totalRotations / totalDrivers : 0,
        averageClockins: totalDrivers > 0 ? totalClockins / totalDrivers : 0,
        averageActivities: totalDrivers > 0 ? totalActivities / totalDrivers : 0,
        totalRotations,
        totalClockins,
        totalActivities
    };
}

async function getDailyTopWorkers(days: number = 7) {
    const results = [];
    
    for (let i = 0; i < days; i++) {
        const date = subDays(new Date(), i);
        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);
        
        // Récupérer les conducteurs avec leurs activités pour ce jour
        const dailyDrivers = await prisma.conducteur.findMany({
            where: {
                AND: [
                    {deleted_at:null},
                    {work_status:true}
                ],
                OR: [
                    {
                        clocking: {
                            some: {
                                created_at: {
                                    gte: dayStart,
                                    lte: dayEnd
                                }
                            }
                        }
                    },
                    {
                        course: {
                            some: {
                                created_at: {
                                    gte: dayStart,
                                    lte: dayEnd
                                }
                            }
                        }
                    }
                ]
            },
            include: {
                clocking: {
                    where: {
                        created_at: {
                            gte: dayStart,
                            lte: dayEnd
                        }
                    }
                },
                course: {
                    where: {
                        created_at: {
                            gte: dayStart,
                            lte: dayEnd
                        }
                    }
                }
            }
        });

        // Calculer le score de productivité pour chaque conducteur
        const driversWithScore = dailyDrivers.map(driver => {
            const rotations = driver.course.length;
            const clockins = driver.clocking.length;
            const totalActivities = rotations + clockins;
            
            // Score basé sur les rotations (plus importantes) et clockins
            const productivityScore = (rotations * 2) + clockins;
            
            return {
                id: driver.id,
                matricule: driver.matricule,
                firstname: driver.firstname,
                lastname: driver.lastname,
                rotations,
                clockins,
                totalActivities,
                productivityScore
            };
        });

        // Trier par score de productivité et prendre le top 5
        const topWorkers = driversWithScore
            .sort((a, b) => b.productivityScore - a.productivityScore)
            .slice(0, 5);

        results.push({
            date: format(date, 'yyyy-MM-dd'),
            displayDate: format(date, 'dd/MM/yyyy'),
            topWorkers,
            totalActiveDrivers: dailyDrivers.length,
            totalRotations: topWorkers.reduce((sum, driver) => sum + driver.rotations, 0),
            totalClockins: topWorkers.reduce((sum, driver) => sum + driver.clockins, 0)
        });
    }

    return results.reverse(); // Pour avoir du plus ancien au plus récent
}

// Nouvelle fonction pour obtenir les statistiques détaillées par jour
export async function getDailyDriverStats(days: number = 30) {
    const e = await getTranslations('Error');
    try {
        const session = await verifySession();
        if (!session?.data?.user) {
            return { status: 401, data: { message: e("unauthorized") } };
        }

        const hasPermission = await withAuthorizationPermission(['conducteur_view'], session.data.user.id);
        if (hasPermission.status != 200 || !hasPermission.data.hasPermission) {
            return { status: 403, data: { message: e('forbidden') } };
        }

        const dailyStats = [];
        
        for (let i = 0; i < days; i++) {
            const date = subDays(new Date(), i);
            const dayStart = startOfDay(date);
            const dayEnd = endOfDay(date);

            const dayData = await prisma.conducteur.findMany({
                where: {
                    deleted_at: null
                },
                include: {
                    clocking: {
                        where: {
                            created_at: {
                                gte: dayStart,
                                lte: dayEnd
                            }
                        }
                    },
                    course: {
                        where: {
                            created_at: {
                                gte: dayStart,
                                lte: dayEnd
                            }
                        }
                    }
                }
            });

            const activeDrivers = dayData.filter(d => 
                d.clocking.length > 0 || d.course.length > 0
            ).length;

            const totalRotations = dayData.reduce((sum, d) => sum + d.course.length, 0);
            const totalClockins = dayData.reduce((sum, d) => sum + d.clocking.length, 0);

            dailyStats.push({
                date: format(date, 'yyyy-MM-dd'),
                displayDate: format(date, 'dd/MM/yyyy'),
                activeDrivers,
                totalRotations,
                totalClockins,
                totalActivities: totalRotations + totalClockins
            });
        }

        return {
            status: 200,
            data: dailyStats.reverse() // Du plus ancien au plus récent
        };
    } catch (error) {
        console.log("An error occurred in getDailyDriverStats", error);
        return { status: 500, data: { message: e("error") } };
    }
}


export async function getConducteurStatistics(conducteurId: string, period: string) {
  try {
    const now = new Date()
    let startDate = new Date()
    
    switch (period) {
      case 'day':
        startDate.setHours(0, 0, 0, 0)
        break
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
      case '3months':
        startDate.setMonth(now.getMonth() - 3)
        break
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 7)
    }

    // Statistiques des courses
    const courses = await prisma.course.findMany({
      where: {
        conducteur_id: conducteurId,
        start_date: { gte: startDate }
      }
    })

    // Statistiques des pointages
    const clockings = await prisma.clocking.findMany({
      where: {
        conducteur_id: conducteurId,
        created_at: { gte: startDate }
      }
    })

    // Jours travaillés et absents
    const workedDays = new Set(
      clockings.map(c => c.created_at.toISOString().split('T')[0])
    ).size

    const totalDays = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 3600 * 24))
    const absentDays = totalDays - workedDays

    // Calcul des heures totales
    const totalHours = courses.reduce((acc, course) => {
      if (course.end_date) {
        const hours = (course.end_date.getTime() - course.start_date.getTime()) / (1000 * 3600)
        return acc + hours
      }
      return acc
    }, 0)

    const statistics = {
      total_hours: Math.round(totalHours * 100) / 100,
      total_courses: courses.length,
      total_clockings: clockings.length,
      days_worked: workedDays,
      days_absent: absentDays,
      average_hours_per_day: workedDays > 0 ? Math.round((totalHours / workedDays) * 100) / 100 : 0
    }

    return { status: 200, data: statistics }
  } catch (error) {
    console.error("Error fetching statistics:", error)
    return { status: 500, data: { message: "Erreur serveur" } }
  }
}

export async function getConducteurDetails(id: string) {
  try {
    const conducteur = await prisma.conducteur.findUnique({
      where: { id, deleted_at: null },
      include: {
        clocking: {
          orderBy: { created_at: 'desc' },
          take: 10,
          include: {
            vehicle: true,
            park: true,
            region: true
          }
        },
        course: {
          orderBy: { start_date: 'desc' },
          take: 10,
          include: {
            vehicle: true
          }
        }
      }
    })

    if (!conducteur) {
      return { status: 404, data: { message: "Conducteur non trouvé" } }
    }

    return { status: 200, data: conducteur }
  } catch (error) {
    console.error("Error fetching conducteur details:", error)
    return { status: 500, data: { message: "Erreur serveur" } }
  }
}

export async function getConducteurCourses(conducteurId: string, date: string) {
  try {
    const targetDate = new Date(date)
    const nextDate = new Date(targetDate)
    nextDate.setDate(targetDate.getDate() + 1)

    const courses = await prisma.course.findMany({
      where: {
        conducteur_id: conducteurId,
        start_date: {
          gte: targetDate,
          lt: nextDate
        }
      },
      include: {
        vehicle: true
      },
      orderBy: {
        start_date: 'asc'
      }
    })

    return { status: 200, data: courses }
  } catch (error) {
    console.error("Error fetching courses:", error)
    return { status: 500, data: { message: "Erreur serveur" } }
  }
}

export async function getConducteurClockings(conducteurId: string, date: string) {
  try {
    const targetDate = new Date(date)
    const nextDate = new Date(targetDate)
    nextDate.setDate(targetDate.getDate() + 1)

    const clockings = await prisma.clocking.findMany({
      where: {
        conducteur_id: conducteurId,
        created_at: {
          gte: targetDate,
          lt: nextDate
        }
      },
      include: {
        vehicle: true,
        park: true,
        region: true,
        device: true
      },
      orderBy: {
        created_at: 'asc'
      }
    })

    return { status: 200, data: clockings }
  } catch (error) {
    console.error("Error fetching clockings:", error)
    return { status: 500, data: { message: "Erreur serveur" } }
  }
}

export async function getConducteurAbsentDays(conducteurId: string) {
  try {
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

    // Récupérer tous les jours avec des pointages
    const clockingDays = await prisma.clocking.findMany({
      where: {
        conducteur_id: conducteurId,
        created_at: { gte: threeMonthsAgo }
      },
      select: {
        created_at: true
      }
    })

    // Convertir en Set de dates uniques (YYYY-MM-DD)
    const workedDays = new Set(
      clockingDays.map(c => c.created_at.toISOString().split('T')[0])
    )

    // Générer tous les jours des 3 derniers mois
    const allDays = []
    const currentDate = new Date(threeMonthsAgo)
    
    while (currentDate <= new Date()) {
      // Exclure les weekends (samedi=6, dimanche=0)
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
        const dateStr = currentDate.toISOString().split('T')[0]
        if (!workedDays.has(dateStr)) {
          allDays.push(dateStr)
        }
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return { status: 200, data: allDays }
  } catch (error) {
    console.error("Error fetching absent days:", error)
    return { status: 500, data: { message: "Erreur serveur" } }
  }
}