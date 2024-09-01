import LetterInbox from '@/app/(offices)/admin/_components/memoLetterInbox';
import { DocumentType } from "@/lib/modelInterfaces";

type Params = {
  searchParams: { id: string }
}
export default function Page({ searchParams: { id }}: Params) {
  return <LetterInbox doctype={DocumentType.Letter} searchParam={id} />
}