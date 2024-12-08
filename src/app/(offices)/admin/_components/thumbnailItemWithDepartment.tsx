'use client';
import clsx from "clsx";
import Image from "next/image";

function toDateString(date?: string): string {
  if (!date) {
    return ""
  }
  return (new Date(date)).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function ThumbnailItemWithDepartment({ thumbnailSrc, department, label, createdAt, updatedAt, isRejected, preparedByMe, isPending, series, onClick }: { thumbnailSrc: string; department: string; label: string|React.ReactNode; createdAt?: Date|string|null, updatedAt?: Date|string|null, isRejected?: boolean, preparedByMe?: boolean, isPending?: boolean, series?: string, onClick: (e?: any) => void }) {
  return (
    <button type="button" onClick={onClick} className={clsx("text-center hover:bg-gray-400/10 p-1 rounded-lg", isRejected ? "bg-red-300 hover:bg-red-500" : preparedByMe ? "bg-sky-100 hover:bg-sky-300" : isPending ? "bg-yellow-100 hover:bg-yellow-300" : "bg-white")}>
      <div className={clsx("w-[61.82mm] h-[80mm] border mx-auto rounded mb-1 object-cover", isRejected ? "bg-red-300": preparedByMe ? "bg-sky-100" : isPending ? "bg-yellow-100" : "bg-white")}>
        <Image src={thumbnailSrc} className="object-cover" width={233.65} height={302.36} alt="thumbnail" />
      </div>
      <div className="font-[500]">{label}</div>
      <div className="italic">{department || "For Individual"}</div>
      {!!series && (<div className="italic">Series: {series}</div>)}
      <div>Created: {toDateString(createdAt as string|undefined)}</div>
      <div>Updated: {toDateString(updatedAt as string|undefined)}</div>
    </button>
  )
}