'use client'

import { uploadProfilePhoto } from '@/actions/account'
import { ActionResponseType } from "@/actions/superadmin"
import LoadingComponent from "@/components/loading"
import { PhotoFileDocument, Roles, UserDocument } from "@/lib/modelInterfaces"
import { useSession } from "@/lib/useSession"
import { Image, toaster, UploadIcon } from "evergreen-ui"
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from "react"
import { useFormState } from "react-dom"

function photoBufferToPhoto(buffer: Buffer, type: string) {
  if (buffer.length > 0) {
    const blob = new Blob([buffer], { type })
    const objectURL = URL.createObjectURL(blob)
    return objectURL
  }
  return ''
}

async function getData(role: Roles, setData: (data: UserDocument) => void) {
  const url = new URL('/' + role + '/api/account', window.location.origin)
  try {
    const response = await fetch(url)
    const { result } = await response.json()
    setData(result)
  } catch (e) {
    console.error(e)
  }
}

export default function MyAccountSettings({
  role
}: {
  role: Roles
}) {
  const { data: sessionData, status } = useSession({
    redirect: true
  })
  const [data, setData] = useState<UserDocument>()
  const [photoImage, setPhotoImage] = useState<string>("")

  const pathname = usePathname();

  const photoActionForm = useMemo(() => uploadProfilePhoto.bind(null, role, status === "authenticated" ? sessionData!.user._id || '' : ''), [sessionData, status, role])
  const [photoState, photoAction, photoPending] = useFormState<ActionResponseType, FormData>(photoActionForm, {})

  const [photoUpload, setPhotoUpload] = useState<string>("/photo-profile-default.jpg")
  const photoRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (!photoPending && photoState.success) {
      toaster.success(photoState.success, { duration: 3000 })
      photoRef.current?.reset()
      setTimeout(() => getData(role, setData), 500)
    } else if (!photoPending && photoState.error) {
      toaster.danger(photoState.error, { duration: 3000 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoState, photoPending])


  useEffect(() => {
    getData(role, setData)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  useEffect(() => {
    if (!!(data?.photo as PhotoFileDocument)?.file) {
      const file = data?.photo as PhotoFileDocument
      const photo = photoBufferToPhoto(Buffer.from(file.file), file.mimeType)
      setPhotoImage(photo)
      return () => {
        if (photo) {
          URL.revokeObjectURL(photo)
        }
      }
    }
  }, [data])

  if (status === "loading") return <LoadingComponent />

  return (
    <div className="w-full pt-6 px-8">
      <h1 className="font-[600] text-2xl">Account Settings</h1>
      <div className="mt-4 border border-blue-700 rounded-lg min-h-[100px]">
        <div className="px-4 pt-2 pb-1 border-b border-blue-700/50">
          <h3 className="text-xl font-[500]">Profile</h3>
        </div>
        <div className="p-4">
          <div className="flex justify-start items-start">
            <div className="border rounded max-w-32 min-w-32 flex items-center justify-center aspect-square shadow object-contain">
              <Image src={photoImage} alt="Profile Picture" />
            </div>
            <div className="ml-2">
              <form action={photoAction} ref={photoRef}>
                <label className="block mb-2 text-sm font-medium text-gray-900" htmlFor="photo">Update Photo:</label>
                <input onChange={(e) => setPhotoUpload(e.target.value)} className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none" id="photo" name="photo" type="file" accept="image/*" />
                {!!photoUpload && <button type="submit" className="mt-2 block px-3 py-1 text-sm font-medium rounded border border-gray-900 hover:bg-gray-200" title="Upload"><UploadIcon display="inline" marginRight={2} />Upload</button>}
              </form>
            </div>
            <div className="ml-4">
              <h3 className="text-xl font-[500]">{data?.firstName} {data?.middleName} {data?.lastName} {data?.suffixName}</h3>
              <p className="text-sm text-gray-600">{data?.email}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}