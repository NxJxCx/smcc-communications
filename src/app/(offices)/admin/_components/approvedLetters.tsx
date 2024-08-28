'use client'

import { RefreshIcon } from "evergreen-ui"
import ThumbnailItem from "./thumbnailItem"

export default function ApprovedLettersList() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-[500]">Approved Letter List</h1>
      <div className="mt-3 flex flex-col lg:flex-row lg:flex-betweeen flex-wrap w-full min-w-[300px] lg:min-w-[800px] bg-white p-4 rounded-t-lg">
        <div className="flex flex-wrap">
          <label htmlFor="searchMemo" className="font-[500] mr-2 items-center flex">Search:</label>
          <input type="search" id="searchMemo" placeholder="Search Memorandum" className="border-2 max-w-64 border-gray-300 px-2 py-1 rounded" />
        </div>
        <div className="flex mt-2 lg:mt-0 lg:justify-end flex-grow pr-2 lg:pr-0">
          <button type="button" title="Refresh List" className="max-w-32 aspect-square p-1 rounded border border-blue-900 flex items-center justify-center text-blue-900 bg-white hover:bg-blue-200/50"><RefreshIcon /></button>
        </div>
      </div>
      <div className="min-h-[200px] min-w-[300px] bg-white w-full p-4 lg:min-w-[800px]">
        <div className="border min-w-[300px] rounded-md p-2 lg:min-w-[780px]">
          <div className="p-3 grid grid-cols-1 lg:grid-cols-3 lg:min-w-[750px] gap-3">
            <ThumbnailItem thumbnailSrc="/thumbnail-document.png" department="CCIS"  label="M.O # 3" onClick={() => {}} />
            <ThumbnailItem thumbnailSrc="/thumbnail-document.png" department="CCIS"  label="M.O # 3" onClick={() => {}} />
          </div>
        </div>
      </div>
    </div>
  )
}