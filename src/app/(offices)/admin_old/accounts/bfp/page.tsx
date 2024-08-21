import { Metadata } from "next";
import BFPAccountsPage from "./component";

export const metadata: Metadata = {
  title: "BFP Account Management - Admin",
};

export default function Page() {
  return <BFPAccountsPage />
}