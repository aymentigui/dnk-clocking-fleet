// lib/with-auth.ts
import { NextResponse } from "next/server";
import authContext from "@/context/auth-context";
import { decrypt } from "@/actions/util/util";

type AuthedCtx<User = any> = { user: User };

export function withAuth<User = any>(
    handler: (req: Request, ctx: AuthedCtx<User>) => Promise<Response> | Response
) {
    return async (req: Request) => {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Token manquant" }, { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        const decoded = decrypt(token) as User | null;

        if (!decoded) {
            return NextResponse.json({ error: "Token invalide" }, { status: 401 });
        }

        // Exécuter le handler dans le contexte utilisateur
        return authContext.run({ user: decoded }, async () => {
            return handler(req, { user: decoded });
        });
    };
}
