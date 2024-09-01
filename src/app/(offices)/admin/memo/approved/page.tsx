import ApprovedMemorandumList from "@/app/(offices)/admin/_components/approvedMemoLetters";
import { DocumentType } from "@/lib/modelInterfaces";

export default function Page() {
  return <ApprovedMemorandumList doctype={DocumentType.Memo} />
}