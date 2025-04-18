import { createClocking } from "@/actions/clocking/set";
import { NextRequest, NextResponse } from "next/server";

const headersPost = {
    "Access-Control-Allow-Origin": process.env.API_CORS_AUTORIZED??"http://localhost:3001",
    "Access-Control-Allow-Methods": "POST",
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization'
}

export async function POST(request: Request) {

    const { matricule, type } = await request.json();

    const res = await createClocking({ matricule, type })

    return NextResponse.json(
        { data: res },
        {
            status: 200,
            headers: headersPost
        }
    );
}

export async function OPTIONS() {
    const response = NextResponse.json({ message: 'CORS preflight successful!' });
    // Add CORS headers for preflight request
    response.headers.set('Access-Control-Allow-Origin', process.env.API_CORS_AUTORIZED??"http://localhost:3001"); // Allow the frontend origin
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS'); // Allow GET, POST, OPTIONS methods
    response.headers.set('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization'); // Allow specific headers
    response.headers.set('Access-Control-Allow-Credentials', 'true'); // Allow credentials if needed
    return response;
}