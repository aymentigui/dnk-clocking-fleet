import { accessPage } from "@/actions/permissions";
import { ParkForm } from "../_component/ParkForm";

export default async function NewParkPage() {

    await accessPage(["park_create"])

    return <ParkForm mode="create" />;
}