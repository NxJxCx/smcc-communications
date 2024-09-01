'use client';;
import { approveMemorandumLetter, rejectMemorandumLetter } from "@/actions/admin";
import LoadingComponent from "@/components/loading";
import OCSModal from "@/components/ocsModal";
import ParseHTMLTemplate from "@/components/parseHTML";
import { DepartmentDocument, DocumentType, LetterDocument, MemoDocument, Roles } from "@/lib/modelInterfaces";
import clsx from "clsx";
import { ConfirmIcon, CrossIcon, RefreshIcon, toaster, } from "evergreen-ui";
import { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import ThumbnailItemWithDepartment from "./thumbnailItemWithDepartment";

export default function MemoLetterInbox({ doctype }: Readonly<{ doctype: DocumentType }>) {
  const [data, setData] = useState<(MemoDocument & { isPreparedByMe: boolean; isPending: boolean; isRejected: boolean; })[]|(LetterDocument & { isPreparedByMe: boolean; isPending: boolean; isRejected: boolean; })[]>([]);
  const [showRejected, setShowRejected] = useState(false);
  const [showPreparedByMe, setShowPreparedByMe] = useState(false);
  const [showPending, setShowPending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedMemo, setSelectedMemo] = useState<(MemoDocument|LetterDocument) & { isPreparedByMe: boolean; isPending: boolean; isRejected: boolean; }>();
  const isRejectedMemo = useMemo(() => selectedMemo && selectedMemo.isRejected, [selectedMemo])
  const isPreparedByMe = useMemo(() => selectedMemo && selectedMemo.isPreparedByMe, [selectedMemo])
  const isPending = useMemo(() => selectedMemo && selectedMemo.isPending, [selectedMemo])

  const filteredData = useMemo(() => {
    let filtered = data;
    if (!showRejected) {
      filtered = filtered.filter((doc) => !doc.isRejected)
    }
    if (!showPreparedByMe) {
      filtered = filtered.filter((doc) => !doc.isPreparedByMe)
    }
    if (!showPending) {
      filtered = filtered.filter((doc) => !doc.isPending)
    }
    return filtered
  }, [data, showPending, showPreparedByMe, showRejected])

  const getData = useCallback(() => {
    const url = new URL('/' + Roles.Admin + '/api/memo', window.location.origin)
    url.searchParams.set('doctype', doctype)
    setLoading(true)
    fetch(url)
      .then(response => response.json())
      .then(({ result }) => { setData(result); setLoading(false) })
      .then((e) => { console.log(e); setLoading(false) })
  }, [doctype]);

  useEffect(() => {
    getData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onBack = useCallback(() => {
    setSelectedMemo(undefined);
  }, [])

  const onApprove = useCallback(() => {
    if (!!selectedMemo) {
      Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#61a118',
        cancelButtonColor: '#474747',
        confirmButtonText: 'Yes, Approve!'
      }).then(async ({ isConfirmed }) => {
        if (isConfirmed) {
          const save = approveMemorandumLetter.bind(null, doctype, selectedMemo._id as string)
          const { success, error } = await save()
          if (error) {
            toaster.danger(error)
          } else if (success) {
            toaster.success(success)
            setTimeout(() => getData(), 500)
            onBack();
          }
        }
      })
    }
  }, [selectedMemo, doctype, getData, onBack])

  const onReject = useCallback(() => {
    if (!!selectedMemo) {
      Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#474747',
        confirmButtonText: 'Yes, Reject!'
      }).then(async ({ isConfirmed }) => {
        if (isConfirmed) {
          const save = rejectMemorandumLetter.bind(null, doctype, selectedMemo._id as string)
          const { success, error } = await save()
          if (error) {
            toaster.danger(error)
          } else if (success) {
            toaster.success(success)
            setTimeout(() => getData(), 500)
            onBack();
          }
        }
      })
    }
  }, [selectedMemo, doctype, getData, onBack])

  return (<>
    <div className="p-6">
      <h1 className="text-2xl font-[500]">{doctype === DocumentType.Memo ? "Memorandum for approval list" : "Letter for approval list"}</h1>
      <div className="mt-3 flex flex-col lg:flex-row lg:flex-betweeen flex-wrap w-full min-w-[300px] lg:min-w-[800px] bg-white p-4 rounded-t-lg">
        <div className="flex flex-wrap">
          <label htmlFor="searchMemo" className="font-[500] mr-2 items-center flex">Search:</label>
          <input type="search" id="searchMemo" placeholder="Search Memorandum" className="border-2 max-w-64 border-gray-300 px-2 py-1 rounded" />
          <div className="flex items-center gap-x-1 ml-4">
            <input type="checkbox" id="showRejected" className="ml-2" onChange={(e) => setShowRejected(e.target.checked)}/>
            <label htmlFor="showRejected" className="font-[500] text-sm">Show Rejected</label>
          </div>
          <div className="flex items-center gap-x-1 ml-4">
            <input type="checkbox" id="showPreparedByMe" className="ml-2" onChange={(e) => setShowPreparedByMe(e.target.checked)}/>
            <label htmlFor="showPreparedByMe" className="font-[500] text-sm">Show Prepared By Me</label>
          </div>
          <div className="flex items-center gap-x-1 ml-4">
            <input type="checkbox" id="showPending" className="ml-2" onChange={(e) => setShowPending(e.target.checked)}/>
            <label htmlFor="showPending" className="font-[500] text-sm">Show Pending Others</label>
          </div>
        </div>
        <div className="flex mt-2 lg:mt-0 lg:justify-end flex-grow pr-2 lg:pr-0">
          <button type="button" onClick={getData} title="Refresh List" className="max-w-32 aspect-square p-1 rounded border border-blue-900 flex items-center justify-center text-blue-900 bg-white hover:bg-blue-200/50"><RefreshIcon /></button>
        </div>
      </div>
      <div className="min-h-[200px] min-w-[300px] bg-white w-full p-4 lg:min-w-[800px]">
        <div className="border min-w-[300px] rounded-md p-2 lg:min-w-[780px]">
          <div className="p-3 grid grid-cols-1 lg:grid-cols-3 lg:min-w-[750px] gap-3">
            { loading && <LoadingComponent /> }
            { !loading && filteredData.length === 0 && <div className="text-center">No {doctype === DocumentType.Memo ? "memorandum" : "letter"} for approval.</div>}
            { !loading && filteredData.map((memoLetter, i) => (
              <ThumbnailItemWithDepartment onClick={() => setSelectedMemo(memoLetter)} isRejected={memoLetter.isRejected} preparedByMe={memoLetter.isPreparedByMe} isPending={memoLetter.isPending} key={memoLetter._id} thumbnailSrc="/thumbnail-document.png" department={(memoLetter.departmentId as DepartmentDocument).name} label={memoLetter.title} createdAt={memoLetter.createdAt} updatedAt={memoLetter.updatedAt} />
            ))}
          </div>
        </div>
      </div>
    </div>
    <OCSModal title={selectedMemo?.title} open={!!selectedMemo} onClose={onBack}>
      <div className={clsx("min-w-[" + (8.5 * 96) + "px]", "max-w-[" + (8.5 * 96) + "px]", "min-h-[" + (1 * 96) + "px]")}>
        {<ParseHTMLTemplate role={Roles.Admin} htmlString={selectedMemo?.content || ''} memoLetterId={selectedMemo?._id} showApprovedSignatories />}
      </div>
      <hr className="border w-full h-[1px] my-2" />
      <div className="w-full flex justify-end items-center gap-x-3 pr-2">
        {isRejectedMemo && <div className="text-red-500"><CrossIcon display="inline" />This {doctype === DocumentType.Memo ? "memorandum" : "letter"} has been rejected.</div>}
        {isPending && !isRejectedMemo && <div className="text-gray-500">This {doctype === DocumentType.Memo ? "memorandum" : "letter"} is pending for others</div>}
        {isPreparedByMe && <div className="text-blue-500">This {doctype === DocumentType.Memo ? "memorandum" : "letter"} is prepared by you</div>}
        <button type="button" className="rounded-lg bg-green-600 hover:bg-green-500 text-white px-3 py-1 disabled:bg-gray-300" disabled={isRejectedMemo || isPreparedByMe || isPending} onClick={onApprove}><ConfirmIcon display="inline" /> Approve</button>
        <button type="button" className="rounded-lg bg-red-600 hover:bg-red-500 text-white px-3 py-1 disabled:bg-gray-300" disabled={isRejectedMemo || isPreparedByMe || isPending} onClick={onReject}><CrossIcon display="inline" />Reject</button>
        <button type="button" className="rounded-lg bg-gray-300 hover:bg-yellow-100 text-black px-3 py-1" onClick={onBack}>Close</button>
      </div>
    </OCSModal>
  </>)
}