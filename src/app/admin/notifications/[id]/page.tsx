import { getNotification } from "@/actions/notification/get";
import { accessPage, withAuthorizationPermission } from "@/actions/permissions";
import { Card } from "@/components/ui/card";

export default async function Vehicle({ params }: any) {

    const paramsID = await params;

    if (!paramsID.id)
        return null


    const hasPermission = await withAuthorizationPermission(['notifications_view']);

    if (hasPermission.status != 200 || !hasPermission.data.hasPermission) {
        return (
            <>
            </>
        );
    }
    const res = await getNotification(paramsID.id)
    if (res.status != 200 || !res.data) {
        return (
            <>
            </>
        );
    }

    return (
        <Card className='mb-2 p-4 space-y-4'>
            <div className="flex justify-between items-center">
                <h1 className="text-xl px-8 font-bold">{res.data.title}</h1>
                <p>{res.data.created_at}</p>
            </div>
            <pre className="border rounded-lg p-4">{res.data.contenu}</pre>
        </Card>
    );
}