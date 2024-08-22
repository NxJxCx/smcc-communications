import { Roles } from "@/lib/models/interfaces";
import { SessionProvider } from "@/lib/useSession";
import { Metadata } from "next";
import FooterComponent from "../_components/footer";
import HeaderComponent from "../_components/header";
import SidebarProvider from "../_components/sidebar-context";
import MainComponent from "../main";

export const metadata: Metadata = {
  title: "Admin",
};


export default function Layout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SessionProvider role={Roles.Admin}>
      <SidebarProvider role={Roles.Admin}>
        <HeaderComponent />
        <MainComponent>
          {children}
        </MainComponent>
        <FooterComponent />
      </SidebarProvider>
    </SessionProvider>
  );
}