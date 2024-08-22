'use client';;
import { useSession } from "@/components/useSession";
import clsx from "clsx";
import { Avatar } from "evergreen-ui";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";
import { useSidebar } from "./sidebar-context";

export default function SidebarComponent() {
  const { data: session, status } = useSession({ redirect: false });
  const { isSidebarOpen, sidebarNavigations } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();
  const role = useMemo(() => session?.user?.role || undefined, [session?.user?.role])

  return pathname === '/admin/login' || status !== 'authenticated' ? null : (
    <aside className={clsx(
      "float-left min-w-[220px] max-w-[220px] p-2 bg-blue-800 shadow flex-shrink",
      isSidebarOpen ? "relative" : "fixed -top-0 -left-[200%]",
    )}>
      <div className="w-full">
        <div className="font-bold text-center text-black rounded-sm mb-3 uppercase bg-sky-400 py-1">
          {role}
        </div>
        <div className="flex flex-row space-x-2 mb-3">
          <div className="min-h-full items-center justify-center flex">
            <Avatar name={session?.user?.fullName} size={30} />
          </div>
          <div className="flex-grow">
            <div className="text-sm font-semibold text-slate-800">
              {session?.user?.fullName}
            </div>
            <div className="text-xs text-slate-700">
              {session?.user?.email}
            </div>
          </div>
        </div>
      </div>
      {/* <!-- Side Navigation Bars --> */}
      <div className="w-full flex flex-col justify-center items-center px-8 gap-y-8 font-[600]">
        { sidebarNavigations.map((sn, i: number) => (
          <Link key={i} href={sn.url || '#'} className={clsx(
            "w-full rounded-full text-left pl-4 hover:border hover:border-yellow-500",
            pathname.startsWith(sn.url || "#") ? "border border-black bg-sky-400 text-black" : "",
          )}>
            {sn.name}
          </Link>
        ))}
      </div>
    </aside>
  )
}