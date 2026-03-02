import { getClockingsChefParc } from "@/actions/clocking/get";
import { createClocking } from "@/actions/clocking/set";
import { withAuth } from "@/actions/util/with-auth";
import { NextResponse } from "next/server";


export const GET= withAuth(async (request, { user }) => {
    const { searchParams } = new URL(request.url);
    
    // Définir les valeurs par défaut et valider
    const page = searchParams.get("page") ? Number(searchParams.get("page") ): 1;
    const pageSize = searchParams.get("pageSize") ? Number(searchParams.get("pageSize") ): 20;
    const searchDate = searchParams.get("searchDate") ?? undefined;
    const type = searchParams.get("type") ? Number(searchParams.get("type"))  : undefined;
    const status = searchParams.get("status") ? Number(searchParams.get("status")) :  undefined;

    const res = await getClockingsChefParc(
        page,
        pageSize,
        searchDate,
        type,
        status
    )
    return NextResponse.json({ data: res.data }, { status: res.status });
});


export const POST= withAuth(async (request, { user }) => {
    const data = await request.json();
    const res = await createClocking({ matricule: data.matricule, type: Number(data.type??0), conducteur_matricule: data.conducteur_matricule });
    return NextResponse.json({ data: res.data }, { status: res.status });
});
