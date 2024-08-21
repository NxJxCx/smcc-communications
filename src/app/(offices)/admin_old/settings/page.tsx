import AccountsPage from "@/app/_settings/component";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings - Admin",
};

export default function Page() {
  return <AccountsPage />
}