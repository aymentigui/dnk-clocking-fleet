import type { NextRequest } from "next/server"
import { PrismaClient } from "@prisma/client"
import { sendEmail } from "@/actions/email"

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
    // Vérification de sécurité pour le cron job
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response("Non autorisé", {
            status: 401,
        })
    }

    try {
        // Définir la période d'analyse (jour précédent)
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        yesterday.setHours(0, 0, 0, 0)

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // Récupérer tous les véhicules
        const allVehicles = await prisma.vehicle.findMany({
            where: {
                deleted_at: null,
            },
            include: {
                clocking: {
                    where: {
                        created_at: {
                            gte: yesterday,
                            lt: today,
                        },
                    },
                },
            },
        })

        // 1. Véhicules sans pointage dans la journée
        const vehiclesWithoutClocking = allVehicles.filter((vehicle) => vehicle.clocking.length === 0)

        // 2. Véhicules avec pointage de type 0 ou 1 plusieurs fois
        const vehiclesWithMultipleClockings = allVehicles.filter((vehicle) => {
            const type0Clockings = vehicle.clocking.filter((c) => c.type === 0)
            const type1Clockings = vehicle.clocking.filter((c) => c.type === 1)
            return type0Clockings.length > 1 || type1Clockings.length > 1
        })

        // 3. Véhicules avec pointage de type 0 mais pas de type 1
        const vehiclesWithType0WithoutType1 = allVehicles.filter((vehicle) => {
            const hasType0 = vehicle.clocking.some((c) => c.type === 0)
            const hasType1 = vehicle.clocking.some((c) => c.type === 1)
            return hasType0 && !hasType1
        })

        // 4. Véhicules avec pointage de type 0 et 1 mais pas de type 3
        const vehiclesWithType0And1WithoutType3 = allVehicles.filter((vehicle) => {
            const hasType0 = vehicle.clocking.some((c) => c.type === 0)
            const hasType1 = vehicle.clocking.some((c) => c.type === 1)
            const hasType3 = vehicle.clocking.some((c) => c.type === 3)
            return hasType0 && hasType1 && !hasType3
        })

        // 5. Véhicules avec pointage de type 1 mais pas de type 0
        const vehiclesWithType1WithoutType0 = allVehicles.filter((vehicle) => {
            const hasType0 = vehicle.clocking.some((c) => c.type === 0)
            const hasType1 = vehicle.clocking.some((c) => c.type === 1)
            return !hasType0 && hasType1
        })

        // 6. Véhicules avec pointage de type 3 mais pas de type 0 ou 1
        const vehiclesWithType3WithoutType0Or1 = allVehicles.filter((vehicle) => {
            const hasType0 = vehicle.clocking.some((c) => c.type === 0)
            const hasType1 = vehicle.clocking.some((c) => c.type === 1)
            const hasType3 = vehicle.clocking.some((c) => c.type === 3)
            return hasType3 && !hasType0 && !hasType1
        })

        // Préparer les résultats
        const analysisResults = {
            date: yesterday.toISOString().split("T")[0],
            vehiclesWithoutClocking: vehiclesWithoutClocking.map((v) => ({
                id: v.id,
                matricule: v.matricule,
                model: v.model,
                brand: v.brand,
            })),
            vehiclesWithMultipleClockings: vehiclesWithMultipleClockings.map((v) => ({
                id: v.id,
                matricule: v.matricule,
                model: v.model,
                brand: v.brand,
                clockings: v.clocking.map((c) => ({
                    type: c.type,
                    created_at: c.created_at,
                })),
            })),
            vehiclesWithType0WithoutType1: vehiclesWithType0WithoutType1.map((v) => ({
                id: v.id,
                matricule: v.matricule,
                model: v.model,
                brand: v.brand,
            })),
            vehiclesWithType0And1WithoutType3: vehiclesWithType0And1WithoutType3.map((v) => ({
                id: v.id,
                matricule: v.matricule,
                model: v.model,
                brand: v.brand,
            })),
            vehiclesWithType1WithoutType0: vehiclesWithType1WithoutType0.map((v) => ({
                id: v.id,
                matricule: v.matricule,
                model: v.model,
                brand: v.brand,
            })),
            vehiclesWithType3WithoutType0Or1: vehiclesWithType3WithoutType0Or1.map((v) => ({
                id: v.id,
                matricule: v.matricule,
                model: v.model,
                brand: v.brand,
            })),
        }

        // Afficher les résultats dans la console
        // console.log("=== ANALYSE QUOTIDIENNE DES VÉHICULES ===")
        // console.log(`Date d'analyse: ${analysisResults.date}`)
        // console.log("\n1. Véhicules sans pointage:")
        // console.log(`Total: ${analysisResults.vehiclesWithoutClocking.length}`)
        // console.log(analysisResults.vehiclesWithoutClocking)

        // console.log("\n2. Véhicules avec pointages multiples de type 0 ou 1:")
        // console.log(`Total: ${analysisResults.vehiclesWithMultipleClockings.length}`)
        // console.log(analysisResults.vehiclesWithMultipleClockings)

        // console.log("\n3. Véhicules avec pointage type 0 sans type 1:")
        // console.log(`Total: ${analysisResults.vehiclesWithType0WithoutType1.length}`)
        // console.log(analysisResults.vehiclesWithType0WithoutType1)

        // console.log("\n4. Véhicules avec pointage type 0 et 1 sans type 3:")
        // console.log(`Total: ${analysisResults.vehiclesWithType0And1WithoutType3.length}`)
        // console.log(analysisResults.vehiclesWithType0And1WithoutType3)

        // console.log("\n5. Véhicules avec pointage type 1 sans type 0:")
        // console.log(`Total: ${analysisResults.vehiclesWithType1WithoutType0.length}`)
        // console.log(analysisResults.vehiclesWithType1WithoutType0)

        // console.log("\n6. Véhicules avec pointage type 3 sans type 0 ou 1:")
        // console.log(`Total: ${analysisResults.vehiclesWithType3WithoutType0Or1.length}`)
        // console.log(analysisResults.vehiclesWithType3WithoutType0Or1)

        // Vous pourriez également sauvegarder ces résultats dans une base de données

        const title = `Analyse quotidienne des véhicules du ${new Date().toLocaleDateString()}`
        const content = `Analyse quotidienne des véhicules du ${new Date().toLocaleDateString()}
\n1. Véhicules avec pointages multiples de type 0 ou 1: \tTotal: ${analysisResults.vehiclesWithMultipleClockings.length} \n${analysisResults.vehiclesWithMultipleClockings.map((v) => `\t${v.matricule}  - ${v.brand} \t${v.clockings.map((c) => `\t\tType ${c.type} - ${c.created_at}`).join("\n\t")} `).join("\n\t")}
\n2. Véhicules avec pointage de sortie sans entree: \tTotal: ${analysisResults.vehiclesWithType0WithoutType1.length} \n${analysisResults.vehiclesWithType0WithoutType1.map((v) => `\t${v.matricule} - ${v.brand}`).join("\n\t")}
\n3. Véhicules avec pointage de sortie et entree sans pointage controlle: \tTotal: ${analysisResults.vehiclesWithType0And1WithoutType3.length} \n${analysisResults.vehiclesWithType0And1WithoutType3.map((v) => `\t${v.matricule} - ${v.brand}`).join("\n\t")}
\n4. Véhicules avec pointage entree sans sortie :\tTotal: ${analysisResults.vehiclesWithType1WithoutType0.length} \n${analysisResults.vehiclesWithType1WithoutType0.map((v) => `\t${v.matricule} - ${v.brand}`).join("\n\t")}
\n5. Véhicules avec pointage controlle sans pointage entree et sortie : \tTotal: ${analysisResults.vehiclesWithType3WithoutType0Or1.length} \n${analysisResults.vehiclesWithType3WithoutType0Or1.map((v) => `\t${v.matricule} - ${v.brand}`).join("\n\t")}
\n6. Véhicules sans pointage: \tTotal: ${analysisResults.vehiclesWithoutClocking.length}  \n${analysisResults.vehiclesWithoutClocking.map((v) => `\t${v.matricule} - ${v.brand}`).join("\n\t")}`


        await prisma.notification.create({
            data: {
                title: title,
                contenu: content
            }
        })

        const emails = await prisma.user.findMany({ where: { is_admin: true } })

        await Promise.all(
            emails.map(async (email) => {
                if (email.email) {
                    try {
                        await sendEmail(
                            email.email,
                            title,
                            `<!DOCTYPE html>
                                <html lang="en">
                                <head>
                                    <meta charset="UTF-8">
                                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                    <title>Analyse quotidienne des véhicules</title>
                                </head>
                                <body>
                                    <pre>${content}</pre>
                                </body>
                                </html>`
                        )
                    } catch (erreur) {
                        console.log("error sendig mail analyse to" + email.email)
                    }
                }
            })
        )
        // ou les envoyer par email

        return Response.json({
            success: true,
            message: "Analyse quotidienne terminée",
            summary: {
                vehiclesWithoutClocking: vehiclesWithoutClocking.length,
                vehiclesWithMultipleClockings: vehiclesWithMultipleClockings.length,
                vehiclesWithType0WithoutType1: vehiclesWithType0WithoutType1.length,
                vehiclesWithType0And1WithoutType3: vehiclesWithType0And1WithoutType3.length,
                vehiclesWithType1WithoutType0: vehiclesWithType1WithoutType0.length,
                vehiclesWithType3WithoutType0Or1: vehiclesWithType3WithoutType0Or1.length,
            },
        })
    } catch (error) {
        console.error("Erreur lors de l'analyse quotidienne:", error)
        return Response.json(
            {
                success: false,
                error: "Une erreur est survenue lors de l'analyse",
            },
            { status: 500 },
        )
    } finally {
        await prisma.$disconnect()
    }
}
