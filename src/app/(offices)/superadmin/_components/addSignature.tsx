'use client'

import { Image } from "evergreen-ui"
import { useCallback, useRef, useState } from "react"
import SignaturePad from "./signaturePad"

export default function AddAdminSignature() {
  const signaturePadRef = useRef<any>(null)
  const handleClear = useCallback(() => {
    signaturePadRef.current?.clear()
  }, [signaturePadRef])

  const handleSave = useCallback(() => {
    const signatureBase64String = signaturePadRef.current?.toDataURL()
  }, [signaturePadRef])

  const [signatureBase64String, setSignatureBase64String] = useState<string>('')

  return (
    <div>
      <SignaturePad refer={signaturePadRef} />
      <button type="button" onClick={handleClear}>Clear</button>
      <button type="button" onClick={handleSave}>Save</button>
      <div>Signature: {signatureBase64String}</div>
      <div>
        <Image src={signatureBase64String} alt="Signature" width="200" />
      </div>
    </div>
  )
}