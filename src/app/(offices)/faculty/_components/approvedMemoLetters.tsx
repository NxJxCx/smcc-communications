'use client';;
import LoadingComponent from "@/components/loading";
import OCSModal from "@/components/ocsModal";
import ParseHTMLTemplate from "@/components/parseHTML";
import { DepartmentDocument, DocumentType, LetterDocument, MemoDocument, Roles, UserDocument } from "@/lib/modelInterfaces";
import clsx from "clsx";
import { PrintIcon, RefreshIcon } from "evergreen-ui";
import { useCallback, useEffect, useMemo, useState } from "react";
import ThumbnailItemWithDepartment from "./thumbnailItemWithDepartment";

export default function MemoLetterInbox({ doctype, searchParam }: Readonly<{ doctype: DocumentType, searchParam: string }>) {
  const [data, setData] = useState<(MemoDocument & { isPreparedByMe: boolean, isRead: boolean })[]|(LetterDocument & { isPreparedByMe: boolean, isRead: boolean })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMemo, setSelectedMemo] = useState<(MemoDocument|LetterDocument) & { isPreparedByMe: boolean }>();
  const [myUser, setMyUser] = useState<UserDocument>()
  const getData = useCallback(() => {
    const url = new URL('/' + Roles.Faculty + '/api/memo', window.location.origin)
    url.searchParams.set('doctype', doctype)
    setLoading(true)
    fetch(url)
      .then(response => response.json())
      .then(({ result, user }) => { setMyUser(user); setData(result); setLoading(false) })
      .catch((e) => { console.log(e); setLoading(false) })
  }, [doctype]);

  useEffect(() => {
    getData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onBack = useCallback(() => {
    setSelectedMemo(undefined);
  }, [])

  const [search, setSearch] = useState<string>(searchParam || '')

  const filteredData = useMemo(() => {
    let filtered = data.toReversed();
    if (search) {
      filtered = data.filter((item) => (
        item._id!.toLowerCase() === search.toLowerCase()
        || item.title.toLowerCase().includes(search.toLowerCase())
        || (item.departmentId as DepartmentDocument).name.toLowerCase().includes(search.toLowerCase())
        || (item.departmentId as DepartmentDocument).name.toLowerCase() === search.toLowerCase()
        || ((new Date(item.createdAt as string)).toLocaleDateString()).toLowerCase().includes(search.toLowerCase())
        || ((new Date(item.createdAt as string)).toLocaleDateString('en-PH', { year: 'numeric', month: '2-digit', day: '2-digit' })).toLowerCase().includes(search.toLowerCase())
        || ((new Date(item.createdAt as string)).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })).toLowerCase().includes(search.toLowerCase())
        || ((new Date(item.createdAt as string)).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })).toLowerCase().includes(search.toLowerCase())
        || ((new Date(item.createdAt as string)).toLocaleDateString('en-PH', { year: 'numeric', month: 'long' })).toLowerCase().includes(search.toLowerCase())
        || ((new Date(item.createdAt as string)).toLocaleDateString('en-PH', { year: 'numeric', month: 'short' })).toLowerCase().includes(search.toLowerCase())
        || ((new Date(item.updatedAt as string)).toLocaleDateString()).toLowerCase().includes(search.toLowerCase())
        || ((new Date(item.updatedAt as string)).toLocaleDateString('en-PH', { year: 'numeric', month: '2-digit', day: '2-digit' })).toLowerCase().includes(search.toLowerCase())
        || ((new Date(item.updatedAt as string)).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })).toLowerCase().includes(search.toLowerCase())
        || ((new Date(item.updatedAt as string)).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })).toLowerCase().includes(search.toLowerCase())
        || ((new Date(item.updatedAt as string)).toLocaleDateString('en-PH', { year: 'numeric', month: 'long' })).toLowerCase().includes(search.toLowerCase())
        || ((new Date(item.updatedAt as string)).toLocaleDateString('en-PH', { year: 'numeric', month: 'short' })).toLowerCase().includes(search.toLowerCase())
      ))
    }
    return filtered.map((item) => ({
      ...item,
      isRead: doctype === DocumentType.Memo
        ? [...(myUser?.readMemos || [])]?.includes(item._id!.toString())
        : [...(myUser?.readLetters || [])]?.includes(item._id!.toString()),
    }));
  }, [data, search, myUser, doctype])

  const onPrint = useCallback(() => {
    const url = new URL('/print', window.location.origin)
    url.searchParams.set('doc', doctype)
    url.searchParams.set('id', selectedMemo?._id!)
    url.searchParams.set('role', Roles.Faculty)
    url.searchParams.set('title', selectedMemo?.title!)
    const docWindow = window.open(url, '_blank', 'width=1000,height=1000, menubar=no, toolbar=no, scrollbars=yes, location=no, status=no');
    if (docWindow) {
      docWindow.onbeforeunload = () => window.location.reload();
    }
  }, [doctype, selectedMemo?._id, selectedMemo?.title])

  const onReadMemoLetter = useCallback((memoLetter: (MemoDocument & { isPreparedByMe: boolean, isRead: boolean })|(LetterDocument & { isPreparedByMe: boolean, isRead: boolean })) => {
    const url = new URL('/' + Roles.Faculty + '/api/memo/read', window.location.origin)
    url.searchParams.set('id', memoLetter._id!)
    url.searchParams.set('doctype', doctype)
    fetch(url)
      .then((response) => response.json())
      .then(({ success, error }) => {
        console.log("success",success);
        console.log("error",error);
      })
      .catch(console.log);
    setSelectedMemo(memoLetter);
  }, [doctype])

  return (<>
    <div className="p-6">
      <h1 className="text-2xl font-[500]">{doctype === DocumentType.Memo ? "Memorandum for approval list" : "Letter for approval list"}</h1>
      <div className="mt-3 flex flex-col lg:flex-row lg:flex-betweeen flex-wrap w-full min-w-[300px] lg:min-w-[800px] bg-white p-4 rounded-t-lg">
        <div className="flex flex-wrap">
          <label htmlFor="searchMemo" className="font-[500] mr-2 items-center flex">Search:</label>
          <input type="search" onChange={(e) => setSearch(e.target.value)} value={search} id="searchMemo" placeholder="Search Memorandum" className="border-2 max-w-64 border-gray-300 px-2 py-1 rounded" />
        </div>
        <div className="flex mt-2 lg:mt-0 lg:justify-end flex-grow pr-2 lg:pr-0">
          <button type="button" onClick={getData} title="Refresh List" className="max-w-32 aspect-square p-1 rounded border border-blue-900 flex items-center justify-center text-blue-900 bg-white hover:bg-blue-200/50"><RefreshIcon /></button>
        </div>
      </div>
      <div className="min-h-[200px] min-w-[300px] bg-white w-full p-4 lg:min-w-[800px]">
        <div className="border min-w-[300px] rounded-md p-2 lg:min-w-[780px]">
          <div className="p-3 grid grid-cols-1 lg:grid-cols-3 lg:min-w-[750px] gap-3">
            { loading && <LoadingComponent /> }
            { !loading && filteredData.length === 0 && <div className="text-center">No approved {doctype === DocumentType.Memo ? "memorandum" : "letter"}.</div>}
            { !loading && filteredData.map((memoLetter, i) => (
              <ThumbnailItemWithDepartment onClick={() => onReadMemoLetter(memoLetter)} preparedByMe={memoLetter.isPreparedByMe} isRead={memoLetter.isRead} key={memoLetter._id} thumbnailSrc="/thumbnail-document.png" department={(memoLetter.departmentId as DepartmentDocument).name} label={memoLetter.title} createdAt={memoLetter.createdAt} updatedAt={memoLetter.updatedAt} />
            ))}
          </div>
        </div>
      </div>
    </div>
    <OCSModal title={selectedMemo?.title} open={!!selectedMemo} onClose={onBack}>
      <div className={clsx("min-w-[" + (8.5 * 96) + "px]", "max-w-[" + (8.5 * 96) + "px]", "min-h-[" + (1 * 96) + "px]")}>
        {<ParseHTMLTemplate role={Roles.Faculty} htmlString={selectedMemo?.content || ''} memoLetterId={selectedMemo?._id} showApprovedSignatories />}
      </div>
      <hr className="border w-full h-[1px] my-2" />
      <div className="w-full flex justify-end items-center gap-x-3 pr-2">
        <button type="button" className="rounded-lg bg-blue-300 hover:bg-blue-100 text-black px-3 py-1 ml-4" onClick={onPrint}><PrintIcon display="inline" /> Print</button>
        <button type="button" className="rounded-lg bg-gray-300 hover:bg-yellow-100 text-black px-3 py-1 mr-4" onClick={onBack}>Close</button>
      </div>
    </OCSModal>
  </>)
}