import { createClocking } from "@/actions/clocking/set";
import { withAuth } from "@/actions/util/with-auth";
import { NextResponse } from "next/server";


export const POST= withAuth(async (request, { user }) => {
    const data = await request.json();
    const res = await createClocking({ matricule: data.matricule, type: Number(data.type??0), conducteur_matricule: data.conducteur_matricule });
    return NextResponse.json({ data: res.data }, { status: res.status });
});
