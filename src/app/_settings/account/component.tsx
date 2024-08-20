'use client';
import BannerWithBreadcrumb from "@/app/(offices)/banner-with-breadcrumb";
import LoadingComponent from "@/components/loading";
import { useSession } from "@/components/useSession";
import { HomeIcon, SettingsIcon } from "evergreen-ui";
import { useEffect, useMemo } from "react";
import AccountsPageContent from "./content";

export default function AccountSettingsPage() {

  const { data: session, status, refresh, update } = useSession({
    redirect: true,
  });

  const breadcrumb = useMemo(() => [
    {
      icon: HomeIcon,
      url: '/' + session?.user.role,
    },
    {
      label: 'Settings',
      url: '/' + session?.user.role + '/settings',
    },
    {
      label: 'Account Settings',
      url: '/' + session?.user.role + '/settings/account',
    }
  ], [session?.user.role])

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
        role={session!.user.role}
        title="Account Settings"
        icon={SettingsIcon}
        description="My Account Settings"
        breadcrumb={breadcrumb}
      />
      <AccountsPageContent session={session} refresh={refresh} />
    </>
  )
}