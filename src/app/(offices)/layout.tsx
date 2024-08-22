import FooterComponent from './footer';
import HeaderComponent from './header';
import SidebarComponent from "./sidebar";

export default function OfficeLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (<>
    <SidebarComponent />
    <main>
      <HeaderComponent />
      {children}
    </main>
    <FooterComponent />
  </>)
}