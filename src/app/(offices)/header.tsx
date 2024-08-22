'use client';;
import { useSession } from "@/components/useSession";
import { type Roles } from "@/lib/models/interfaces";
import { destroySession } from "@/lib/session";
import { usePathname } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { useSidebar } from "./sidebar-context";

export default function HeaderComponent() {
  const { data: session, status, notifications, markAsAllRead, markAsRead } = useSession({ redirect: false })
  const { toggleSidebar } = useSidebar()
  const pathname = usePathname()
  const [isShown, setIsShown] = useState<boolean|undefined>(undefined)
  const role = useMemo(() => session?.user?.role || undefined, [session?.user?.role])

  const signout = destroySession.bind(null, role as Roles)
  const onLogout = useCallback(() => {
    signout()
      .then(async () => {
        window.location.href = '/' + role
      })
  }, [signout, role])

  return pathname === '/admin/login' || status !== 'authenticated' ? null : (
    <header className="sticky top-0 right-0 w-full h-[70px]">
      <nav className="mb-0 bg-emerald-700 h-full">
      </nav>
    </header>
  )
}