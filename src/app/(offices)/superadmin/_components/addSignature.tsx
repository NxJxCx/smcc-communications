'use client';;
import { saveESignature } from '@/actions/superadmin';
import LoadingComponent from '@/components/loading';
import OCSModal from '@/components/ocsModal';
import { PhotoFileDocument, Roles, UserDocument } from '@/lib/modelInterfaces';
import clsx from 'clsx';
import { Image, PlusIcon } from 'evergreen-ui';
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Swal from 'sweetalert2';
import SignaturePad from "./signaturePad";

function getPhotoURL(id?: string, photoBuffer?: Buffer, type?: string): string | undefined
{
  // convert buffer to object url
  if (!photoBuffer || !id || !type) return undefined;
  const objectURL = URL.createObjectURL(new Blob([photoBuffer], { type }));
  return objectURL;
}

function EmployeeSelection({
  photo,
  employeeId,
  employeeFullName,
  className,
  ...props
}: Readonly<{
  photo?: PhotoFileDocument
  employeeId: string
  employeeFullName: string
  className?: string
} & any>) {

  const [photoURL, setPhotoURL] = useState<string | undefined>()

  useEffect(() => {
    if (photo?.file) {
      const p = getPhotoURL(photo._id, Buffer.from(photo.file), photo.mimeType)
      setPhotoURL(p)
      return () => {
        if (p && p.startsWith('blob:')) {
          URL.revokeObjectURL(p)
        }
      }
    }
  }, [photo])

  return (
    <button type="button" className={clsx("border p-4 max-w-64 hover:bg-gray-400/20 rounded", className)} {...props}>
      <div className="aspect-square max-w-32 mb-1 mx-auto bg-white">
        <Image src={photoURL || "/photo-profile-default.jpg"} alt="Photo" />
      </div>
      <div className="text-center text-xs">Employee ID: {employeeId}</div>
      <div className="text-center text-xs">{employeeFullName}</div>
    </button>
  )
}


async function getData(setData: (data: UserDocument[]) => void, setLoading: (loading: boolean) => void) {
  setLoading(true)
  try {
    const response = await fetch('/' + Roles.SuperAdmin + '/api/admins/nosignature')
    const { result } = await response.json();
    setData(result)
    setLoading(false)
  } catch (e) {
    console.log(e)
    setLoading(false)
  }
}

export default function AddAdminSignature() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<UserDocument[]>([])
  const [showModal, setShowModal] = useState<boolean>(false)
  const [selectedEmployee, setSelectedEmployee] = useState<UserDocument|undefined>()
  const saveSignature = useMemo(() => saveESignature.bind(null, selectedEmployee?._id), [selectedEmployee])

  const getFullName = useCallback((admin?: UserDocument) => {
    return !!admin ? ((admin.prefixName || "") + " " + admin.firstName + " " + (admin.middleName ? admin.middleName[0].toUpperCase() + ". " : "") + admin.lastName + (admin.suffixName ? ", " + admin.suffixName : "")).trim() : ""
  }, [])

  const signaturePadRef = useRef<any>(null)
  const handleClear = useCallback(() => {
    signaturePadRef.current?.clear()
  }, [signaturePadRef])

  const handleSave = useCallback(() => {
    const signatureData = signaturePadRef.current?.toDataURL()
    Swal.fire({
      icon: 'question',
      title: 'Confirm Signature?',
      text: getFullName(selectedEmployee),
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
    }).then(async ({ isConfirmed }) => {
      if (isConfirmed) {
        const { success, error } = await saveSignature(signatureData)
        if (error) {
          Swal.fire({ icon: 'error', title: 'Error', text: error })
        } else if (success) {
          Swal.fire({ icon:'success', title: 'Success', text: 'Signature saved successfully' })
          setShowModal(false)
          handleClear()
          setSelectedEmployee(undefined)
          getData(setData, setLoading)
        }
      }
    })
  }, [signaturePadRef, selectedEmployee, handleClear, getFullName, saveSignature])

  const toggleSelectEmployee = useCallback((admin: UserDocument) => {
    if (selectedEmployee === admin) setSelectedEmployee(undefined)
    else setSelectedEmployee(admin)
  }, [selectedEmployee])

  const onClose = useCallback(() => {
    setShowModal(false)
    handleClear()
  }, [handleClear])

  useEffect(() => {
    getData(setData, setLoading)
  }, [])

  return (<>
    <div className="m-6 p-4 border">
      <button type="button" disabled={!selectedEmployee} onClick={() => setShowModal(true)} className="border p-2 rounded bg-blue-700 hover:bg-blue-500 text-white font-[600] disabled:cursor-not-allowed disabled:bg-gray-300">
        <PlusIcon display="inline" /> Add Admin Signature
      </button>
      <div className="mt-4 flex flex-wrap gap-4 justify-start items-start">
        { loading && (
          <div className="flex-grow items-center justif<LoadingComponent />y-center"><LoadingComponent /></div>
        )}
        { !loading && data.length === 0 && (
          <div className="w-full text-center text-gray-400 text-lg italic">No admin for e-signature registration</div>
        )}
        { data.length > 0 && data.map((admin, i: number) => (
          <EmployeeSelection key={"admin_" + i} className={clsx(selectedEmployee?._id === admin._id ? "bg-blue-300 hover:bg-blue-400" : "")} onClick={() => toggleSelectEmployee(admin)} photo={admin.photo as PhotoFileDocument|undefined} employeeId={admin.employeeId} employeeFullName={getFullName(admin)} />
        ))}
      </div>
    </div>
    <OCSModal title="E-Signature Registration" open={showModal} onClose={() => onClose()}>
      <div className="px-4 py-1">
        <h3 className="text-lg mb-1">{getFullName(selectedEmployee)} (Employee ID: {selectedEmployee?.employeeId})</h3>
        <h3 className="text-lg mb-1">Please sign here:</h3>
        <div className="bg-white border border-black max-w-fit mx-auto hover:cursor-crosshair" tabIndex={0}>
          <SignaturePad refer={signaturePadRef} />
        </div>
      </div>
      <div className="flex gap-x-2 items-center justify-center mt-4 mb-2">
        <button type="button" onClick={onClose} className="border p-2 rounded bg-red-500 text-white font-[600]">
          Cancel
        </button>
        <button type="button" onClick={handleClear} className="border py-2 px-3 rounded bg-gray-500 text-white font-[600]">
          Clear
        </button>
        <button type="button" onClick={handleSave} className="border py-2 px-3 rounded bg-green-700 text-white font-[600]">
          Save
        </button>
      </div>
    </OCSModal>
  </>)
}