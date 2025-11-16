import { createClocking } from "@/actions/clocking/set";
import { withAuth } from "@/actions/util/with-auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";


export async function GET(request: NextRequest) {
    const data = await request.json();
    const existingConducteur = await prisma.conducteur.findFirst({
        where: { matricule: data.matricule },
    });

    if (!existingConducteur) {
        return NextResponse.json({ error: "Conducteur not found" }, { status: 404 });
    }

    return NextResponse.json({ conducteur: existingConducteur });
};
