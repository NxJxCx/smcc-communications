import DepartmentTemplates from "@/app/(offices)/superadmin/_components/departmentTemplates";
import { DocumentType } from "@/lib/modelInterfaces";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Letter Templates"
};

export default function Page() {
  return <DepartmentTemplates doctype={DocumentType.Letter} />
}