import { redirect } from "next/navigation"
import { currentDisplayYear } from "@/lib/databaseModels"

const PresentationPage = () => {
  redirect(`/presentation-list/${currentDisplayYear}`)
}

export default PresentationPage