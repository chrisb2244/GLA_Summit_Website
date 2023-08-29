import { redirect } from "next/navigation"
import { currentWebsiteYear } from "@/lib/databaseModels"

const PresentationPage = () => {
  redirect(`/presentations/${currentWebsiteYear}`)
}

export default PresentationPage