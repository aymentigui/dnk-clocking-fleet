"use server"

import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { withAuthorizationPermission, verifySession } from "../permissions";


export async function getVehicles(page: number = 1, pageSize: number = 10, searchQuery?: string, searchPark?: string, searchRegion?: string): Promise<{ status: number, data: any }> {
    const e = await getTranslations('Error');
    try {
        const session = await verifySession()
        if (!session || session.status != 200) {
            return { status: 401, data: { message: e('unauthorized') } }
        }
        const hasPermissionAdd = await withAuthorizationPermission(['vehicles_view']);

        if (hasPermissionAdd.status != 200 || !hasPermissionAdd.data.hasPermission) {
            return { status: 403, data: { message: e('forbidden') } };
        }

        // Calculer le nombre d'éléments à sauter
        const skip = (page - 1) * pageSize;
        const searchConditions = {}
        if ((searchQuery && searchQuery !== ""))
            // @ts-ignore
            searchConditions.OR = [
                { matricule: { contains: searchQuery } },
                { vin: { contains: searchQuery, mode: "insensitive" } },
                { brand: { contains: searchQuery,mode: "insensitive" } },
                { model: { contains: searchQuery, mode: "insensitive" } },
                // { year: { contains: Number(searchQuery) } },
            ]

        if ((searchPark && searchPark !== "" && searchPark !== "0"))
            // @ts-ignore
            searchConditions.AND = [
                {
                    vehicle_park: {
                        every: {
                            park: {
                                id: searchPark,
                            }
                        },
                        some: {
                            park: {
                                id: searchPark,
                            }
                        }
                    }
                }
            ]
        if ((searchRegion && searchRegion !== "" && searchRegion !== "0")) {
            // @ts-ignore
            if (!searchConditions.AND)
                // @ts-ignore
                searchConditions.AND = []
            // @ts-ignore
            searchConditions.AND.push(
                {
                    vehicle_region: {
                        every: {
                            region: {
                                id: searchRegion,
                            }
                        },
                        some: {
                            region: {
                                id: searchRegion,
                            }
                        }
                    }
                }
            )
        }

        const vehicles = await prisma.vehicle.findMany({
            skip: skip, // Nombre d'éléments à sauter
            take: pageSize === 0 ? undefined : pageSize, // Nombre d'éléments à prendre
            where: searchConditions,
            include: {
                vehicle_park: {
                    orderBy: {
                        added_at: 'desc',
                    },
                    include: {
                        park: true,
                    },
                    take: 1,
                },
                vehicle_region: {
                    orderBy: {
                        added_at: 'desc',
                    },
                    include: {
                        region: true,
                    },
                    take: 1,
                },
            }
        });

        const vehiclesFormatted = vehicles.map((vehicle) => {
            return {
                id: vehicle.id,
                matricule: vehicle.matricule,
                vin: vehicle.vin,
                brand: vehicle.brand,
                model: vehicle.model,
                year: vehicle.year,
                park: vehicle.vehicle_park && vehicle.vehicle_park[0] && vehicle.vehicle_park[0].park ? vehicle.vehicle_park[0].park.name : "",
                parkId: vehicle.vehicle_park && vehicle.vehicle_park[0] && vehicle.vehicle_park[0].park ? vehicle.vehicle_park[0].park.id : "",
                region: vehicle.vehicle_region && vehicle.vehicle_region[0] && vehicle.vehicle_region[0].region ? vehicle.vehicle_region[0].region.name : "",
                regionId: vehicle.vehicle_region && vehicle.vehicle_region[0] && vehicle.vehicle_region[0].region ? vehicle.vehicle_region[0].region.id : "",
            }
        })

        return { status: 200, data: vehiclesFormatted };
    } catch (error) {
        console.error("Error fetching vehicles:", error);
        return { status: 500, data: null };
    }
}
export async function getCountVehicles(searchQuery?: string, searchPark?: string, searchRegion?: string): Promise<{ status: number, data: any }> {

    const searchConditions = {}
    if ((searchQuery && searchQuery !== ""))
        // @ts-ignore
        searchConditions.OR = [
            { matricule: { contains: searchQuery } },
            { vin: { contains: searchQuery, mode: "insensitive" } },
            { brand: { contains: searchQuery,mode: "insensitive" } },
            { model: { contains: searchQuery,mode: "insensitive" } },
        ]
    if ((searchPark && searchPark !== "" && searchPark !== "0"))
        // @ts-ignore
        searchConditions.AND = [
            {
                vehicle_park: {
                    every: {
                        park: {
                            id: searchPark,
                        }
                    },
                    some: {
                        park: {
                            id: searchPark,
                        }
                    }
                }
            }
        ]
    if((searchRegion && searchRegion !== "" && searchRegion !== "0")) {
        // @ts-ignore
        if (!searchConditions.AND)
            // @ts-ignore
            searchConditions.AND = []
        // @ts-ignore
        searchConditions.AND.push(
            {
                vehicle_region: {
                    every: {
                        region: {
                            id: searchRegion,
                        }
                    },
                    some: {
                        region: {
                            id: searchRegion,
                        }
                    }
                }
            }
        )
    }

    const e = await getTranslations('Error');
    try {
        const vehicles = await prisma.vehicle.findMany({
            where: searchConditions,
            include: {
                vehicle_park: {
                    orderBy: {
                        added_at: 'desc',
                    },
                    include: {
                        park: true,
                    },
                    take: 1,
                },
                vehicle_region: {
                    orderBy: {
                        added_at: 'desc',
                    },
                    include: {
                        region: true,
                    },
                    take: 1,
                },
            }
        });

        return { status: 200, data: vehicles.length };
    } catch (error) {
        console.error("Error fetching count vehicles:", error);
        return { status: 500, data: null };
    }
}
export async function getVehiclesAll(): Promise<{ status: number, data: any }> {
    const e = await getTranslations('Error');
    try {
        const session = await verifySession();
        if (!session?.data?.user) {
            return { status: 401, data: { message: e("unauthorized") } };
        }
        const hasPermission = await withAuthorizationPermission(['vehicles_view'], session.data.user.id);

        if (hasPermission.status != 200 || !hasPermission.data.hasPermission) {
            return { status: 403, data: { message: e('forbidden') } };
        }

        const devices = await prisma.vehicle.findMany();

        return { status: 200, data: devices };
    } catch (error) {
        console.error("An error occurred in getVehiclesAll");
        return { status: 500, data: { message: e("error") } };
    }
}

