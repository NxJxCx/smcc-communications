import LetterInbox from '@/app/(offices)/admin/_components/memoLetterInbox';
import { DocumentType } from "@/lib/modelInterfaces";

export default function Page() {
  return <LetterInbox doctype={DocumentType.Letter} />
}