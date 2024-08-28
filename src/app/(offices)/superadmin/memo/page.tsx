import AddMemoTemplate from "@/app/(offices)/superadmin/_components/addMemoTemplate";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Memorandum Templates"
};

export default function Page() {
  return (
    <div className="w-full">
      <AddMemoTemplate />
    </div>
  )
}