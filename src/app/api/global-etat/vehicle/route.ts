import { getVehicleData } from "@/actions/global-etat/functions";
import { withAuth } from "@/actions/util/with-auth";
import { NextResponse } from "next/server";

export const GET= withAuth(async (request, { user }) => {
    const { searchParams } = new URL(request.url);
    
    // Définir les valeurs par défaut et valider
    const matricule = searchParams.get("matricule");

    const res= await getVehicleData(matricule)

    return NextResponse.json({ data: res.data }, { status: res.status });
});