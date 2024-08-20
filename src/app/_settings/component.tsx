'use client';
import LoadingComponent from "@/components/loading";
import { useSession } from "@/components/useSession";
import { CogIcon, HomeIcon } from "evergreen-ui";
import NextLink from 'next/link';
import { useMemo } from "react";
import BannerWithBreadcrumb from "../(offices)/banner-with-breadcrumb";
import CardContainer from "../(offices)/card-container";

export default function AccountsPage() {

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
  ], [session?.user.role])

  if (status === 'loading') {
    return <div className="h-screen w-full"><LoadingComponent /></div>
  }

  return status === 'authenticated' && (
    <>
      <BannerWithBreadcrumb
        role={session!.user.role}
        title="Settings"
        icon={CogIcon}
        description="Settings Menu"
        breadcrumb={breadcrumb}
      />
      <div className="p-6">
        <CardContainer title="Settings">
          <div className="grid grid-cols-2 md:grid-cols-4">
            <div className="text-xs sm:text-sm md:text-md lg:text-lg p-2 lg:p-6 xl:p-10">
              <NextLink
                href={'/' + session?.user.role + '/settings/profile'}
                className="aspect-square font-bold uppercase text-white bg-green-600  rounded shadow-lg flex items-center justify-center flex-wrap text-center"
              >
                Profile Settings
              </NextLink>
            </div>
            <div className="text-xs sm:text-sm md:text-md lg:text-lg p-2 lg:p-6 xl:p-10">
              <NextLink
                href={'/' + session?.user.role + '/settings/account'}
                className="aspect-square font-bold uppercase text-white bg-green-600  rounded shadow-lg flex items-center justify-center flex-wrap text-center"
              >
                Account Settings
              </NextLink>
            </div>
            <div className="text-xs sm:text-sm md:text-md lg:text-lg p-2 lg:p-6 xl:p-10">
              <NextLink
                href={'/' + session?.user.role + '/settings/change'}
                className="aspect-square font-bold uppercase text-white bg-green-600  rounded shadow-lg flex items-center justify-center flex-wrap text-center"
              >
                Change Password
              </NextLink>
            </div>
          </div>
        </CardContainer>
      </div>
    </>
  )
}