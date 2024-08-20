'use client';
import { changeEmailAddress } from "@/actions/auth";
import LoadingComponent from "@/components/loading";
import { ResponseFormState, UserSessionProp } from "@/lib/types";
import { Button, CrossIcon, IconButton, TextInput, TickIcon, Tooltip, WarningSignIcon } from "evergreen-ui";
import { useCallback, useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

export default function AccountSettingsEmailForm({
  data,
  isVerificationSent = false,
  onVerificationSent = () => {},
  onSuccess = (setReset: () => void) => {},
  ...props
} : {
  data: UserSessionProp|null,
  isVerificationSent: boolean,
  onVerificationSent: () => void,
  onSuccess: (setReset: () => void) => void,
} & React.HTMLAttributes<HTMLFormElement>) {
  const [emailAddress, setEmailAddress] = useState<string|undefined>(data?.email)
  const [emailExists, setEmailExists] = useState<boolean>(true)
  const [isChecking, setChecking] = useState<boolean>(false)
  const [abortController, setAbortController] = useState<AbortController>(new AbortController())
  const [isEditing, setEditing] = useState<boolean>(false)
  const [isLoading, setLoading] = useState<boolean>(false)
  const emailChangeAction = changeEmailAddress.bind(null, data?.role || null);
  const [state, action] = useFormState<ResponseFormState>(emailChangeAction as any, undefined)

  const { pending } = useFormStatus()

  useEffect(() => {
    if (!isEditing) {
      setEmailAddress(data?.email)
    }
  }, [isEditing, data])

  const onConfirm = useCallback(() => {
    setEditing(false)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!pending && state?.success) {
      onSuccess(onConfirm);
    }
    // eslint-disable-next-line
  }, [state])

  const onEmailChange = useCallback((e: any) => {
    e.preventDefault()
    const email = e.target.value
    setEmailAddress(email)
    const emailRegEx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!!email && email.length > 0) {
      if (emailRegEx.test(email)) {
        // check if email exists
        const url = new URL('/signup/steps/api/exists', window.location.origin)
        url.searchParams.append('email', email)
        abortController.abort()
        setChecking(true)
        const newAbortController = new AbortController()
        setAbortController(newAbortController)
        fetch(url, {
          signal: newAbortController.signal,
        })
          .then((response: Response) => response.json())
          .then((exists: boolean) => {
            setEmailExists(exists)
            setChecking(false)
          })
          .catch(() => {
            setEmailExists(false)
            setChecking(false)
          })
      } else {
        setChecking(true)
      }
    }
  }, [abortController])

  if (data === null) {
    return <LoadingComponent />
  }

  return isEditing ? (
    <form action={action} {...props} onSubmit={() => setLoading(true)}>
      <div className="flex flex-col sm:flex-row items-center justify-start">
        <TextInput
          width="100%"
          type="email"
          name="email"
          isInvalid={emailAddress !== data?.email && emailExists}
          value={emailAddress}
          onInput={onEmailChange}
        />
        <div className="flex justify-start">
          <div className="hidden sm:flex lg:hidden">
            <Tooltip
              content="Cancel"
            >
              <IconButton type="reset" icon={CrossIcon} disabled={pending || isLoading} intent="danger" appearance="minimal" title="Cancel" onClick={() => setEditing(false)} />
            </Tooltip>
          </div>
          <div className="flex sm:hidden lg:flex">
            <Button type="reset" disabled={pending || isLoading} marginLeft={8} intent="danger" appearance="minimal" iconBefore={CrossIcon} onClick={() => setEditing(false)}>Cancel</Button>
          </div>
          <div className="hidden sm:flex lg:hidden">
            <Tooltip
              content="Confirm"
            >
              <IconButton disabled={emailExists || isChecking} type="submit" icon={TickIcon} isLoading={pending || isLoading} intent="success" appearance="minimal" title="Confirm" />
            </Tooltip>
          </div>
          <div className="flex sm:hidden lg:flex">
            <Button disabled={emailExists || isChecking} marginLeft={2} type="submit" intent="success" appearance="minimal" isLoading={pending || isLoading} iconBefore={TickIcon} >Confirm</Button>
          </div>
        </div>
      </div>
    </form>
  ) : (
    <div className="flex items-center">
      <span className="text-xs sm:text-sm md:text-md">{data?.email}</span>
      <Button marginLeft={12} color="blue" appearance="minimal" onClick={() => setEditing(true)}>Change</Button>
      { data?.isEmailVerified ? (
        <div className="hidden sm:inline-flex font-sans ml-4 text-green-600 text-xs mt-1 font-semibold italic">Verified</div>
      ) : (
        !isVerificationSent ? (
          <button className="hidden sm:inline-block text-nowrap font-semibold text-blue-700 italic text-xs ml-4 hover:underline" onClick={onVerificationSent}>
            <WarningSignIcon color="warning" marginRight={4} />
            Resend Verification
          </button>
        ) : (
          <span className="hidden sm:inline-block text-nowrap font-semibold text-slate-700 italic text-xs ml-4">Verification Sent</span>
        )
      )}
    </div>
  )
}