// Get all vehicles with clockings in supervisor's regions (with filters)
import { verifySession, withAuthorizationPermission } from "@/actions/permissions";
import { withAuth } from "@/actions/util/with-auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export const GET = withAuth(async (request, { user }) => {
    try {
        const session = await verifySession()
        if (session?.status != 200) {
            return NextResponse.json(
                { message: "Failed to fetch vehicles auth" },
                { status: 500 }
            );
        }
        // Get supervisor's regions
        const device = await prisma.device.findFirst({
            where: { user_id: session.data.user.id },
        });

        const hasPermissionAdd = await withAuthorizationPermission(['vehicles_view']);

        if ((!device?.park_id || device.type !== 2) && (hasPermissionAdd.status != 200 || !hasPermissionAdd.data.hasPermission)) {
            return NextResponse.json(
                { message: "No regions found for this supervisor" },
                { status: 404 }
            );
        }

        let whereClause
        if(device?.park_id){
            whereClause = {
                park_id: device.park_id,
            }
        }

        // Get vehicles
        const vehicles = await prisma.vehicle.findMany({
            where: whereClause,
            select: {
                id: true,
                matricule: true,
                brand: true,
                model: true,
                status: true,
                last_region: true,
            },
            orderBy: {
                created_at: "desc",
            },
            distinct: ["id"],
        });
        
        const filtredVehicles = vehicles.filter((vehicle) => {

            let status = "في الحظيرة"
            if(vehicle.status ==="exit_from_park"){
                status = "خرجت من الحظيرة"
            }else if(vehicle.status ==="enter_to_park"){
                status = "دخلت الحظيرة"
            }else if(vehicle.status ==="maintenance"){
                status = "في الصيانة"
            }else if(vehicle.status ==="enter_to_region"){
                status= "دخلت المنطقة"
            }else if(vehicle.status ==="exit_from_region"){
                status= "خرجت من المنطقة"
            }

            return {
                id: vehicle.id,
                matricule: vehicle.matricule,
                brand: vehicle.brand,
                model: vehicle.model,
                status: status,
            }
        });

        return NextResponse.json(
            {
                data: filtredVehicles,
            },
            { status: 200 }
        );
    } catch(error){
        return NextResponse.json(
            { message: "Failed to fetch vehicles" },
            { status: 500 }
        );
    }
});