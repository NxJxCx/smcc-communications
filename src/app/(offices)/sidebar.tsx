'use client';;
import { useSession } from "@/components/useSession";
import { ArrowTopRightIcon, Avatar, Button, Menu } from "evergreen-ui";
import { usePathname, useRouter } from "next/navigation";
import { Fragment, useMemo } from "react";
import { useSidebar } from "./sidebar-context";
import clsx from "clsx";

export default function SidebarComponent() {
  const { data: session, status } = useSession({ redirect: false });
  const { isSidebarOpen, sidebarNavigations } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();
  const fullName = useMemo(() => {
    const firstName = session?.user?.firstName
    const middleName = session?.user?.middleName ? ' ' + session?.user?.middleName?.substring(0, 1).toUpperCase() + '.' : undefined
    const lastName = ' ' + session?.user?.lastName
    return [firstName, middleName, lastName].join(" ")
  }, [session?.user?.firstName, session?.user?.middleName, session?.user?.lastName]);
  const position = useMemo(() => session?.user?.position || undefined, [session?.user?.position])
  const role = useMemo(() => session?.user?.role || undefined, [session?.user?.role])

  return pathname === '/admin/login' || status !== 'authenticated' ? null : (
    <aside className={clsx(
      "float-left min-w-[220px] max-w-[220px] p-2 bg-red-50 shadow flex-shrink",
      isSidebarOpen ? "relative" : "fixed -top-0 -left-[200%]",
    )}>
      <div className="w-full">
        <div className="font-bold text-center text-orange-100 rounded-sm mb-3 uppercase bg-green-800 py-1">
          {role}
        </div>
        <div className="flex flex-row space-x-2 mb-3">
          <div className="min-h-full items-center justify-center flex">
            <Avatar name={fullName} size={30} />
          </div>
          <div className="flex-grow">
            <div className="text-sm font-semibold text-slate-800">
              {fullName}
            </div>
            <div className="text-xs text-slate-700">
              {position}
            </div>
          </div>
        </div>
      </div>
      {/* <!-- Side Navigation Bars --> */}
      <Menu>
        {sidebarNavigations.map((navigation) => navigation.children ? (
          <Fragment key={navigation.name}>
            <Menu.Group>
              <Menu.Item
                is={Button}
                disabled={true}
                maxWidth="100%"
                minWidth="100%"
                icon={navigation.icon}
              >
                {navigation.name}
              </Menu.Item>
              <Menu.Divider />
              {navigation.children.map((child) => (
                <Menu.Item
                  key={child.name}
                  alignContent={"end"}
                  is={Button}
                  iconAfter={ArrowTopRightIcon}
                  maxWidth="100%"
                  minWidth="100%"
                  isActive={pathname === child.url}
                  intent={pathname === child.url ? "green600" : undefined}
                  onClick={() => router.push(child.url || '#')}
                >
                  {child.name}
                </Menu.Item>
              ))}
            </Menu.Group>
          </Fragment>
          ) : (
          <Fragment key={navigation.name}>
            <Menu.Group>
              <Menu.Item
                key={navigation.name}
                alignContent={"end"}
                is={Button}
                icon={navigation.icon}
                iconAfter={ArrowTopRightIcon}
                maxWidth="100%"
                minWidth="100%"
                intent={pathname === navigation.url? 'success': 'default'}
                onClick={() => router.push(navigation.url || '#')}
              >
                {navigation.name}
              </Menu.Item>
            </Menu.Group>
          </Fragment>
          ))}
      </Menu>
    </aside>
  )
}