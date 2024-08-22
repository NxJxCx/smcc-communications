'use client';
import { useSession } from "@/lib/useSession";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { SidebarNavigation, getSidebarNavigations } from "./sidebar-navigations";

export const SidebarContext = createContext<{
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  openSidebar: () => void;
  sidebarNavigations: SidebarNavigation[];
}>({
  isSidebarOpen: false,
  toggleSidebar: () => {},
  closeSidebar: () => {},
  openSidebar: () => {},
  sidebarNavigations: []
})

export default function SidebarProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true)
  const { data: sessionData, status } = useSession({ redirect: false })
  const role = useMemo(() => status === 'authenticated' ? sessionData?.user?.role || undefined : undefined, [status, sessionData])
  const sidebarNavigations = useMemo(() => getSidebarNavigations(role), [role])
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(!isSidebarOpen)
  }, [isSidebarOpen]);

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false)
  }, []);

  const openSidebar = useCallback(() => {
    setIsSidebarOpen(true)
  }, []);

  return (
    <SidebarContext.Provider value={{
      isSidebarOpen,
      toggleSidebar,
      closeSidebar,
      openSidebar,
      sidebarNavigations
    }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  const { isSidebarOpen, toggleSidebar, closeSidebar, openSidebar, sidebarNavigations } = context

  return {
    isSidebarOpen,
    toggleSidebar,
    closeSidebar,
    openSidebar,
    sidebarNavigations
  }
}