'use client';;
import { assignPermit } from "@/actions/assign";
import BannerWithBreadcrumb from "@/app/(offices)/banner-with-breadcrumb";
import CardContainer from "@/app/(offices)/card-container";
import { FormButton } from "@/components/forms/button";
import LoadingComponent from "@/components/loading";
import { useSession } from "@/components/useSession";
import { UserDocument } from "@/lib/models/interfaces";
import { ResponseFormState } from "@/lib/types";
import { Button, HomeIcon, Paragraph, PeopleIcon, SelectField, toaster } from "evergreen-ui";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";


export default function AssignPage() {

  const { data: session, status } = useSession({
    redirect: true,
  });

  const role = useMemo(() => session?.user.role, [session?.user.role])

  const breadcrumb = useMemo(() => [
    {
      icon: HomeIcon,
      url: '/' + role,
    },
    {
      label: 'Assign to permits',
      url: '/' + role + '/assign',
    },
  ], [role])

  const displayFullName = useCallback((user: UserDocument) => {
    return `${user.firstName} ${!user.middleName ? '' : user.middleName[0] + '. '}${user.lastName}`
  }, []);

  const displayOption = useCallback((user: UserDocument) => {
    return `${displayFullName(user)} -- ${user.position} -- (${user.role.toUpperCase()})`
  }, [displayFullName]);


  const [officeUsers, setOfficeUsers] = useState<UserDocument[]>([])
  const [selected, setSelected] = useState<{ recommendingApproval?: string; permitIssuedBy?: string; }>({
    recommendingApproval: undefined,
    permitIssuedBy: undefined,
  })

  const selectedPermitIssued = useMemo(() => officeUsers.find((user) => user._id === selected?.permitIssuedBy), [selected, officeUsers])
  const selectedRecommendingApproval = useMemo(() => officeUsers.find((user) => user._id === selected?.recommendingApproval), [selected, officeUsers])

  const [state, action] = useFormState<ResponseFormState>(
    assignPermit as any,
    undefined
  );

  const { pending } = useFormStatus()
  const [loading, setLoading] = useState(false)

  const fetchOfficeUsers = useCallback(() => {
    setLoading(true);
    const url = new URL('/' + role + '/api/office-users', window.location.origin)
    fetch(url)
      .then(response => response.json())
      .then(({data, assignedIds }) => {
        setOfficeUsers(data)
        setSelected(assignedIds)
      })
      .catch(console.log)
      .finally(() => setLoading(false))
  }, [role])

  useEffect(() => {
    fetchOfficeUsers()
  }, [fetchOfficeUsers]);

  useEffect(() => {
    if (!pending && state?.success) {
      toaster.success(state!.message)
      fetchOfficeUsers()
    }
    // eslint-disable-next-line
  }, [state])

  if (status === 'loading') {
    return <div className="h-screen w-full"><LoadingComponent /></div>
  }

  return status === 'authenticated' && (
    <>
      <BannerWithBreadcrumb
        role={session!.user.role}
        title="Assign to permits"
        icon={PeopleIcon}
        description="Assign office user names to permits"
        breadcrumb={breadcrumb}
      />
      <div className="p-6">
        <CardContainer title="Assign office user names to permits">
          <form action={action}>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-1/2">
                { loading ? <LoadingComponent /> : (
                  <SelectField
                    name="recommendingApproval"
                    label="RECOMMENDING APPROVAL FOR PERMIT PURPOSE"
                    value={selected?.recommendingApproval}
                    onChange={(ev: any) => setSelected({ ...selected, recommendingApproval: ev.target.value })}
                    required
                  >
                    <option>-- select one --</option>
                    {officeUsers.map((user) => (
                      <option key={user._id} value={user._id}>{displayOption(user)}</option>
                    ))}
                  </SelectField>
                )}
              </div>
              <div className="w-full md:w-1/2">
                { loading ? <LoadingComponent /> : (
                  <SelectField
                    name="permitIssuedBy"
                    label="PERMIT ISSUED BY"
                    value={selected?.permitIssuedBy}
                    onChange={(ev: any) => setSelected({ ...selected, permitIssuedBy: ev.target.value })}
                    required
                  >
                    <option>-- select one--</option>
                    {officeUsers.map((user) => (
                      <option key={user._id} value={user._id}>{displayOption(user)}</option>
                    ))}
                  </SelectField>
                )}
              </div>
            </div>
            <Paragraph fontWeight={600} marginBottom={4}>Preview:</Paragraph>
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              {!!selectedRecommendingApproval && !loading ? (
                <div className="w-full md:w-1/2 font-[Arial] font-bold text-[12pt] flex flex-col items-center border rounded-sm min-h-[100px] pb-2">
                  <div className="w-full font-normal text-[10pt] p-2">Recommending approval for permit purpose:</div>
                  <p className="underline">{displayFullName(selectedRecommendingApproval)}</p>
                  <p className="text-[10pt]">{selectedRecommendingApproval.position}</p>
                  <p className="text-[8pt]">(Signature Over Printed Name)</p>
                </div>
              ) : <div className="w-full md:w-1/2">&nbsp;</div>}
              {!!selectedPermitIssued && !loading ? (
                <div className="w-full md:w-1/2 font-[Arial] font-bold text-[12pt] flex flex-col items-center border rounded-sm min-h-[100px] pb-2">
                  <div className="w-full font-normal text-[10pt] p-2">PERMIT ISSUED BY:</div>
                  <p className="underline">{displayFullName(selectedPermitIssued)}</p>
                  <p className="text-[10pt]">{selectedPermitIssued.position}</p>
                  <p className="text-[8pt]">(Signature Over Printed Name)</p>
                </div>
              ) : <div className="w-full md:w-1/2">&nbsp;</div>}
            </div>
            <FormButton type="submit" marginRight={8} disabled={loading} label="SAVE" intent="success" appearance="primary" fontWeight="bold" />
            <Button type="reset" disabled={pending} isLoading={loading} onClick={() => {
              fetchOfficeUsers()
            }}>Cancel</Button>
          </form>
        </CardContainer>
      </div>
    </>
  )
}