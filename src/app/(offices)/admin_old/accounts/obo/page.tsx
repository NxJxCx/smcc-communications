import { Metadata } from "next";
import OBOAccountsPage from "./component";

export const metadata: Metadata = {
  title: "OBO Account Management - Admin",
};

export default function Page() {
  return <OBOAccountsPage />
}