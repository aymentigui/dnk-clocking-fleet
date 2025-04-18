import { loginUser } from "@/actions/auth/auth";
import { prisma } from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers" 

const headersPost = {
    "Access-Control-Allow-Origin": process.env.API_CORS_AUTORIZED ?? "http://localhost:3001",
    "Access-Control-Allow-Methods": "POST",
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization'
}

export async function POST(request: NextRequest) {

    const data = await request.json();
    const { email, password } = data;
    const cookiesReq = request.cookies;
    const cookieStore = cookies();
    const deviceType = (await cookieStore).get('type')?.value
    console.log("deviceType",deviceType)


    const token = await loginUser({ email, password });
    // console.log(token)

    if (!token || token.status !== 200) {
        return NextResponse.json({ message: "login failed" }, {
            status: 401,
            headers: headersPost
        }
        );
    }

    const device = await prisma.device.findFirst({
        where: { user_id: token.data.id },
    });

    if (!device) {
        return NextResponse.json({ message: "login failed" }, {
            status: 401,
            headers: headersPost
        });
    }

    const response = NextResponse.json({ message: "login success", userId: token.data.id, type: device.type }, {
        headers: headersPost
    });
    return response;

}


export async function OPTIONS() {
    const response = NextResponse.json({ message: 'CORS preflight successful!' });
    // Add CORS headers for preflight request
    response.headers.set('Access-Control-Allow-Origin', process.env.API_CORS_AUTORIZED ?? "http://localhost:3001"); // Allow the frontend origin
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS'); // Allow GET, POST, OPTIONS methods
    response.headers.set('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization'); // Allow specific headers
    response.headers.set('Access-Control-Allow-Credentials', 'true'); // Allow credentials if needed
    return response;
}