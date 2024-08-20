'use client';;
import LoadingComponent from "@/components/loading";
import { useSession } from "@/components/useSession";
import clsx from "clsx";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { UserRoles } from '../../lib/models/interfaces';
import SidebarComponent from "./sidebar";

export default function MainComponent({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { status } = useSession({ redirect: false })
  const pathname = usePathname()

  const isLoginPage = useMemo(() => Object.entries(UserRoles).map(([key,value]) => '/' + value + '/login').includes(pathname), [pathname])

  if (status === 'loading') {
    return <div className="h-screen w-full"><LoadingComponent /></div>
  }

  return isLoginPage ? <>{children}</> : (
    <main className={
      clsx(
        isLoginPage
        ? "container min-h-screen min-w-full max-w-full"
        : "container min-h-[calc(100vh-115px)] min-w-full flex justify-normal overflow-hidden"
      )}
    >
      {pathname !== '/admin/login' && <SidebarComponent />}
      <div className="flex-nowrap max-h-[calc(100vh-115px)] flex-grow overflow-auto">{children}</div>
    </main>
  )
}