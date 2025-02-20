'use client';
import { ViewLayout } from "@/lib/types";
import clsx from "clsx";
import Image from "next/image";

function toDateString(date?: string): string {
  if (!date) {
    return ""
  }
  return (new Date(date)).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function ThumbnailItemWithDepartmentReceive({ layout, thumbnailSrc, department, label, isPreparedBy, createdAt, updatedAt, isRejected, preparedByMe, isPending, onClick, isRead }: { isPreparedBy: string, layout: ViewLayout, thumbnailSrc: string; department: string; label: string|React.ReactNode; createdAt?: Date|string|null, updatedAt?: Date|string|null, isRejected?: boolean, preparedByMe?: boolean, isPending?: boolean, onClick: (e?: any) => void, isRead?: boolean }) {
  return (<>
    {layout === "grid" && (
      <button type="button" onClick={onClick} className={clsx("text-center hover:bg-gray-400/10 p-1 rounded-lg", isRejected ? "bg-red-300 hover:bg-red-500" : preparedByMe ? "bg-sky-100 hover:bg-sky-300" : isPending ? "bg-yellow-100 hover:bg-yellow-300" : isRead ? "bg-green-100 hover:bg-green-300" : "bg-white")}>
        <div className={clsx("w-[61.82mm] h-[80mm] border mx-auto rounded mb-1 object-cover", isRejected ? "bg-red-300": preparedByMe ? "bg-sky-100" : isPending ? "bg-yellow-100" : "bg-white")}>
          <Image src={thumbnailSrc} className="object-cover" width={233.65} height={302.36} alt="thumbnail" />
        </div>
        <div className="font-[500]">{label}</div>
        <div className="italic">{department || "For Individual"}</div>
        <div className="italic">Prepared By: {isPreparedBy}</div>
        <div>Created: {toDateString(createdAt as string|undefined)}</div>
      </button>
    )}
    {layout === "list" && (
        <button type="button" onClick={onClick} className={clsx("break-all hover:bg-gray-400/10 px-3 py-1 rounded-lg grid grid-cols-5 text-left items-center w-full", isRejected ? "bg-red-300 hover:bg-red-500" : preparedByMe ? "bg-sky-100 hover:bg-sky-300" : isPending ? "bg-yellow-100 hover:bg-yellow-300" : "bg-white")}>
          <div className="font-[500]">
            <div className={clsx("w-[20px] h-[20px] border inline-flex object-cover mr-2", isRejected ? "bg-red-300": preparedByMe ? "bg-sky-100" : isPending ? "bg-yellow-100" : "bg-white")}>
              <Image src={thumbnailSrc} className="object-cover" width={20} height={20} alt="thumbnail" />
            </div>
            <span>{label}</span>
          </div>
          <div className="italic text-xs">Prepared By: {isPreparedBy}</div>
          <div className="italic">{department || "For Individual"}</div>
          <div className="text-xs text-right">{toDateString(createdAt as string|undefined)}</div>
        </button>
      )}
  </>);
}