import { Metadata } from "next";
import DashboardPage from "./component";

export const metadata: Metadata = {
  title: "Dashboard - Admin",
};

export default function Page() {
  return <DashboardPage />
}