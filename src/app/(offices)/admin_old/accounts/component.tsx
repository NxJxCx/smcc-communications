'use client';
import LoadingComponent from "@/components/loading";
import { useSession } from "@/components/useSession";
import { HomeIcon, PeopleIcon } from "evergreen-ui";
import NextLink from 'next/link';
import { useMemo } from "react";
import BannerWithBreadcrumb from "../../banner-with-breadcrumb";
import CardContainer from "../../card-container";

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
        title="Account Management"
        icon={PeopleIcon}
        description="Account Management Menu"
        breadcrumb={breadcrumb}
      />
      <div className="p-6">
        <CardContainer title="Account Management">
          <div className="grid grid-cols-2 md:grid-cols-4">
            <div className="text-xs sm:text-sm md:text-md lg:text-lg p-2 lg:p-6 xl:p-10">
              <NextLink
                href={'/' + session?.user.role + '/accounts/users'}
                className="aspect-square font-bold uppercase text-white bg-green-600  rounded shadow-lg flex items-center justify-center flex-wrap text-center"
              >
                User Accounts
              </NextLink>
            </div>
            <div className="text-xs sm:text-sm md:text-md lg:text-lg p-2 lg:p-6 xl:p-10">
              <NextLink
                href={'/' + session?.user.role + '/accounts/obo'}
                className="aspect-square font-bold uppercase text-white bg-green-600  rounded shadow-lg flex items-center justify-center flex-wrap text-center"
              >
                OBO Accounts
              </NextLink>
            </div>
            <div className="text-xs sm:text-sm md:text-md lg:text-lg p-2 lg:p-6 xl:p-10">
              <NextLink
                href={'/' + session?.user.role + '/accounts/bfp'}
                className="aspect-square font-bold uppercase text-white bg-green-600  rounded shadow-lg flex items-center justify-center flex-wrap text-center"
              >
                BFP Accounts
              </NextLink>
            </div>
            <div className="text-xs sm:text-sm md:text-md lg:text-lg p-2 lg:p-6 xl:p-10">
              <NextLink
                href={'/' + session?.user.role + '/accounts/mpdc'}
                className="aspect-square font-bold uppercase text-white bg-green-600  rounded shadow flex items-center justify-center flex-wrap text-center"
              >
                MPDC Accounts
              </NextLink>
            </div>
          </div>
        </CardContainer>
      </div>
    </>
  )
}