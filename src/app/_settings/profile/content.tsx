'use client';;
import { updateProfile } from "@/actions/auth";
import { UserDocument, UserRoles } from "@/lib/models/interfaces";
import { ResponseFormState, SessionPayload } from "@/lib/types";
import clsx from "clsx";
import { Alert, Button, CrossIcon, EditIcon, Paragraph, StatusIndicator, toaster } from "evergreen-ui";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useFormState } from "react-dom";
import CardContainer from "../../(offices)/card-container";
import ProfileSettingsForm from "./profile-settings";

export default function ProfilePageContent({ session, refresh } : { session: SessionPayload | null; refresh: () => void; }) {

  const role = useMemo(() => session?.user.role, [session?.user.role])

  const [isEditing, setEditing] = useState<boolean>(false)
  const [userData, setUserData] = useState<UserDocument|null>(null)

  const profileChangeAction = updateProfile.bind(null, role as UserRoles)
  const [state, action, pending] = useFormState<ResponseFormState>(
    profileChangeAction as any,
    undefined
  )

  const onCancel = useCallback(() => {
    setEditing(false)
  }, [])

  const fetchUser = useCallback(() => {
    const url = new URL('/' + session?.user?.role + '/api/profile', window.location.origin)
    url.searchParams.append('role', role || '')
    fetch(url)
      .then(response => response.json())
      .then(({ data }: { data: UserDocument }) => {
        setUserData(data)
        setEditing(true)
        setEditing(false)
      })
      .catch(console.log)
  }, [session, role]);

  const fetchTheUser = useCallback(() => {
    refresh()
    fetchUser()
  }, [fetchUser, refresh]);

  useEffect(() => {
    if (!pending && state?.success) {
      toaster.success(state!.message);
      fetchTheUser();
    }
    // eslint-disable-next-line
  }, [state])

  useEffect(() => {
    setTimeout(() => {
      fetchTheUser()
    }, 500)
    // eslint-disable-next-line
  }, [])

  return (
    <div className="p-6">
      <CardContainer title={<div className="flex justify-between"><span>Profile Settings</span><span>{!isEditing ? <Button onClick={() => setEditing(true)} iconBefore={EditIcon} size="small">Edit</Button> : <Button size="small" intent="danger" iconBefore={CrossIcon} onClick={onCancel}>Cancel Edit</Button>}</span></div>}>
        <div className={clsx("flex flex-col justify-center", !!state?.errors ? "" : "pt-4")}>
        { isEditing && !!state?.errors && (
          <Alert intent="danger" title={state!.message} marginBottom={16} maxWidth="300px" minWidth="300px" marginX="auto">
            {Object.keys(state!.errors).map((key: string, index: number) => (state!.errors as any)[key].map((msg: string, i: number) => (
              <StatusIndicator key={(index + 1) * (i + 1)} color="danger">
                <Paragraph color="danger">{msg}</Paragraph>
              </StatusIndicator>
            )))}
          </Alert>
        )}
        <ProfileSettingsForm className="px-4 gap-4 md:px-10 md:gap-10 lg:px-20 lg:gap-20 grid grid-cols-1 md:grid-cols-2" data={userData} isEditing={isEditing} onCancel={onCancel} action={action} state={state} pending={pending} />
        </div>
      </CardContainer>
    </div>
  )
}