import { Metadata } from "next";
import MPDCAccountsPage from "./component";

export const metadata: Metadata = {
  title: "MPDC Account Management - Admin",
};

export default function Page() {
  return <MPDCAccountsPage />
}