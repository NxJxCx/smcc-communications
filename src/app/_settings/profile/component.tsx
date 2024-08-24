'use client';;
export default function ProfileSettingsPage() {

  // const { data: session, status, refresh, update } = useSession({
  //   redirect: true,
  // });

  // const role = useMemo(() => session?.user.role, [session?.user.role])

  // const breadcrumb = useMemo(() => [
  //   {
  //     icon: HomeIcon,
  //     url: '/' + role,
  //   },
  //   {
  //     label: 'Settings',
  //     url: '/' + role + '/settings',
  //   },
  //   {
  //     label: 'Profile Settings',
  //     url: '/' + role + '/settings/profile',
  //   }
  // ], [role])

  // useEffect(() => {
  //   update()
  //   // eslint-disable-next-line
  // }, [])

  // if (status === 'loading') {
  //   return <div className="h-screen w-full"><LoadingComponent /></div>
  // }

  // return status === 'authenticated' &&  (
  //   <>
  //     <BannerWithBreadcrumb
  //       role={session!.user.role}
  //       title="Profile Settings"
  //       icon={PersonIcon}
  //       description="My Profile Settings"
  //       breadcrumb={breadcrumb}
  //     />
  //     <ProfilePageContent session={session} refresh={refresh} />
  //   </>
  // )
  return
}