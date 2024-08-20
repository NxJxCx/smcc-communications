import ChangePasswordPage from "@/app/_settings/change/component";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Change Password - Admin",
};

export default function Page() {
  return <ChangePasswordPage />
}