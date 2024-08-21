'use client';;
import BannerWithBreadcrumb from "@/app/(offices)/banner-with-breadcrumb";
import CardContainer from "@/app/(offices)/card-container";
import LoadingComponent from "@/components/loading";
import { useSession } from "@/components/useSession";
import { UserRoles } from "@/lib/models/interfaces";
import { HomeIcon, PeopleIcon } from "evergreen-ui";
import { useMemo } from "react";
import AccountManagementTable from "../account-management";

export default function UserAccountsPage() {

  const { data: session, status } = useSession({
    redirect: true,
  });

  const breadcrumb = useMemo(() => [
    {
      icon: HomeIcon,
      url: '/' + session?.user.role,
    },
    {
      label: 'Account Management',
      url: '/' + session?.user.role + '/accounts',
    },
    {
      label: 'User Accounts',
      url: '/' + session?.user.role + '/accounts/users',
    }
  ], [session?.user.role])


  if (status === 'loading') {
    return <div className="h-screen w-full"><LoadingComponent /></div>
  }

  return status === 'authenticated' && (
    <>
      <BannerWithBreadcrumb
        role={session!.user.role}
        title="Account Management (Users)"
        icon={PeopleIcon}
        description="Manage User Accounts"
        breadcrumb={breadcrumb}
      />
      <div className="p-6">
        <CardContainer title="User Accounts">
          <AccountManagementTable role={UserRoles.User} />
        </CardContainer>
      </div>
    </>
  )
}