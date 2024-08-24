'use client';
import { Roles } from "@/lib/modelInterfaces";
import { destroySession } from "@/lib/session";
import clsx from "clsx";
import { LogOutIcon } from "evergreen-ui";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";
import { useSidebar } from "./sidebar-context";
import smccLogo from "./smcc-logo.webp";

export default function SidebarComponent() {
  const { isSidebarOpen, sidebarNavigations } = useSidebar();
  const pathname = usePathname();
  const role = useMemo(() => pathname.substring(1).split('/')[0], [pathname])

  const signout = destroySession.bind(null, role as Roles)
  const onLogout = useCallback(() => {
    signout()
      .then(async () => {
        window.location.href = '/' + role
      })
  }, [signout, role])
  return (
    <aside className={clsx(
      "float-left min-w-[220px] max-w-[220px] p-2 bg-[#004aad] shadow flex-shrink text-white px-6",
      isSidebarOpen ? "relative" : "fixed -top-0 -left-[200%]",
    )}>
      <div className="w-full h-full flex flex-col items-start justify-start">
        <div className="w-full flex-shrink">
          <Image src={smccLogo} alt="SMCC Logo" width={60} height={60} className="mx-auto mt-4" />
          <h1 className="text-center mt-1 mb-2 font-[700] text-[22px]">OCS</h1>
          <div className="font-bold text-center text-blue-900 drop-shadow-lg rounded-lg mb-8 uppercase bg-sky-300 py-1">
            {role}
          </div>
        </div>
        {/* <!-- Side Navigation Bars --> */}
        <div className="w-full flex flex-col justify-start items-center gap-y-3 font-[600] flex-grow">
          { sidebarNavigations.map((sn, i: number) => (
            <Link key={i} href={sn.url || '#'} className={clsx(
              "w-full rounded-full text-left hover:border hover:border-yellow-500 pl-3 pr-1 py-1",
              pathname.split("?")[0] === sn.url ? "border border-black bg-sky-400 text-black" : "",
            )}>
              {sn.name}
            </Link>
          ))}
        </div>
        <div className="w-full flex flex-col justify-start items-center gap-y-4 font-[600] flex-shrink py-8">
          <button type="button" title="Logout" onClick={onLogout} className="w-full rounded-full text-left hover:border hover:border-yellow-500 pl-4 py-1">
            <div className="flex flex-nowrap gap-x-2 items-center"><LogOutIcon /><span>Logout</span></div>
          </button>
        </div>
      </div>
    </aside>
  )
}