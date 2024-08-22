'use client';
import BannerWithBreadcrumb from "@/app/(offices)/_components/banner-with-breadcrumb";
import CardContainer from "@/app/(offices)/_components/card-container";
import LoadingComponent from "@/components/loading";
import { Roles } from "@/lib/models/interfaces";
import { useSession } from "@/lib/useSession";
import { HomeIcon, PeopleIcon } from "evergreen-ui";
import { useMemo } from "react";
import AccountManagementTable from "../account-management";

export default function OBOAccountsPage() {

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
      label: 'OBO Accounts',
      url: '/' + session?.user.role + '/accounts/obo',
    }
  ], [session?.user.role])

  if (status === 'loading') {
    return <div className="h-screen w-full"><LoadingComponent /></div>
  }

  return status === 'authenticated' && (
    <>
      <BannerWithBreadcrumb
        role={session!.user.role}
        title="Account Management (OBO)"
        icon={PeopleIcon}
        description="Manage OBO Accounts"
        breadcrumb={breadcrumb}
      />
      <div className="p-6">
        <CardContainer title="OBO Accounts">
          <AccountManagementTable role={Roles.OBO} />
        </CardContainer>
      </div>
    </>
  )
}