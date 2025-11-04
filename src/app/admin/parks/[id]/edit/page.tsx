import { accessPage } from "@/actions/permissions";
import { ParkForm } from "../../_component/ParkForm";


export default async function EditParkPage({ params }: any) {

  const paramsId = await params

  await accessPage(["park_update"])


  return <ParkForm mode="edit" parkId={paramsId.id} />;
}