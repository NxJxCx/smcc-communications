'use client'

import LoadingComponent from "@/components/loading"
import { DepartmentDocument, DocumentType, Roles, TemplateDocument } from "@/lib/modelInterfaces"
import { useEffect, useMemo, useState } from "react"

export default function DepartmentTemplates({
  doctype
}: Readonly<{
  doctype: DocumentType
}>) {
  const [loading, setLoading] = useState<boolean>(true)
  const [departments, setDepartments] = useState<DepartmentDocument[]>([])
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentDocument>()

  useEffect(() => {
    setLoading(true)
    const url = new URL('/' + Roles.SuperAdmin + '/api/template/departments', window.location.origin)
    url.searchParams.set('doctype', doctype)
    fetch(url)
      .then(res => res.json())
      .then(({ result })=> { setDepartments(result); setLoading(false) })
      .catch((e) => { console.log(e); setLoading(false) })
  }, [doctype])

  const templates = useMemo(() => !!selectedDepartment ? (doctype === DocumentType.Memo ? selectedDepartment.memoTemplates as TemplateDocument[] : selectedDepartment.letterTemplates as TemplateDocument[]) : [], [selectedDepartment])

  return (
  <div className="w-full">
    <h1 className="w-fit mx-auto text-2xl mt-4 font-[500]">Department {doctype === DocumentType.Memo ? "Memorandum" : "Letter"} Templates</h1>
    {!!selectedDepartment && (<>
      <div className="border border-gray-300 bg-white p-4 rounded-xl mt-4 mx-4">
        <h2 className="text-2xl font-[500]">{selectedDepartment.name}</h2>
        <p className="text-gray-600">Number of {doctype === DocumentType.Memo? "Memorandums" : "Letters"}: {selectedDepartment[doctype === DocumentType.Memo?'memoTemplates' : 'letterTemplates'].length}</p>
      </div>
      </>
    )}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8 border rounded-xl mt-4 mx-4">
      { loading && <div className="col-span-2 min-h-[200px]"><LoadingComponent /></div>}
      { !loading && !selectedDepartment && departments?.length === 0 && <p className="text-center text-gray-600">No Departments</p>}
      { !loading && !selectedDepartment && departments?.map((department: DepartmentDocument) => (
        <div key={department._id}>
          <button type="button" onClick={() => setSelectedDepartment(department)} title={department.name} className="shadow-lg border border-gray-300 bg-white p-4 rounded-xl cursor-pointer hover:border-gray-400 flex flex-col items-start justify-center text-center">
            <div className="w-full">{doctype === DocumentType.Memo ? department.memoTemplates.length : department.letterTemplates.length} Templates</div>
            <div className="w-full font-semibold">{department.name}</div>
          </button>
        </div>
      ))}
      { !loading && !!selectedDepartment && templates.length === 0 && <p className="text-center text-gray-600">No Templates</p>}
      { !loading && !!selectedDepartment && templates.map((template: TemplateDocument) => (
        <div key={template._id}>
          {/* <button type="button" title={template.header} className="shadow-lg border border-gray-300 bg-white p-4 rounded-xl cursor-pointer hover:border-gray-400 flex flex-col items-start justify-center text-center">
            <div className="w-full">{doctype === DocumentType.Memo ? department.memoTemplates.length : department.letterTemplates.length} Templates</div>
            <div className="w-full font-semibold">{department.name}</div>
          </button> */}
        </div>
      ))}
    </div>
  </div>
  )
}