import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {

    // Récupérer matricule depuis les paramètres
    const matricule = request.nextUrl.searchParams.get("matricule");

    if (!matricule) {
        return NextResponse.json(
            { error: "Matricule is required" },
            { status: 400 }
        );
    }

    // Chercher conducteur
    const existingConducteur = await prisma.conducteur.findFirst({
        where: { matricule },
    });

    if (!existingConducteur) {
        return NextResponse.json(
            { error: "Conducteur not found" },
            { status: 404 }
        );
    }

    return NextResponse.json(existingConducteur);
}
