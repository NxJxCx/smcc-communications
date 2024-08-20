'use client';
import { sendEmailVerificationCode } from "@/lib/twilio";
import { SessionPayload } from "@/lib/types";
import { WarningSignIcon } from "evergreen-ui";
import NextLink from 'next/link';
import { useCallback, useState } from "react";
import CardContainer from "../../(offices)/card-container";
import AccountSettingsEmailForm from "./email-change";
import AccountSettingsPhoneForm from "./phone-change";

export default function AccountsPageContent({ session, refresh } : { session: SessionPayload | null, refresh: () => void; }) {

  const [isEmailVerificationSent, setEmailVerificationSent] = useState<boolean>(false);
  const [hasErrorSent, setHasErrorSent] = useState<string | undefined>(undefined);

  const onSendEmailVerification = useCallback(async (ev?: any) => {
    ev?.preventDefault()
    setEmailVerificationSent(true)
    if (session?.user?.email && session?.user?.role) {
      try {
        const result: any = await sendEmailVerificationCode(session?.user.email as string, session!.user.role);
        if (!result?.error) {
          setHasErrorSent(result.error)
        }
      } catch (e) {
        console.log(e)
      }
    }
    // eslint-disable-next-line
  }, [session])

  const onSuccessRefresh = useCallback((setReset: () => void) => {
    refresh()
    setTimeout(() => setReset(), 1000)
  }, [refresh])

  return (
    <div className="p-6">
      <CardContainer title="Account Settings">
        <div className="grid grid-cols-1 md:grid-cols-5 items-center">
          <p className="font-semibold font-sans text-md md:col-span-2">
            <span>Email Address</span>
            { session?.user.isEmailVerified ? (
              <span className="inline-block sm:hidden text-green-600 ml-4 text-xs mt-1 italic">Verified</span>
            ) : (
              !isEmailVerificationSent ? (
                <button className="sm:hidden inline-block text-nowrap font-semibold text-blue-700 italic text-xs ml-4 hover:underline" onClick={onSendEmailVerification}>
                  <WarningSignIcon color="warning" marginRight={4} />
                  Resend Verification
                </button>
              ) : !!hasErrorSent ? (
                <span className="sm:hidden inline-block text-nowrap font-semibold text-red-700 italic text-xs ml-4">Verification Failed To Send. REASON: {hasErrorSent}</span>
              ) : (
                <span className="sm:hidden inline-block text-nowrap font-semibold text-slate-700 italic text-xs ml-4">Verification Sent</span>
              )
            )}
          </p>
          <AccountSettingsEmailForm
            className="md:col-span-3"
            data={session!.user}
            isVerificationSent={isEmailVerificationSent}
            onVerificationSent={onSendEmailVerification}
            onSuccess={onSuccessRefresh}
          />
        </div>
        <hr className="mb-3 mt-4" />
        <div className="grid grid-cols-1 md:grid-cols-5 items-center">
          <p className="font-semibold font-sans text-md md:col-span-2">
            <span>Phone Number</span>
            { session?.user.isPhoneVerified ? (
              <span className="inline-block sm:hidden text-green-600 ml-4 text-xs mt-1 italic">Verified</span>
            ) : (
              <NextLink title="Click to verify phone number" className="sm:hidden inline-flex text-xs italic text-blue-700 font-sans font-semibold text-nowrap ml-4" href={'/' + session?.user.role + '/phoneverify'}>
                <WarningSignIcon color="warning" marginRight={4} />
                Verify Phone Number
              </NextLink>
            )}
          </p>
          <AccountSettingsPhoneForm
            className="md:col-span-3"
            data={session!.user}
            onSuccess={onSuccessRefresh}
          />
        </div>
      </CardContainer>
    </div>
  )
}