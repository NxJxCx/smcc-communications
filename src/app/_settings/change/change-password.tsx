'use client'

import { FormButton } from "@/components/forms/button";
import { Button, TextInputField } from "evergreen-ui";
import { useRouter } from "next/navigation";

export default function ChangePasswordForm({
  onCurrentPassword,
  onNewPassword,
  onConfirmPassword,
  action = () => {},
  pending = false,
  state,
  ...props
} : {
  onCurrentPassword?: (value: string) => void,
  onNewPassword?: (value: string) => void,
  onConfirmPassword?: (value: string) => void,
  action?: () => void,
  pending?: boolean,
  state: any,
} & React.HTMLAttributes<HTMLFormElement>) {
  const router = useRouter()
  return (
    <form action={action} {...props}>
      <TextInputField
        type="password"
        label="Current Password"
        name="current_password"
        onChange={(ev: any) => onCurrentPassword && onCurrentPassword(ev.target.value)}
        disabled={pending}
      />
      <TextInputField
        type="password"
        label="New Password"
        name="new_password"
        onChange={(ev: any) => onNewPassword && onNewPassword(ev.target.value)}
        disabled={pending}
      />
      <TextInputField
        type="password"
        label="Confirm Password"
        name="confirm_password"
        onChange={(ev: any) => onConfirmPassword && onConfirmPassword(ev.target.value)}
        disabled={pending}
      />
      <div className="w-full flex justify-evenly">
        <FormButton appearance="primary" intent="success" label="Change Password" />
        <Button onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  )
}