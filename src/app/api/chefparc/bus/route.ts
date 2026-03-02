// Get all vehicles with clockings in supervisor's regions (with filters)
import { verifySession, withAuthorizationPermission } from "@/actions/permissions";
import { withAuth } from "@/actions/util/with-auth";
import { getPositionVehicle } from "@/actions/vehicle/get";
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
        
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if(!id){
            return NextResponse.json(
                { message: "Vehicle ID is required" },
                { status: 400 }
            );
        }

        const vehicle = await prisma.vehicle.findUnique({
            where: { id },
        });

        if(!vehicle){
            return NextResponse.json(
                { message: "Vehicle not found" },
                { status: 404 }
            );
        }

        if(device?.park_id){
            if(vehicle.park_id !== device.park_id){
                return NextResponse.json(
                    { message: "Vehicle not found" },
                    { status: 404 }
                );
            }   
        }

        const startOfDay = new Date(`${new Date().toISOString().split('T')[0]}T00:00:00`);
        const endOfDay = new Date(`${new Date().toISOString().split('T')[0]}T23:59:59`);

        // Get clockings
        const clockings = await prisma.clocking.findMany({
            where: { 
                vehicle_id: vehicle.id,
                created_at: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
             },
             include: {
                region: true,
                park: true,
             },
            orderBy: { created_at: "desc" },
        });

        const filtredClockings = clockings.map((clocking) => {
            return {
                id: clocking.id,
                vehicle_id: clocking.vehicle_id,
                region: clocking.region?.name,
                park: clocking.park?.name,
                status: clocking.type===0?"خرجت من الحظيرة": clocking.type===1?"دخلت الحظيرة": clocking.type===3? "خرجت من المنطقة": clocking.type===4? "دخلت المنطقة": clocking.type===5? "في الصيانة": "في الحظيرة",
                conducteur: clocking.conducteur_name,
                created_at: clocking.created_at,
            }
        });
        
        const position = await getPositionVehicle(vehicle.id);
        let pos= null
        if(position.status === 200){
            pos= position.data
        }

        const vehicleFiltred= {
            brand: vehicle.brand,
            model: vehicle.model,
            matricule: vehicle.matricule,
            year: vehicle.year,
            status: vehicle.status,
            position: pos,
            clockings: filtredClockings,
        }

        return NextResponse.json(
            {
                data: vehicleFiltred,
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