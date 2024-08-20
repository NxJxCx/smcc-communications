'use client';;
import { changePassword } from "@/actions/auth";
import { UserRoles } from "@/lib/models/interfaces";
import { updateSession } from "@/lib/session";
import { ResponseFormState, SessionPayload } from "@/lib/types";
import clsx from "clsx";
import { Alert, Paragraph, StatusIndicator, toaster } from "evergreen-ui";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useFormState, useFormStatus } from "react-dom";
import CardContainer from "../../(offices)/card-container";
import ChangePasswordForm from "./change-password";

export default function ChangePasswordPageContent({ session } : { session: SessionPayload | null; }) {

  const role = useMemo(() => session?.user.role, [session?.user.role])

  const changePassAction = changePassword.bind(null, role as UserRoles);

  const [state, action] = useFormState<ResponseFormState>(
    changePassAction as any,
    undefined
  );

  const { pending } = useFormStatus()

  const router = useRouter();

  useEffect(() => {
    if (!pending && !!state?.success) {
      toaster.success('Password Changed Successfully', {
        description: 'Your Password Has Been Changed Successfully'
      })
      const upSession = updateSession.bind(null, session!.user.role);
      upSession().catch(console.log).finally(() => router.replace('/' + role))
    }
    // eslint-disable-next-line
  }, [state]);
  return (
    <div className="p-6">
      <CardContainer title="Change Password">
        <div className={clsx("flex flex-col justify-center", !!state?.errors ? "" : "pt-4")}>
        { !!state?.errors && (
          <Alert intent="danger" title={state!.message} marginBottom={16} maxWidth="300px" minWidth="300px" marginX="auto">
            {Object.keys(state!.errors).map((key: string, index: number) => (state!.errors as any)[key].map((msg: string, i: number) => (
              <StatusIndicator key={(index + 1) * (i + 1)} color="danger">
                <Paragraph color="danger">{msg}</Paragraph>
              </StatusIndicator>
            )))}
          </Alert>
        )}
        <ChangePasswordForm className="w-full max-w-[300px] mx-auto" action={action} state={state} pending={pending} />
        </div>
      </CardContainer>
    </div>
  )
}