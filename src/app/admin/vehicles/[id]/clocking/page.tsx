import { accessPage, withAuthorizationPermission } from "@/actions/permissions";
import { getVehicle } from "@/actions/vehicle/get";
import { Card } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";

export default async function Vehicle({ params }: any) {

    const paramsID = await params;
    const translate = await getTranslations("Vehicle");

    if (!paramsID.id)
        return null

    const hasPermission = await withAuthorizationPermission(['vehicles_park_view']);

    if (hasPermission.status != 200 || !hasPermission.data.hasPermission) {
        return (
            <>
            </>
        );
    }

    return (
        <Card className='mb-2 px-2 py-4'>
            clocking
        </Card>
    );
}