export async function getVehiclesAllMatrciule(): Promise<{ status: number, data: any }> {
    const e = await getTranslations('Error');
    try {
        const session = await verifySession();
        if (!session?.data?.user) return { status: 401, data: { message: e("unauthorized") } };

        const hasPermission = await withAuthorizationPermission(['vehicles_view'], session.data.user.id);
        if (hasPermission.status != 200 || !hasPermission.data.hasPermission) return { status: 403, data: { message: e('forbidden') } };

        const vehicles = await prisma.vehicle.findMany({ select: { matricule: true } });
        const vehicleFormatted = vehicles.map((vehicle) => vehicle.matricule)

        return { status: 200, data: vehicleFormatted };
    } catch (error) {
        console.error("An error occurred in getVehiclesAllMatricles");
        return { status: 500, data: { message: e("error") } };
    }
}

export async function getVehicle(id: string): Promise<{ status: number, data: any }> {
    const e = await getTranslations('Error');
    try {
        const session = await verifySession();
        if (!session?.data?.user) {
            return { status: 401, data: { message: e("unauthorized") } };
        }
        const hasPermissionAdd = await withAuthorizationPermission(['vehicles_view'], session.data.user.id);

        if (hasPermissionAdd.status != 200 || !hasPermissionAdd.data.hasPermission) {
            return { status: 403, data: { message: e('forbidden') } };
        }
        const vehicle = await prisma.vehicle.findUnique({
            where: { id },
            select: {
                id: true,
                matricule: true,
                vin: true,
                brand: true,
                model: true,
                year: true,
                vehicle_park: {
                    orderBy: {
                        added_at: 'desc',
                    },
                    include: {
                        park: true,
                    },
                    take: 1,
                },
                vehicle_region: {
                    orderBy: {
                        added_at: 'desc',
                    },
                    include: {
                        region: true,
                    },
                    take: 1,
                },
            }
        });

        const vehicleFormatted = vehicle ? {
            id: vehicle.id,
            matricule: vehicle.matricule,
            vin: vehicle.vin,
            brand: vehicle.brand,
            model: vehicle.model,
            year: vehicle.year,
            park: vehicle.vehicle_park && vehicle.vehicle_park[0] && vehicle.vehicle_park[0].park ? vehicle.vehicle_park[0].park.name : "",
            parkId: vehicle.vehicle_park && vehicle.vehicle_park[0] && vehicle.vehicle_park[0].park ? vehicle.vehicle_park[0].park.id : "",
            region: vehicle.vehicle_region && vehicle.vehicle_region[0] && vehicle.vehicle_region[0].region ? vehicle.vehicle_region[0].region.name : "",
            regionId: vehicle.vehicle_region && vehicle.vehicle_region[0] && vehicle.vehicle_region[0].region ? vehicle.vehicle_region[0].region.id : "",
        } : null

        return { status: 200, data: vehicleFormatted };
    } catch (error) {
        console.error("An error occurred in getvehicle:", error);
        return { status: 500, data: { message: e("error") } };
    }
}

export async function getVehiclesWithIds(vehicleIds: string[]): Promise<{ status: number, data: any }> {

    const e = await getTranslations('Error');
    try {
        const session = await verifySession()
        if (!session || session.status != 200) return { status: 401, data: { message: e('unauthorized') } }

        const hasPermissionAdd = await withAuthorizationPermission(['vehicles_view']);

        if (hasPermissionAdd.status != 200 || !hasPermissionAdd.data.hasPermission) return { status: 403, data: { message: e('forbidden') } };

        const devices = await prisma.vehicle.findMany({
            where: { id: { in: vehicleIds, } },
        });

        return { status: 200, data: devices };
    } catch (error) {
        console.error("Error fetching getVehiclesWithIds:", error);
        return { status: 500, data: null };
    }
}

