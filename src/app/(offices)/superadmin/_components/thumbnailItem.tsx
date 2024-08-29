'use client'

import Image from "next/image";

function toDateString(date?: string): string {
  if (!date) {
    return ""
  }
  return (new Date(date)).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function ThumbnailItem({ thumbnailSrc, label, createdAt, updatedAt, onClick }: { thumbnailSrc: string; label: string|React.ReactNode; createdAt?: Date|string|null, updatedAt?: Date|string|null, onClick: (e?: any) => void }) {
  return (
    <button type="button" onClick={onClick} className="text-center hover:bg-gray-400/10 p-1 rounded-lg">
      <div className="w-[61.82mm] h-[80mm] bg-white border mx-auto rounded mb-1 object-cover">
        <Image src={thumbnailSrc} className="object-cover" width={233.65} height={302.36} alt="thumbnail" />
      </div>
      <div>{label}</div>
      <div>Created: {toDateString(createdAt as string|undefined)}</div>
      <div>Updated: {toDateString(updatedAt as string|undefined)}</div>
    </button>
  )
}