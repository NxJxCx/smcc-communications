'use client';;
import { UserRoles } from "@/lib/models/interfaces";
import { useSession } from "@/components/useSession";
import { Alert, Link } from "evergreen-ui";
import { useEffect, useState } from "react";

export default function AlertComponent({ role = UserRoles.User }: { role?: UserRoles }) {
  const { data: session, status } = useSession({ redirect: false })
  const [alertMessage, setAlertMessage] = useState<any>({
    intent: 'warning',
    title: '',
    message: '',
    show: false,
  })

  useEffect(() => {
    if (status === 'authenticated' && !session?.user.isEmailVerified) {
      setAlertMessage({
        intent: 'warning',
        title: 'Your account is not yet verified.',
        message: <p className="mt-2 text-sm">Email Address not verified. <Link href={`/${role}/verify?resend=true`} fontWeight="bold">Resend Verification Code</Link></p>,
        show: true,
      })
    }
    // eslint-disable-next-line
  }, [status, session?.user.isEmailVerified]);

  return status !== 'authenticated' ? null : ( alertMessage.show &&
    <Alert
      intent="warning"
      title={alertMessage.title}
      borderRadius={0}
    >
      {alertMessage.message}
    </Alert>
  )
}