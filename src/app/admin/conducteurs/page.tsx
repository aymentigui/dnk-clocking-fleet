import { accessPage } from "@/actions/permissions";
import ConducteursPage from "./_componenets/my-page";

export default async function NewParkPage() {

    await accessPage(["conducteur_create"])

    return <ConducteursPage />;
}