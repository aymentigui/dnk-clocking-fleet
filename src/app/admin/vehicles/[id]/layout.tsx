import { accessPage, verifySession } from "@/actions/permissions";
import { getVehicle } from "@/actions/vehicle/get";
import { Card } from "@/components/ui/card";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Vehicle",
};

export default async function RootLayout({
    children, params
}: Readonly<{
    children: React.ReactNode;
    params: any
}>) {

    const translate = await getTranslations("Vehicle");
    const paramsID = await params;

    if (!paramsID.id)
        return null

    await accessPage(['vehicles_update']);

    const vehicle = await getVehicle(paramsID.id);
    if (vehicle.status != 200 || !vehicle.data) {
        return (
            <Card className='p-4'>
                <div className="container mx-auto p-4">
                    <h1 className="text-2xl font-bold mb-4">{translate("vehiclenotfound")}</h1>
                </div>
            </Card>
        );
    }
    const data = vehicle.data;

    return (
        <>
            <Card className='px-16 py-8 mb-2'>
                <div className='flex flex-col'>
                    <div className="flex gap-2 bg-sidebar p-2">
                        <h2 className="font-semibold text-sidebar-foreground">{translate("matricule")}:</h2>
                        <p>{data.matricule}</p>
                    </div>
                    <div className="flex gap-2 p-2">
                        <h2 className="font-semibold text-sidebar-foreground">{translate("vin")}:</h2>
                        <p>{data.vin}</p>
                    </div>
                    <div className="flex gap-2 bg-sidebar p-2">
                        <h2 className="font-semibold text-sidebar-foreground">{translate("model")}:</h2>
                        <p>{data.model}</p>
                    </div>
                    <div className="flex gap-2 p-2">
                        <h2 className="font-semibold text-sidebar-foreground">{translate("brand")}:</h2>
                        <p>{data.brand}</p>
                    </div>
                    <div className="flex gap-2 bg-sidebar p-2">
                        <h2 className="font-semibold text-sidebar-foreground">{translate("year")}:</h2>
                        <p>{data.year}</p>
                    </div>
                    <div className="flex gap-2 p-2">
                        <h2 className="font-semibold text-sidebar-foreground">{translate("park")}:</h2>
                        <p>{data.park}</p>
                    </div>
                </div>
            </Card>
            <Card className='p-4'>
                <div className='flex flex-col gap-2'>
                    <div className="flex gap-2 px-6 mb-4">
                        <Link href={`/admin/vehicles/${paramsID.id}`} className="px-4 py-1 border border-foreground hover:bg-foreground hover:text-background rounded">
                            {translate("park")}
                        </Link>
                        <Link href={`/admin/vehicles/${paramsID.id}/clocking`} className="px-4 py-1 border-foreground hover:bg-foreground hover:text-background border rounded">
                            {translate("clocking")}
                        </Link>
                    </div>
                    {children}
                </div>
            </Card>
        </>
    );
}
