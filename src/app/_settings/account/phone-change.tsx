'use client';
import { changeContactNo } from "@/actions/auth";
import LoadingComponent from "@/components/loading";
import { ResponseFormState, UserSessionProp } from "@/lib/types";
import { Button, CrossIcon, Group, IconButton, TextInput, TickIcon, Tooltip, WarningSignIcon } from "evergreen-ui";
import { useCallback, useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import NextLink from 'next/link';

export default function AccountSettingsPhoneForm({
  data,
  onSuccess = (setReset: () => void) => {},
  ...props
} : {
  data: UserSessionProp|null,
  onSuccess: (setReset: () => void) => void,
} & React.HTMLAttributes<HTMLFormElement>) {
  const [contactNo, setContactNo] = useState<string|undefined>(data?.contactNo?.substring(3))
  const [phoneExists, setPhoneExists] = useState<boolean>(true)
  const [isChecking, setChecking] = useState<boolean>(false)
  const [abortController, setAbortController] = useState<AbortController>(new AbortController())
  const [isEditing, setEditing] = useState<boolean>(false)
  const [isLoading, setLoading] = useState<boolean>(false)
  const phoneChangeAction = changeContactNo.bind(null, data?.role || null);
  const [state, action] = useFormState<ResponseFormState>(phoneChangeAction as any, undefined)

  const { pending } = useFormStatus()

  useEffect(() => {
    if (!isEditing) {
      setContactNo(data?.contactNo?.substring(3))
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

  const onPhoneChange = useCallback((e: any) => {
    e.preventDefault()
    const contact = e.target.value
    setContactNo(contact)
    const phoneNo = '+63' + contact;
    const phoneRegEx = /^\+639[0-9]{9}$/;
    if (!!contact && contact.length > 0) {
      if (phoneRegEx.test(phoneNo)) {
        // check if phone exists
        const url = new URL('/signup/steps/api/exists', window.location.origin)
        url.searchParams.append('phone', phoneNo)
        abortController.abort()
        setChecking(true)
        const newAbortController = new AbortController()
        setAbortController(newAbortController)
        fetch(url, {
          signal: newAbortController.signal,
        })
          .then((response: Response) => response.json())
          .then((exists: boolean) => {
            setPhoneExists(exists)
            setChecking(false)
          })
          .catch(() => {
            setPhoneExists(false)
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
        <Group>
          <TextInput
            disabled={true}
            value={"+63"}
            maxWidth={50}
          />
          <TextInput
            width="100%"
            type="tel"
            name="contactNo"
            isInvalid={contactNo !== "+639" + data?.contactNo && phoneExists}
            value={contactNo}
            onInput={onPhoneChange}
          />
        </Group>
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
              <IconButton disabled={phoneExists || isChecking} type="submit" icon={TickIcon} isLoading={pending || isLoading} intent="success" appearance="minimal" title="Confirm" />
            </Tooltip>
          </div>
          <div className="flex sm:hidden lg:flex">
            <Button disabled={phoneExists || isChecking} marginLeft={2} type="submit" intent="success" appearance="minimal" isLoading={pending || isLoading} iconBefore={TickIcon} >Confirm</Button>
          </div>
        </div>
      </div>
    </form>
  ) : (
    <div className="flex items-center">
      <span className="text-xs sm:text-sm md:text-md">{data?.contactNo}</span>
      <Button marginLeft={12} color="blue" appearance="minimal" onClick={() => setEditing(true)}>Change</Button>
      { data?.isPhoneVerified ? (
        <div className="hidden sm:inline-flex font-sans ml-4 text-green-600 text-xs mt-1 font-semibold italic">Verified</div>
      ) : (
        <NextLink title="Click to verify phone number" className="hidden sm:inline-flex text-xs italic text-blue-700 font-sans font-semibold text-nowrap ml-4" href={'/' + data?.role + '/phoneverify'}>
          <WarningSignIcon color="warning" marginRight={4} />
          Verify Phone Number
        </NextLink>
      )}
    </div>
  )
}