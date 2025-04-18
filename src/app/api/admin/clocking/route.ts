import { createClocking } from "@/actions/clocking/set";
import { NextRequest, NextResponse } from "next/server";

export async function OPTIONS(request: Request) {
    const response = NextResponse.json({ message: 'CORS preflight successful!' });
    // Add CORS headers for preflight request
    response.headers.set('Access-Control-Allow-Origin', process.env.API_CORS_AUTORIZED??"http://localhost:3001"); // Allow the frontend origin
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization');
    return response;
}

export async function POST(request: Request) {

    const { matricule, type } = await request.json();

    const res = await createClocking({ matricule, type })

    return NextResponse.json(
        { data: res },
        {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': process.env.API_CORS_AUTORIZED??"http://localhost:3001",
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization',
                'Content-Type': 'application/json',
            },
        }
    );
}