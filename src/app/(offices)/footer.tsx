'use client'

import FooterGlobal from "@/components/footer"
import { useSession } from "@/components/useSession"
import { usePathname } from "next/navigation"

export default function FooterComponent() {
  const { status } = useSession({ redirect: false })
  const pathname = usePathname()

  return pathname === '/admin/login' || status !== 'authenticated' ? null : (
    <footer className="flex flex-col w-full">
      <FooterGlobal />
    </footer>
  )
}