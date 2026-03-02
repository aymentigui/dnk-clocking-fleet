import { Edit} from "@/actions/global-etat/functions";
import { withAuth } from "@/actions/util/with-auth";
import { NextResponse } from "next/server";

export const POST= withAuth(async (request, { user }) => {
    const data = await request.json();
    const res= await Edit(data)
    return NextResponse.json({ data: res.data }, { status: res.status });
});
