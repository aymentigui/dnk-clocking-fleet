"use server"
import { prisma } from "@/lib/db";
import { getTranslations } from "next-intl/server";
import { verifySession, withAuthorizationPermission } from "../permissions";


export async function getCourse(page: number = 1, pageSize: number = 20, vehicle_id: string, entreprise_id?: string, date?: Date, conducteur_id?: string, region_depart?: string, region_arrive?: string, enableAll?: boolean, completed: boolean | undefined = undefined, withRotation: boolean = false, waiting: boolean | undefined = undefined) {
    const e = await getTranslations('Error');
    try {
        const session = await verifySession()
        if (!session || session.status != 200) {
            return { status: 401, data: [], message: e('unauthorized'), totalCompleted: 0, totalWaiting: 0, totalInProgress: 0 }
        }

        const hasPermission = await withAuthorizationPermission(['course_view'], session.data.user.id);

        if (hasPermission.status != 200 || !hasPermission.data.hasPermission) {
            return { status: 403, data: [], message: e('forbidden'), totalCompleted: 0, totalWaiting: 0, totalInProgress: 0 };
        }


        const skip = (page - 1) * pageSize;

        let start_stations: string[] = [];
        let end_stations: string[] = [];

        if (entreprise_id) {
            const entrepise_route = await prisma.entreprise_route.findMany({
                where: { entreprise_id: entreprise_id }
            });

            start_stations = entrepise_route.map(route => route.region_depart).filter((station) => station !== null) as string[];
            end_stations = entrepise_route.map(route => route.region_arrive).filter((station) => station !== null) as string[];
        } else if (region_depart) {
            start_stations = [region_depart];
        } else if (region_arrive) {
            end_stations = [region_arrive];
        }

        const condtition = {
            AND: [
                completed === undefined
                    ? {}
                    : completed === false
                        ? { end_date: null }
                        : { NOT: { end_date: null } }, // end_date non null
                waiting === undefined
                    ? {}
                    : { waiting: waiting },
                date ? {
                    start_date: {
                        gte: new Date(date.setHours(0, 0, 0, 0)),
                        lte: new Date(date.setHours(23, 59, 59, 999)),
                    }
                } : {},
                vehicle_id ? { vehicle_id: vehicle_id } : {},
                conducteur_id ? { conducteur_id: conducteur_id } : {},
                start_stations.length > 0 && enableAll
                    ? { OR: [{ start_station: { in: start_stations } }, { end_station: { in: end_stations } }] }
                    : (start_stations.length > 0 ? { start_station: { in: start_stations } } : {}),
                end_stations.length > 0 && enableAll ? { OR: [{ end_station: { in: end_stations } }, { start_station: { in: start_stations } }] } :
                    (end_stations.length > 0 ? { end_station: { in: end_stations } } : {}),
            ]
        }

        const baseWhere = { ...condtition };

        // Total completed (end_date != null)
        const totalCompleted = await prisma.course.count({
            where: {
                AND: [
                    ...baseWhere.AND,
                    { NOT: { end_date: null } }
                ]
            }
        });

        // Total waiting (waiting = true)
        const totalWaiting = await prisma.course.count({
            where: {
                AND: [
                    ...baseWhere.AND,
                    { waiting: true }
                ]
            }
        });

        // Total in progress (waiting = false AND end_date = null)
        const totalInProgress = await prisma.course.count({
            where: {
                AND: [
                    ...baseWhere.AND,
                    { waiting: false },
                    { end_date: null }
                ]
            }
        });

        if (withRotation) {
            // Récupérer toutes les courses sans pagination pour pouvoir les grouper
            const allCourses = await prisma.course.findMany({
                where: {
                    ...condtition
                },
                orderBy: {
                    start_date: 'asc'
                }
            });

            // Identifier les courses déjà utilisées dans une paire aller-retour
            const usedCourseIds = new Set<string>();
            const groupedCourses: any[] = [];
            let totalRotations = 0;

            // Parcourir toutes les courses pour trouver les paires aller-retour
            for (let i = 0; i < allCourses.length; i++) {
                if (usedCourseIds.has(allCourses[i].id)) {
                    continue; // Cette course est déjà dans une paire
                }

                const courseAller = allCourses[i];
                let foundRetour = false;

                // Chercher une course retour correspondante
                for (let j = i + 1; j < allCourses.length; j++) {
                    const courseRetour = allCourses[j];

                    // Vérifier si c'est une paire aller-retour
                    if (
                        !usedCourseIds.has(courseRetour.id) &&
                        courseAller.vehicle_id === courseRetour.vehicle_id &&
                        courseAller.start_station === courseRetour.end_station &&
                        courseAller.end_station === courseRetour.start_station &&
                        courseAller.start_station !== null &&
                        courseAller.end_station !== null &&
                        courseRetour.start_station !== null &&
                        courseRetour.end_station !== null
                    ) {
                        // C'est une paire aller-retour, rotation = 1
                        usedCourseIds.add(courseAller.id);
                        usedCourseIds.add(courseRetour.id);

                        groupedCourses.push({
                            ...courseAller,
                            rotation: 1,
                            course_retour: courseRetour
                        });

                        totalRotations += 1;
                        foundRetour = true;
                        break;
                    }
                }

                // Si pas de retour trouvé, c'est seulement un aller, rotation = 0.5
                if (!foundRetour) {
                    usedCourseIds.add(courseAller.id);
                    groupedCourses.push({
                        ...courseAller,
                        rotation: 0.5,
                        course_retour: null
                    });
                    totalRotations += 0.5;
                }
            }

            // Appliquer la pagination sur les courses groupées
            const paginatedCourses = pageSize === 0
                ? groupedCourses
                : groupedCourses.slice(skip, skip + pageSize);

            const paginatedCoursesFiltred = await Promise.all(paginatedCourses.map(async (course) => {
                const start_region_name = course.start_station ? (await prisma.region.findUnique({ where: { id: course.start_station } }))?.name : null
                const end_region_name = course.end_station ? (await prisma.region.findUnique({ where: { id: course.end_station } }))?.name : null
                return {
                    ...course,
                    start_region_name: start_region_name,
                    end_region_name: end_region_name,
                    course_retour: course.course_retour ? {
                        ...course.course_retour,
                        start_region_name: end_region_name,
                        end_region_name: start_region_name
                    } : null,
                }
            }));

            return {
                status: 200,
                data: paginatedCoursesFiltred,
                count: groupedCourses.length,
                totalRotations: totalRotations,
                totalCompleted: totalCompleted,
                totalWaiting: totalWaiting,
                totalInProgress: totalInProgress
            };
        } else {
            // Logique normale sans rotation
            const courses = await prisma.course.findMany({
                skip: skip, // Nombre d'éléments à sauter
                take: pageSize === 0 ? undefined : pageSize, // Nombre d'éléments à prendre
                where: {
                    ...condtition
                }
            });

            const count = await prisma.course.count({
                where: {
                    ...condtition
                }
            });

            const courseFiltred = await Promise.all(courses.map(async (course) => {
                return {
                    ...course,
                    start_region_name: course.start_station ? (await prisma.region.findUnique({ where: { id: course.start_station } }))?.name : null,
                    end_region_name: course.end_station ? (await prisma.region.findUnique({ where: { id: course.end_station } }))?.name : null,
                }
            }));

            return { status: 200, data: courseFiltred, count, totalCompleted: totalCompleted, totalWaiting: totalWaiting, totalInProgress: totalInProgress};
        }
    }
    catch (error) {
        console.log("An error occurred in getCourse");
        return { status: 500, data: [], message: e("error"), totalCompleted: 0, totalWaiting: 0, totalInProgress: 0 };
    }
}

