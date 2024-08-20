import { Metadata } from "next";
import UserAccountsPage from "./component";

export const metadata: Metadata = {
  title: "User Account Management - Admin",
};

export default function Page() {
  return <UserAccountsPage />
}