import { Metadata } from "next";
import AssignPage from "./component";

export const metadata: Metadata = {
  title: "Assign office user names to permits - Admin",
};

export default function Page() {
  return <AssignPage />
}