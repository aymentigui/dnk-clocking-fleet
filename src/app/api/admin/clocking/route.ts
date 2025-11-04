import { createClocking } from "@/actions/clocking/set";
import { withAuth } from "@/actions/util/with-auth";
import { NextResponse } from "next/server";

// const headersPost = {
//     "Access-Control-Allow-Origin": process.env.API_CORS_AUTORIZED ?? "http://localhost:3001",
//     "Access-Control-Allow-Methods": "POST",
//     'Access-Control-Allow-Credentials': 'true',
//     'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization'
// }

export const POST= withAuth(async (request, { user }) => {
    const data = await request.json();
    const res = await createClocking({ matricule: data.matricule, type: data.type, conducteur_id: data.conducteur_id });

    return NextResponse.json({ data: res }, { status: 200 });
});

// export async function OPTIONS() {
//     const response = NextResponse.json({ message: 'CORS preflight successful!' });
//     // Add CORS headers for preflight request
//     response.headers.set('Access-Control-Allow-Origin', process.env.API_CORS_AUTORIZED ?? "http://localhost:3001"); // Allow the frontend origin
//     response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS'); // Allow GET, POST, OPTIONS methods
//     response.headers.set('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization'); // Allow specific headers
//     response.headers.set('Access-Control-Allow-Credentials', 'true'); // Allow credentials if needed
//     return response;
// }