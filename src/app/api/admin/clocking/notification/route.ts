import { createNotificationBadClocking } from "@/actions/clocking/set";
import { withAuth } from "@/actions/util/with-auth";
import { NextResponse } from "next/server";


export const POST = withAuth(async (request, { user }) => {
    const data = await request.json();
    await createNotificationBadClocking( data.existingVehicle);
    return NextResponse.json({ success: true });
});
