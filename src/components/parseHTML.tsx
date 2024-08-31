'use client'

import { DocumentType, ESignatureDocument, Roles } from "@/lib/modelInterfaces";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import jsxToString from "./JSXToString";

export default function ParseHTMLTemplate({ role, doctype, htmlString, showApprovedSignatories = false, memoLetterId }: { role: Roles, doctype: DocumentType, htmlString: string, showApprovedSignatories?: boolean, memoLetterId?: string }) {
  const [htmlFinal, setHTMLFinal] = useState<string>(htmlString);
  const [approvedSignatures, setApprovedSignatures] = useState<ESignatureDocument[]>([])
  const [preparedBySignature, setPreparedBySignature] = useState<ESignatureDocument>()

  const getApprovedSignatures = useCallback(async () => {
    if (showApprovedSignatories && !!memoLetterId) {
      const url = new URL('/' + role + '/api/' + doctype + '/signatory', window.location.origin)
      url.searchParams.set('mlid', memoLetterId || '')
      const response = await fetch(url)
      if (response.ok) {
        const { result }: { result: ESignatureDocument[] } = await response.json()
        if (result !== approvedSignatures) {
          setApprovedSignatures(result)
        }
      }
    }
  }, [approvedSignatures, showApprovedSignatories, role, doctype, memoLetterId])

  const getPreparedBySignature = useCallback(async (preparedBy?: string|null) => {
    if (!!preparedBy && !!memoLetterId) {
      const url = new URL('/' + role + '/api/' + doctype + '/preparedby', window.location.origin)
      url.searchParams.set('mlid', memoLetterId || '')
      const response = await fetch(url)
      if (response.ok) {
        const { result }: { result: ESignatureDocument } = await response.json()
        return result
      }
    }
    return undefined
  }, [doctype, role, memoLetterId])

  const getData = useCallback(async () => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, "text/html");
    // get prepared by signature
    const preparedBy = doc.querySelector("table[data-type='prepared-by']")
    if (!!preparedBy && !preparedBySignature) {
      const signatoryId = preparedBy.getAttribute('data-signatory-id')
      const signature = await getPreparedBySignature(signatoryId)
      setPreparedBySignature(signature)
      const pbname = preparedBy.querySelector("td[data-type='prepared-by-name']")
      pbname?.classList.add("relative")
      const absoluteSignature = jsxToString(
        <Image src={signature?.signature || ''} width={100} height={30} alt="preparedBy" className="absolute left-0 bottom-0 z-50 w-full" />
      )
      const parsed = parser.parseFromString(absoluteSignature, "text/html")
      pbname?.appendChild(parsed.body.children[0])
    }
    // get approved signatures
    if (approvedSignatures.length > 0 && showApprovedSignatories) {
      const signatories = doc.querySelectorAll("table[data-type='signatory']")
      await Promise.all(Object.entries(signatories).map(async ([key, signatory]) => {
        const signatoryId = signatory.getAttribute('data-signatory-id')
        const signature = approvedSignatures.find((s) => s._id === signatoryId)
        if (!!signature) {
          const sname = signatory.querySelector("td[data-type='signatory-name']")
          sname?.classList.add("relative")
          const absoluteSignature = jsxToString(
            <Image src={signature.signature || ''} width={100} height={30} alt="signature" className="absolute left-0 bottom-0 z-50 w-full" />
          )
          const parsed = parser.parseFromString(absoluteSignature, "text/html")
          sname?.appendChild(parsed.body.children[0])
        }
      }))
    }
    return doc.documentElement.innerHTML;
  }, [approvedSignatures, htmlString, getPreparedBySignature, preparedBySignature, showApprovedSignatories])

  useEffect(() => {
    getApprovedSignatures()
      .then(() => getData().then((htmlFinalString) => setHTMLFinal(htmlFinalString)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [htmlString, showApprovedSignatories, memoLetterId])

  return !!htmlString ? (
    <div style={{
      width: 11 * 96,
      height: 11 * 96,
      maxHeight: "80vh",
      overflow: "auto",
      border: "1px solid #e5e7eb",
      paddingTop: "16px",
      paddingBottom: "16px",
    }}>
      <div style={{ maxWidth: 8.5 * 96, minHeight: 11 * 96, backgroundColor: "white" }} className="border shadow mx-auto p-[12.2mm]">
        <div dangerouslySetInnerHTML={{ __html: htmlFinal }} />
      </div>
    </div>
  ) : undefined
}