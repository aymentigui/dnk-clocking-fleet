import { loginUser } from "@/actions/auth/auth";
import { verifySession } from "@/actions/permissions";
import { NextResponse, NextRequest } from "next/server";

const headersGet = {
    "Access-Control-Allow-Origin": "http://localhost:3001",
    "Access-Control-Allow-Methods": "GET",
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization'
}

const headersPost = {
    "Access-Control-Allow-Origin": "http://localhost:3001",
    "Access-Control-Allow-Methods": "POST",
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization'
}

export async function GET(request: NextRequest) {

    const token = await loginUser({ email: "admin@admin.com", password: "test123" });
    // console.log(token)

    if (token.status === 200) {
        const response = NextResponse.json({ message: "login success", userId: token.data.id, }, {
            headers:headersGet
        });
        return response;
    } else {
        return NextResponse.json({ message: "login failed" }, {
            status: 401,
            headers:headersGet
        }
        );
    }
}


export async function POST(request: NextRequest) {
    console.log(1)

    const verify = await verifySession()
    console.log("verify", verify)

    const body = await request.json();
    const { name, description } = body;
    console.log("name", name);

    return NextResponse.json({ message: "test2" }, {
        headers:headersPost
    });
}



export async function OPTIONS() {
    const response = NextResponse.json({ message: 'CORS preflight successful!' });
    // Add CORS headers for preflight request
    response.headers.set('Access-Control-Allow-Origin', "http://localhost:3001"); // Allow the frontend origin
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'); // Allow GET, POST, OPTIONS methods
    response.headers.set('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization'); // Allow specific headers
    response.headers.set('Access-Control-Allow-Credentials', 'true'); // Allow credentials if needed
    return response;
}