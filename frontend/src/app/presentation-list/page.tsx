import { redirect } from "next/navigation"
import { currentWebsiteYear } from "@/lib/databaseModels"

const PresentationPage = () => {
  redirect(`/presentation-list/${currentWebsiteYear}`)
}

export default PresentationPage