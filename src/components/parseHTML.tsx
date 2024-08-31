'use client'

import { DocumentType, ESignatureDocument, Roles } from "@/lib/modelInterfaces";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import jsxToString from "./JSXToString";

export default function ParseHTMLTemplate({ role, doctype, htmlString, showApprovedSignatories = false, approvedSignatureIds = [] }: { role: Roles, doctype: DocumentType, htmlString: string, showApprovedSignatories?: boolean, approvedSignatureIds?: string[] }) {
  const [htmlFinal, setHTMLFinal] = useState<string>(htmlString);
  const getData = useCallback(async () => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, "text/html");
    const signatories = doc.querySelectorAll("table[data-type='signatory']")
    await Promise.all(Object.entries(signatories).map(async ([key, signatory]) => {
      const signatoryId = signatory.getAttribute('data-signatory-id')
      if (approvedSignatureIds.includes(signatoryId || '(unknown)')) {
        const response = await fetch('/' + role + '/api/' + doctype + '/signatory/' + signatoryId)
        if (response.ok) {
          const { result }: { result: ESignatureDocument } = await response.json()
          const sname = signatory.querySelector("td[data-type='signatory-name']")
          sname?.classList.add("relative")
          const absoluteSignature = jsxToString(
            <Image src={result?.signature || ''} width={100} height={30} alt="signature" className="absolute left-0 bottom-0 z-50 w-full" />
          )
          const parsed = parser.parseFromString(absoluteSignature, "text/html")
          sname?.appendChild(parsed.body.children[0])
        }
      }
    }))
    // get prepared by signature
    const preparedBy = doc.querySelector("table[data-type='prepared-by']")
    if (!!preparedBy) {
      const signatoryId = preparedBy.getAttribute('data-signatory-id')
      const response = await fetch('/' + role + '/api/' + doctype + '/signatory/' + signatoryId)
        if (response.ok) {
          const { result }: { result: ESignatureDocument } = await response.json()
          const pbname = preparedBy.querySelector("td[data-type='prepared-by-name']")
          pbname?.classList.add("relative")
          const absoluteSignature = jsxToString(
            <Image src={result?.signature || ''} width={100} height={30} alt="signature" className="absolute left-0 bottom-0 z-50 w-full" />
          )
          const parsed = parser.parseFromString(absoluteSignature, "text/html")
          pbname?.appendChild(parsed.body.children[0])
        }
    }
    setHTMLFinal(doc.documentElement.innerHTML);
  }, [approvedSignatureIds, htmlString, doctype, role])

  useEffect(() => {
    if (showApprovedSignatories) {
      getData().then()
      return () => {}
    }
    setHTMLFinal(htmlString);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [htmlString, showApprovedSignatories, approvedSignatureIds])

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