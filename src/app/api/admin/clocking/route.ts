import { createClocking } from "@/actions/clocking/set";
import { NextResponse } from "next/server";

export async function POST(request: Request) {

    const { matricule, type } = await request.json();

    const res=await createClocking({ matricule, type })

    return NextResponse.json(res
        , {
            status: res.status,
            headers: {
                'Access-Control-Allow-Origin': 'http://localhost:3001',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization',
                'Content-Type': 'application/json',
            },
        }
    );
}