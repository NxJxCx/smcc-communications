import { DocumentType, Roles } from "@/lib/modelInterfaces";
import { isObjectIdOrHexString } from "mongoose";
import { Metadata } from "next";
import Print from "./printPreview";

type Params = {
  searchParams: {
    doc: string|DocumentType
    role: string|Roles,
    id: string,
    title: string,
    isForIndividual?: string
  }
}

export const metadata: Metadata = {
  title: 'Print Preview'
}

export default async function Page({ searchParams: { role, id, doc, title, isForIndividual } }: Params) {
  if ([Roles.Admin, Roles.Faculty, Roles.SuperAdmin].includes(role as Roles) && isObjectIdOrHexString(id) && [DocumentType.Letter, DocumentType.Memo].includes(doc as DocumentType)) {
    return <Print role={role as Roles} id={id} doctype={doc} title={title} isForIndividual={isForIndividual === 'true'} />
  }
  return <div className="min-h-screen w-full">Invalid</div>
}