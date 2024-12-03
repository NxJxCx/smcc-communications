'use client'

import LoadingComponent from "@/components/loading"
import ParseHTMLTemplate from "@/components/parseHTML"
import { DocumentType, Roles, UserDocument } from "@/lib/modelInterfaces"
import clsx from "clsx"
import Image from "next/image"
import { useEffect, useState } from "react"
import PrintButton from "./printButton"

export default function Print({ title, role, id, doctype, isForIndividual, isAttendance }: { title: string, role: Roles, id: string, doctype: DocumentType|string, isForIndividual?: boolean, isAttendance: boolean }) {
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState<string>('<p>Loading Content...</p>')
  const [isError, setError] = useState<boolean>(false)
  const [attendance, setAttendance] = useState<any>()
  useEffect(() => {
    if (!isAttendance) {
      setLoading(true)
      const url = new URL('/' + role + '/api/print/content/' + id, window.location.origin)
      url.searchParams.append('role', role)
      url.searchParams.append('doctype', doctype)
      if (isForIndividual) {
        url.searchParams.append('isForIndividual', 'true');
      }
      fetch(url)
        .then(response => response.json())
        .then(({ success, error }) => { console.log("success", success); setContent(success); error && setError(true); setLoading(false) })
        .catch((e) => { console.log("ERROR:", e); setError(true); setLoading(false)})
    }
  }, [doctype, id, role, isForIndividual, isAttendance])

  useEffect(() => {
    window.document.title = title;
  }, [title])

  useEffect(() => {
    if (isAttendance) {
      const url = new URL('/' + role + '/api/memo/read', window.location.origin)
      url.searchParams.set('doctype', doctype)
      url.searchParams.set('id', id)
      console.log(url.toString())
      fetch(url)
        .then(response => response.json())
        .then(({ data }) => { setAttendance(data); !data && setError(true); setLoading(false) })
        .catch((e) => { console.log("ERROR:", e); setError(true); setLoading(false)})
    }
  }, [isAttendance, id, role, doctype])

  return loading ? <div className="min-h-screen w-full flex items-center justify-center"><LoadingComponent /></div>
  : isError ? (
    <div className="min-h-screen w-full flex items-center justify-center">Print content not found</div>
  ) : (
    <>
      {!isAttendance && (
        <ParseHTMLTemplate role={role} htmlString={content} memoLetterId={id} showApprovedSignatories print isForIndividual={isForIndividual} />
      )}
      {isAttendance && (
        <div style={{ maxWidth: 8.5 * 96, minHeight: 11 * 96, backgroundColor: "white" }} className="border shadow mx-auto p-[12.2mm]">
          <div className="w-full text-center pb-4">
            <div className="flex justify-between items-center mb-4">
              <div className="w-20">
                <Image src="/smcclogo.png" alt="School Logo" className="w-full h-auto" width={100} height={100} />
              </div>
              <div className="flex-1 text-center">
                <h1 className="text-xl font-bold">Saint Michael College of Caraga</h1>
                <p className="text-sm">Brgy. 4, Nasipit, Agusan del Norte, Philippines</p>
                <p className="text-sm">
                  Tel. Nos. +63 085 343-3251 / +63 085 283-3113 Fax No. +63 085 808-0892
                </p>
                <p className="text-sm">www.smccnasipit.edu.ph</p>
              </div>
              <div className="w-20">
                <Image src="/socotechlogo.jpg" alt="Certification Logo" className="w-full h-auto" width={100} height={100} />
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold text-blue-800 text-center mb-4">ATTENDANCE SHEET</h2>
            <table className="border border-blue-500 border-collapse table w-full">
              <thead>
                <tr className="border border-blue-500 border-b-2">
                  <th className="border border-blue-500 p-1 text-center">Faculty Name</th>
                  <th className="border border-blue-500 p-1 text-center">Email</th>
                  <th className="border border-blue-500 p-1 text-center">Time Read</th>
                </tr>
              </thead>
              <tbody>
                {attendance?.map((faculty: UserDocument & { readAt: string }, i: number) => (
                  <tr key={faculty._id}>
                    <td className={clsx("border border-blue-500 p-1 text-center", i % 2 === 0 ? "bg-blue-100" : "bg-white")}>{faculty.prefixName ? `${faculty.prefixName} ` : ''}{faculty.firstName} {faculty.lastName}{faculty.suffixName ? `, ${faculty.suffixName}` : ''}</td>
                    <td className={clsx("border border-blue-500 p-1 text-center", i % 2 === 0 ? "bg-blue-100" : "bg-white")}>{faculty.email}</td>
                    <td className={clsx("border border-blue-500 p-1 text-center", i % 2 === 0 ? "bg-blue-100" : "bg-white")}>{(new Date(faculty.readAt)).toLocaleDateString('en-PH', { year: "numeric", month: "short", day: "numeric", hour12: true, hour: "numeric", minute: "numeric" })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <PrintButton />
    </>
  )
}