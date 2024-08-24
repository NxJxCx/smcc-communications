'use client';
import { Roles } from "@/lib/modelInterfaces";
import { destroySession } from "@/lib/session";
import { useSession } from "@/lib/useSession";
import clsx from "clsx";
import { Avatar, ListIcon, LogOutIcon, Menu, NotificationsIcon } from "evergreen-ui";
import { usePathname } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { useSidebar } from "./sidebar-context";

export default function HeaderComponent() {
  const { data: session, status, notifications, markAsAllRead, markAsRead } = useSession({ redirect: false })
  const { toggleSidebar } = useSidebar()
  const pathname = usePathname()
  const [isShown, setIsShown] = useState<boolean|undefined>(undefined)
  const role = useMemo(() => session?.user?.role || undefined, [session?.user?.role])
  const toggleShown = useCallback(() => setIsShown(!isShown), [isShown])
  const signout = destroySession.bind(null, role as Roles)
  const onLogout = useCallback(() => {
    signout()
      .then(async () => {
        window.location.href = '/' + role
      })
  }, [signout, role])

  return (
    <header className="sticky right-0 top-0 w-full min-h-[70px] z-10">
      <nav className="mb-0 bg-white shadow h-full items-center">
        <div className="flex h-full gap-x-2 mb-3 flex-between items-center flex-nowrap pl-3 pr-8">
          <div className="flex-grow justify-start">
            <button type="button" title="Toggle Sidebar" onClick={toggleSidebar} className="flex-shrink flex items-center px-2 py-1 text-sm font-medium text-slate-800 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-slate-300">
              <ListIcon />
            </button>
          </div>
          <button onClick={toggleShown} className="flex-shrink flex flex-nowrap relative">
            {status === 'authenticated' && (
              <>
                <div className="flex-grow justify-end text-right">
                <div className="text-sm font-semibold text-slate-800 uppercase">
                  {session?.user?.fullName}
                </div>
                <div className="text-xs text-slate-700 capitalize">
                  {session?.user?.role === Roles.SuperAdmin ? "Super Admin" : session?.user?.role}
                </div>
              </div>
              <div className="min-h-full items-center justify-center flex pl-2">
                <Avatar name={session?.user?.fullName} size={40} />
              </div>
              <div className={
                clsx(
                  "top-full right-0 absolute mt-2 rounded-xl p-2 border border-slate-200 bg-white shadow-lg border-radius-md w-56",
                  isShown? "block" : "hidden",
                )
              }>
                <Menu>
                  <Menu.Group>
                    <Menu.Item
                      icon={NotificationsIcon}
                      onClick={() => setIsShown(false)}
                    >
                      Notifications ({notifications.filter(notification =>!notification.read).length})
                    </Menu.Item>
                  </Menu.Group>
                  <Menu.Group>
                    <Menu.Item
                      icon={LogOutIcon}
                      onClick={onLogout}
                    >
                      Logout
                    </Menu.Item>
                  </Menu.Group>
                </Menu>
              </div>
            </>
            )}
          </button>
        </div>
      </nav>
    </header>
  )
}