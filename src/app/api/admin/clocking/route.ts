import { createClocking } from "@/actions/clocking/set";
import { NextResponse } from "next/server";

export async function POST(request: Request) {

    const { matricule, type } = await request.json();

    const res=await createClocking({ matricule, type })

    return NextResponse.json(res);
}