export async function getVehiclesMatriculeWithIds(vehicleIds: string[]): Promise<{ status: number, data: any }> {

    const e = await getTranslations('Error');
    try {
        const session = await verifySession()
        if (!session || session.status != 200) return { status: 401, data: { message: e('unauthorized') } }

        const hasPermissionAdd = await withAuthorizationPermission(['vehicles_view']);

        if (hasPermissionAdd.status != 200 || !hasPermissionAdd.data.hasPermission) return { status: 403, data: { message: e('forbidden') } };

        const vehicles = await prisma.vehicle.findMany({
            where: { id: { in: vehicleIds, } }, select: { matricule: true }
        });

        const vehiclesFormatted = vehicles.map((vehicle) => vehicle.matricule)

        return { status: 200, data: vehiclesFormatted };
    } catch (error) {
        console.error("Error fetching getVehiclesMatriclesWithIds:", error);
        return { status: 500, data: null };
    }
}

export async function getVehicleParks(id: string, page: number, pageSize: number): Promise<{ status: number, data: any, count: number }> {
    const e = await getTranslations('Error');
    try {
        const session = await verifySession();
        if (!session?.data?.user) {
            return { status: 401, data: { message: e("unauthorized") }, count: 0 };
        }
        const hasPermissionAdd = await withAuthorizationPermission(['vehicles_park_view'], session.data.user.id);

        if (hasPermissionAdd.status != 200 || !hasPermissionAdd.data.hasPermission) {
            return { status: 403, data: { message: e('forbidden') }, count: 0 };
        }
        const vehicle = await prisma.vehicle.findUnique({ where: { id } });

        if (!vehicle) {
            return { status: 404, data: null, count: 0 };
        }
        

        const vehicleParks = await prisma.vehicle_park.findMany({
            skip: (page - 1) * pageSize,
            take: 5,
            orderBy: {
                added_at: 'desc',
            },
            where: {
                vehicle_id: id,
            },
            include: {
                park: true,
                user: {
                    select: {
                        username: true,
                        firstname: true,
                        lastname: true,
                    }
                }
            },
        });

        const vehicleParksFormatted = vehicleParks.map((vehiclePark) => {
            return {
                id: vehiclePark.id,
                added_at: vehiclePark.added_at.getDate() + "/" + (vehiclePark.added_at.getMonth() + 1) + "/" + vehiclePark.added_at.getFullYear(),
                added_from: vehiclePark.user ? vehiclePark.user.firstname + " " + vehiclePark.user.lastname : "---",
                park: vehiclePark.park ? vehiclePark.park.name : "---",
                parkId: vehiclePark.park ? vehiclePark.park.id : "---",
            }
        })

        const vehicleParksCount = await prisma.vehicle_park.count({
            where: {
                vehicle_id: id,
            },
        });

        return { status: 200, data: vehicleParksFormatted, count: vehicleParksCount };
    } catch (error) {
        console.error("An error occurred in getVehicleParks:", error);
        return { status: 500, data: { message: e("error") }, count: 0 };
    }
}

export async function getVehicleRegions(id: string, page: number, pageSize: number): Promise<{ status: number, data: any, count: number }> {
    const e = await getTranslations('Error');
    try {
        const session = await verifySession();
        if (!session?.data?.user) {
            return { status: 401, data: { message: e("unauthorized") }, count: 0 };
        }
        const hasPermissionAdd = await withAuthorizationPermission(['vehicles_region_view'], session.data.user.id);

        if (hasPermissionAdd.status != 200 || !hasPermissionAdd.data.hasPermission) {
            return { status: 403, data: { message: e('forbidden') }, count: 0 };
        }
        const vehicle = await prisma.vehicle.findUnique({ where: { id } });

        if (!vehicle) {
            return { status: 404, data: null, count: 0 };
        }

        const vehicleRegions = await prisma.vehicle_region.findMany({
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: {
                added_at: 'desc',
            },
            where: {
                vehicle_id: id,
            },
            include: {
                region: true,
                user: {
                    select: {
                        username: true,
                        firstname: true,
                        lastname: true,
                    }
                }
            },
        });

        const vehicleRegionsFormatted = vehicleRegions.map((vehicleRegions) => {
            return {
                id: vehicleRegions.id,
                added_at: vehicleRegions.added_at.getDate() + "/" + (vehicleRegions.added_at.getMonth() + 1) + "/" + vehicleRegions.added_at.getFullYear(),
                added_from: vehicleRegions.user ? vehicleRegions.user.firstname + " " + vehicleRegions.user.lastname : "---",
                region: vehicleRegions.region ? vehicleRegions.region.name : "---",
                regionId: vehicleRegions.region ? vehicleRegions.region.id : "---",
            }
        })

        const vehicleRegionCount = await prisma.vehicle_region.count({
            where: {
                vehicle_id: id,
            },
        });

        return { status: 200, data: vehicleRegionsFormatted, count: vehicleRegionCount };
    } catch (error) {
        console.error("An error occurred in getVehicleRegion:", error);
        return { status: 500, data: { message: e("error") }, count: 0 };
    }
}