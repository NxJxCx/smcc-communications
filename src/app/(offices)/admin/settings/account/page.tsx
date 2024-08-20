import AccountSettingsPage from "@/app/_settings/account/component";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account Settings - Admin",
};

export default function Page() {
  return <AccountSettingsPage />
}