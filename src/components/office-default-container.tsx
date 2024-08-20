import Footer from "@/app/(user)/user/footer";
import Image from "next/image";
import Link from "next/link";

export default function OfficeDefaultContainer({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen md:pt-16 relative">
      <Link href="/" className="flex justify-center pt-4">
        <Image src="/paboni.svg" alt="logo" width="80" height="100" className="md:top-7 md:absolute md:left-4" />
        <div className="flex justify-start flex-nowrap min-h-[48px] space-x-0.5 md:top-8 md:absolute md:left-28">
          <Image alt="Logo" width="60" height="60" priority={true} className="h-full object-contain text-transparent" src="/mon.svg" />
          <div className="whitespace-nowrap min-h-full justify-center flex flex-col leading-tight text-lime-900">
            <div className="font-bold text-[11px]">MUNICIPALITY OF NASIPIT</div>
            <div className="font-semibold text-[10px]">OFFICE OF THE BUILDING OFFICIAL</div>
          </div>
        </div>
      </Link>
      <div className="mt-16 mb-6">
        {children}
      </div>
      <br />
      <Footer />
    </div>
  )
}