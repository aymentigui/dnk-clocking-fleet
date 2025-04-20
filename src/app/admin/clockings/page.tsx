import { accessPage, withAuthorizationPermission } from "@/actions/permissions";
import { getVehicle } from "@/actions/vehicle/get";
import { Card } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";
import ClockingList from "./_component/list-clockings";

export default async function Vehicle() {

    const translate = await getTranslations("Vehicle");


    const hasPermission = await withAuthorizationPermission(['clocking_view']);

    if (hasPermission.status != 200 || !hasPermission.data.hasPermission) {
        return (
            <>
            </>
        );
    }

    return (
        <Card className='mb-2 px-2 py-4'>
            <ClockingList />
        </Card>
    );
}