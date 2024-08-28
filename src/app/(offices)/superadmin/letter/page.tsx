import AddLetterTemplate from "@/app/(offices)/superadmin/_components/addLetterTemplate";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Memorandum Templates"
};

export default function Page() {
  return (
    <div className="w-full">
      <AddLetterTemplate />
    </div>
  )
}