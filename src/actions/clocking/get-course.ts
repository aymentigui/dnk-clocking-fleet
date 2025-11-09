"use server"
import { prisma } from "@/lib/db";
import { getTranslations } from "next-intl/server";
import { verifySession, withAuthorizationPermission } from "../permissions";


export async function getCourse(page:number=1, pageSize:number= 20, vehicle_id: string, entreprise_id?: string, date?: Date, conducteur_id?: string, region_depart?: string, region_arrive?: string, enableAll?: boolean, completed: boolean = true, withRotation: boolean =false) {
    const e = await getTranslations('Error');
    try {
        const session = await verifySession()
        if (!session || session.status != 200) {
            return { status: 401, data: [],  message: e('unauthorized') }
        }

        const hasPermission = await withAuthorizationPermission(['course_view'], session.data.user.id);

        if (hasPermission.status != 200 || !hasPermission.data.hasPermission) {
            return { status: 403, data: [], message: e('forbidden') };
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
                { waiting: !completed },
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

            return { 
                status: 200, 
                data: paginatedCourses, 
                count: groupedCourses.length,
                totalRotations: totalRotations
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

            return { status: 200, data: courses, count };
        }
    }
    catch (error) {
        console.log("An error occurred in getCourse");
        return { status: 500, data: [], message: e("error") };
    }
}

