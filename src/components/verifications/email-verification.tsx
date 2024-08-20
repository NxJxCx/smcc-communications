'use client';
import NotFoundPage from "@/components/errorpages/404";
import { useSession } from "@/components/useSession";
import VerifiedEmail from "@/components/verifications/verified-email";
import VerifySent from "@/components/verifications/verify-sent";
import { UserRoles } from "@/lib/models/interfaces";
import { decrypt, updateSession } from "@/lib/session";
import { sendEmailVerificationCode, verifyEmailVerificationCode } from "@/lib/twilio";
import { useCallback, useEffect, useMemo, useState } from "react";
import LoadingComponent from "../loading";
import VerifyNotSent from "./verify-not-sent";

export default function EmailVerificationComponent({ role = UserRoles.User, token, code }: { role?: UserRoles, token?: string, code?: string }) {
  const { data: session, status } = useSession({
    redirect: false
  })

  const [email, setEmail] = useState(null);
  const [roleData, setRoleData] = useState(null);
  const [display, setDisplay] = useState<React.ReactNode>(<LoadingComponent />);

  const onSendVerification = useCallback(async (ev: any) => {
    ev.preventDefault()
    if (email) {
      try {
        const result: any = await sendEmailVerificationCode(email as string, role);
        if (!result?.error) {
          setDisplay(<VerifySent email={email} />)
        } else {
          setDisplay(<VerifyNotSent email={email} errorMessage={result.error} />);
        }
      } catch (e) {
      }
    } else {
      setDisplay(<NotFoundPage />);
    }
  }, [email, role]);

  const failedVerifyDisplay = useMemo(() => (
    <div className="flex items-center justify-center min-h-screen p-5 bg-blue-100 min-w-screen">
      <div className="max-w-xl p-8 text-center text-gray-800 bg-white shadow-xl lg:max-w-3xl rounded-3xl lg:p-12">
        <h3 className="text-2xl">Email Verification Failed!</h3>
        <div className="flex justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-24 h-24 text-green-400" fill="none" viewBox="0 0 24 24"
            stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1"
              d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
          </svg>
        </div>

        <p>Let{"'"}s get your email address verified:</p>
        <div className="mt-4">
          <button onClick={onSendVerification} className="px-2 py-2 text-blue-200 bg-blue-600 rounded">
            Click to Verify Email
          </button>
        </div>
      </div>
    </div>
  ), [onSendVerification]);

  useEffect(() => {
    if (status !== 'loading' && code && token) {
      (async () => {
        const payload = await decrypt(token)
        if (payload && payload.email && payload.role) {
          setRoleData(payload.role);
          setEmail(payload.email);
        } else {
          setDisplay(<NotFoundPage />);
        }
      })()
    } else if (status !== 'loading') {
      setDisplay(<NotFoundPage />);
    }
  }, [status, code, token]);

  useEffect(() => {
    if (status === 'authenticated') {
      if (code && email && role === roleData) {
        if (session?.user.isEmailVerified) {
          setDisplay(<VerifiedEmail role={role} />);
        } else {
          verifyEmailVerificationCode(email, code, role)
            .then(async (isVerifiedStatus) => {
              await updateSession(role);
              setDisplay(isVerifiedStatus === 'approved' ? <VerifiedEmail role={role} /> : (
                isVerifiedStatus === 'invalid' ? <NotFoundPage /> : failedVerifyDisplay
              ));
            })
            .catch((_: any) => {
              setDisplay(<NotFoundPage />);
            })
        }
      }
    } else if (status === 'unauthenticated') {
      if (code && email && role === roleData) {
        verifyEmailVerificationCode(email, code, role)
          .then(async (isVerifiedStatus) => {
            setDisplay(isVerifiedStatus === 'approved' ? <VerifiedEmail role={role} /> : (
              isVerifiedStatus === 'invalid' ? <NotFoundPage /> : failedVerifyDisplay
            ));
          })
          .catch((_: any) => {
            setDisplay(<NotFoundPage />);
          })
      }
    }
    // eslint-disable-next-line
  }, [email, role]);

  return display;
}