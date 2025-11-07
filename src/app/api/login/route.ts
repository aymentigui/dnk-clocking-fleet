import { loginUser } from "@/actions/auth/auth";
import { encrypt } from "@/actions/util/util";
import { prisma } from "@/lib/db";
import { NextResponse, NextRequest } from "next/server";

export async function POST(request: NextRequest) {

    const data = await request.json();
    const { email, password } = data;
    
    const token = await loginUser({ email, password });
    if (!token || token.status !== 200) {
        return NextResponse.json({ message: "login failed" }, {
            status: 400,
        }
        );
    }

    const device = await prisma.device.findFirst({
        where: { user_id: token.data.id },
    });

    if (!device) {
        return NextResponse.json({ message: "login failed" }, {
            status: 400,
        });
    }

    const encryptData = encrypt(token);

    const response = NextResponse.json({ message: "login success", token: encryptData, type: device.type });
    return response;

}