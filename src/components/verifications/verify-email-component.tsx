'use client'

import { useSession } from "@/components/useSession";
import { UserRoles } from "@/lib/models/interfaces";
import { sendEmailVerificationCode } from "@/lib/twilio";
import { Spinner } from "evergreen-ui";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import LoadingComponent from "../loading";
import SendVerificationEmail from "./send-verification-email";
import VerifyNotSent from "./verify-not-sent";
import VerifySent from "./verify-sent";

export default function VerifyEmailComponent({ role = UserRoles.User, resend }: { role?: UserRoles; resend?: string; }) {
  const { data: session, status } = useSession({
    redirect: true,
  });

  const router = useRouter();

  const [display, setDisplay] = useState<React.ReactNode>(<LoadingComponent />);

  const onSendVerification = useCallback(async (ev?: any) => {
    ev?.preventDefault()
    if (session?.user?.email && role) {
      try {
        const result: any = await sendEmailVerificationCode(session?.user.email as string, role);
        if (!result?.error) {
          setDisplay(<VerifySent email={session?.user.email} />);
        } else {
          setDisplay(<VerifyNotSent email={session?.user.email} errorMessage={result.error} />);
        }
      } catch (e) {
        console.log(e)
      }
    }
    // eslint-disable-next-line
  }, [session, role])

  useEffect(() => {
    if (status === 'authenticated') {
      if (session?.user?.isEmailVerified) {
        if (!session?.user?.isPhoneVerified) {
          router.push("/" + role + "/phoneverify")
        } else {
          router.push("/" + role)
        }
      } else {
        if (!!resend) {
          onSendVerification().then();
        } else {
          setDisplay(<SendVerificationEmail email={session?.user.email} onSendVerification={onSendVerification} />)
        }
      }
    }
    // eslint-disable-next-line
  }, [status]);

  if (status !== "authenticated") {
    return (
      <div className="mt-20 mx-auto max-w-xl p-8 text-center text-gray-800 bg-white shadow-xl lg:max-w-3xl rounded-3xl lg:p-12">
        <Spinner />
      </div>
    );
  }

  return display;
}