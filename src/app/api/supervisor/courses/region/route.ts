// Get courses starting or ending in a region
import { verifySession } from "@/actions/permissions";
import { withAuth } from "@/actions/util/with-auth";
import { prisma } from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";

export const GET = withAuth(async (request, { user }) => {
    try {

        const session = await verifySession()
        if (!session || session.status != 200) {
            return NextResponse.json(
                { message: "Not authorized" },
                { status: 401 }
            );
        }

        const device = await prisma.device.findFirst({ where: { user_id: session.data.user.id } })
        if (!device || device.type !== 5) {
            return NextResponse.json(
                { message: "Not authorized" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const regionId = searchParams.get("regionId");
        const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "10", 10);

        if (!regionId) {
            return NextResponse.json(
                { message: "Region ID is required" },
                { status: 400 }
            );
        }

        const startOfDay = new Date(`${date}T00:00:00`);
        const endOfDay = new Date(`${date}T23:59:59`);
        const skip = (page - 1) * limit;

        // Get courses starting or ending in this region
        const courses = await prisma.course.findMany({
            where: {
                OR: [
                    {
                        start_station: regionId,
                        start_date: {
                            gte: startOfDay,
                            lte: endOfDay,
                        },
                    },
                    {
                        end_station: regionId,
                        start_date: {
                            gte: startOfDay,
                            lte: endOfDay,
                        },
                    },
                ],
            },
            include: {
                vehicle: {
                    select: {
                        id: true,
                        matricule: true,
                        brand: true,
                    },
                },
                conducteur: {
                    select: {
                        id: true,
                        firstname: true,
                        lastname: true,
                        matricule: true,
                    },
                },
            },
            orderBy: {
                start_date: "desc",
            },
            skip,
            take: limit,
        });

        const totalCount = await prisma.course.count({
            where: {
                OR: [
                    {
                        start_station: regionId,
                        start_date: {
                            gte: startOfDay,
                            lte: endOfDay,
                        },
                    },
                    {
                        end_station: regionId,
                        start_date: {
                            gte: startOfDay,
                            lte: endOfDay,
                        },
                    },
                ],
            },
        });

        const totalPages = Math.ceil(totalCount / limit);

        // Map to include status
        const coursesWithStatus = await Promise.all(courses.map(async (course) => {
            let status = "في الانتظار"; // waiting
            if (!course.waiting && course.end_date === null) {
                status = "جاري"; // in progress
            } else if (!course.waiting && course.end_date !== null) {
                status = "منتهية"; // completed
            }

            // Récupérer les noms des stations
            const start_station = course.start_station ? await prisma.region.findUnique({
                where: {
                    id: course.start_station
                }
            }) : null;

            const end_station = course.end_station ? await prisma.region.findUnique({
                where: {
                    id: course.end_station
                }
            }) : null;

            return {
                ...course,
                status,
                start_station_name: start_station ? start_station.name : "--",
                end_station_name: end_station ? end_station.name : "--"
            };
        }));

        return NextResponse.json(
            {
                data: coursesWithStatus,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalCount,
                    limit,
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error fetching courses:", error);
        return NextResponse.json(
            { message: "Failed to fetch courses" },
            { status: 500 }
        );
    }
});
