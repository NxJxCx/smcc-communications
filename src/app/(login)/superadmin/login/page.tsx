import { Metadata } from "next"
import SuperAdminComponent from "./component"

export const metadata: Metadata = {
  title: "Super Admin Login",
}

export default function SuperAdminLoginPage() {
  return <SuperAdminComponent />
}