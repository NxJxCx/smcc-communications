'use client'

import Image from "next/image";

export default function ThumbnailItem({ thumbnailSrc, department, label, onClick }: { thumbnailSrc: string; department: string|React.ReactNode; label: string|React.ReactNode; onClick: (e?: any) => void }) {
  return (
    <button type="button" onClick={onClick} className="text-center hover:bg-gray-400/10 p-1 rounded-lg">
      <div className="w-[61.82mm] h-[80mm] bg-white border mx-auto rounded mb-1 object-cover">
        <Image src={thumbnailSrc} className="object-cover" width={233.65} height={302.36} alt="thumbnail" />
      </div>
      <div>{department}</div>
      <div>{label}</div>
    </button>
  )
}