import { Metadata } from "next";
import AccountsPage from "./component";

export const metadata: Metadata = {
  title: "Account Management - Admin",
};

export default function Page() {
  return <AccountsPage />
}