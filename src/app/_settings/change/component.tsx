'use client';;
import BannerWithBreadcrumb from "@/app/(offices)/_components/banner-with-breadcrumb";
import LoadingComponent from "@/components/loading";
import { Roles } from "@/lib/modelInterfaces";
import { useSession } from "@/lib/useSession";
import { HomeIcon, LockIcon } from "evergreen-ui";
import { useEffect, useMemo } from "react";
import ChangePasswordPageContent from "./content";

export default function ChangePasswordPage() {

  const { data: session, status, refresh, update } = useSession({
    redirect: true,
  });

  const role = useMemo(() => session?.user.role, [session?.user.role])

  const breadcrumb = useMemo(() => [
    {
      icon: HomeIcon,
      url: '/' + role,
    },
    {
      label: 'Settings',
      url: '/' + role + '/settings',
    },
    {
      label: 'Change Password',
      url: '/' + role + '/settings/change',
    }
  ], [role])

  useEffect(() => {
    update()
    setTimeout(() => {
      refresh()
    }, 500)
    // eslint-disable-next-line
  }, [])

  if (status === 'loading') {
    return <div className="h-screen w-full"><LoadingComponent /></div>
  }

  return status === 'authenticated' && (
    <>
      <BannerWithBreadcrumb
        role={role as Roles}
        title="Change Password"
        icon={LockIcon}
        description="Change My Password"
        breadcrumb={breadcrumb}
      />
      <ChangePasswordPageContent session={session}/>
    </>
  )
}