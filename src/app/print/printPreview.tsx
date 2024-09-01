'use client'

import LoadingComponent from "@/components/loading"
import ParseHTMLTemplate from "@/components/parseHTML"
import { DocumentType, Roles } from "@/lib/modelInterfaces"
import { useEffect, useState } from "react"
import PrintButton from "./printButton"

export default function Print({ title, role, id, doctype }: { title: string, role: Roles, id: string, doctype: DocumentType|string }) {
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState<string>('<p>Loading Content...</p>')
  const [isError, setError] = useState<boolean>(false)
  useEffect(() => {
    setLoading(true)
    const url = new URL('/' + role + '/api/print/content/' + id, window.location.origin)
    url.searchParams.append('role', role)
    url.searchParams.append('doctype', doctype)
    fetch(url)
      .then(response => response.json())
      .then(({ success, error }) => { setContent(success); error && setError(true); setLoading(false) })
      .catch((e) => { console.log("ERROR:", e); setError(true); setLoading(false)})
  }, [doctype, id, role])

  useEffect(() => {
    window.document.title = title;
  }, [title])

  return loading ? <div className="min-h-screen w-full flex items-center justify-center"><LoadingComponent /></div>
  : isError ? (
    <div className="min-h-screen w-full flex items-center justify-center">Print content not found</div>
  ) : (
    <>
      <ParseHTMLTemplate role={role} htmlString={content} memoLetterId={id} showApprovedSignatories print />
      <PrintButton />
    </>
  )
}