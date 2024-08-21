import { SessionProvider } from "@/components/useSession";
import { UserRoles } from "@/lib/models/interfaces";
import { Metadata } from "next";
import FooterComponent from "../footer";
import HeaderComponent from "../header";
import MainComponent from "../main";
import SidebarProvider from "../sidebar-context";

export const metadata: Metadata = {
  title: "Admin",
};


export default function Layout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SessionProvider role={UserRoles.Admin}>
      <SidebarProvider role={UserRoles.Admin}>
        <HeaderComponent />
        <MainComponent>
          {children}
        </MainComponent>
        <FooterComponent />
      </SidebarProvider>
    </SessionProvider>
  );
}