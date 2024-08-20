'use client';;
import HamburgerIcon from "@/components/icons/hamburgerIcon";
import OBONavImageIconSmall from "@/components/icons/obo-nav-icon-small";
import NotificationsNav from "@/components/notifications/notifications";
import { useSession } from "@/components/useSession";
import { type UserRoles } from "@/lib/models/interfaces";
import { destroySession } from "@/lib/session";
import {
  Avatar,
  ChevronDownIcon,
  Icon,
  IconButton,
  LockIcon,
  LogOutIcon,
  Menu,
  OfficeIcon,
  Pane,
  PersonIcon,
  Popover,
  Position,
} from "evergreen-ui";
import Image from "next/image";
import NextLink from 'next/link';
import { usePathname } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { useSidebar } from "./sidebar-context";

export default function HeaderComponent() {
  const { data: session, status, notifications, markAsAllRead, markAsRead } = useSession({ redirect: false })
  const { toggleSidebar } = useSidebar()
  const pathname = usePathname()
  const [isShown, setIsShown] = useState<boolean|undefined>(undefined)
  const fullName = useMemo(() => {
    const firstName = session?.user?.firstName
    const middleName = session?.user?.middleName ? ' ' + session?.user?.middleName?.substring(0, 1).toUpperCase() + '.' : undefined
    const lastName = ' ' + session?.user?.lastName
    return [firstName, middleName, lastName].join(" ")
  }, [session?.user?.firstName, session?.user?.middleName, session?.user?.lastName]);
  const position = useMemo(() => session?.user?.position || undefined, [session?.user?.position])
  const role = useMemo(() => session?.user?.role || undefined, [session?.user?.role])

  const signout = destroySession.bind(null, role as UserRoles)

  const onLogout = useCallback(() => {
    signout()
      .then(async () => {
        window.location.href = '/' + role
      })
  }, [signout, role])

  return pathname === '/admin/login' || status !== 'authenticated' ? null : (
    <header className="sticky top-0 left-0 w-full h-[70px]">
      <nav className="mb-0 bg-emerald-700 h-full">
        <div className="flex flex-row justify-between h-full">
          <div className="flex flex-between space-x-4 ml-2">
            <Pane display="flex" alignItems="center">
              <IconButton icon={<HamburgerIcon />} onClick={() => toggleSidebar()} appearance="minimal" color="white" className="hover:text-black md:hidden" />
            </Pane>
            <div className="hidden md:flex justify-center items-center flex-grow">
              <div className='hidden lg:flex w-[280px]'>
                <NextLink href={"/" + role} prefetch={false}>
                  <div className="flex justify-start flex-nowrap min-h-[48px] space-x-0.5">
                    <Image alt="Logo" width="60" height="60" priority={true} className="h-full object-contain text-transparent w-full" src="/paboni.svg" />
                    <div className="whitespace-nowrap min-h-full justify-center flex flex-col leading-tight text-lime-50">
                      <div className="font-bold text-[11px]">OFFICE OF THE BUILDING OFFICIAL</div>
                      <div className="font-semibold text-[10px]">NASIPIT, AGUSAN DEL NORTE</div>
                    </div>
                  </div>
                </NextLink>
              </div>
              <div className="lg:hidden self-start">
                <NextLink href={"/" + role} prefetch={false} className="h-[50px] flex">
                  <OBONavImageIconSmall />
                </NextLink>
              </div>
            </div>
          </div>
          <div className="md:hidden">
            <NextLink href={"/" + role} prefetch={false} className="h-[50px] flex">
              <OBONavImageIconSmall />
            </NextLink>
          </div>
          <div className="h-full flex items-center justify-end space-x-6 mr-4">
            <NotificationsNav onMarkAsRead={markAsRead} onMarkAllRead={markAsAllRead} role={role} notifications={notifications} className="hidden md:block" />
            <Popover
              position={Position.BOTTOM_RIGHT}
              content={
                <Menu>
                  <Menu.Group>
                    <Menu.Item icon={OfficeIcon}>
                      <span className="font-bold uppercase">{role}</span>
                    </Menu.Item>
                    <Menu.Item>
                      <p className="md:hidden">{fullName}</p>
                      <p className="text-xs">{position}</p>
                    </Menu.Item>
                    <Menu.Item is={NextLink} icon={PersonIcon} href={'/' + role + '/settings/profile'}>
                      Profile
                    </Menu.Item>
                    <div className="md:hidden m-0 p-0">
                      <Menu.Item onClick={() => setIsShown(!isShown)} icon={<NotificationsNav onMarkAsRead={markAsRead} onMarkAllRead={markAsAllRead} role={role} isShown={isShown} onOpenComplete={() => setIsShown(undefined)} notifications={notifications} iconColor="gray700" className="md:hidden" />}>
                        Notifications
                      </Menu.Item>
                    </div>
                    <Menu.Item is={NextLink} href={'/' + role + '/settings/account'} icon={LockIcon}>
                      Account Settings
                    </Menu.Item>
                    <Menu.Item is={NextLink} href={'/' + role + '/settings/change'} icon={LockIcon}>
                      Change Password
                    </Menu.Item>
                  </Menu.Group>
                  <Menu.Divider />
                  <Menu.Group>
                    <Menu.Item icon={LogOutIcon} intent="danger" onClick={onLogout}>
                      Logout
                    </Menu.Item>
                  </Menu.Group>
                </Menu>
              }
            >
              <button className="mr-8">
                <div className="md:hidden">
                  <Avatar name={fullName} size={40} />
                </div>
                <div className="hidden md:block bg-green-50/70 hover:bg-green-50/90 py-2 px-3 rounded ">
                  <div>
                    <Icon icon={PersonIcon} />{' '}
                    {fullName}
                    {' '}<Icon icon={ChevronDownIcon} />
                  </div>
                </div>
              </button>
            </Popover>
          </div>
        </div>
      </nav>
    </header>
  )
}