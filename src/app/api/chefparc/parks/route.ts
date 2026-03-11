// Get all vehicles with clockings in supervisor's regions (with filters)
import {
  verifySession,
  withAuthorizationPermission,
} from "@/actions/permissions";
import { withAuth } from "@/actions/util/with-auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export const GET = withAuth(async (request, { user }) => {
  try {
    const session = await verifySession();
    if (session?.status != 200) {
      return NextResponse.json(
        { message: "Failed to fetch vehicles auth" },
        { status: 500 },
      );
    }

    const parks = await prisma.park.findMany({
      select: {
        id: true,
        name: true,
      },
    });

    return NextResponse.json(
      {
        data: parks,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch vehicles" },
      { status: 500 },
    );
  }
});
