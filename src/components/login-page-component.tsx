'use client';
import { LoginForm } from "@/components/forms/login";
import { useSession } from "@/components/useSession";
import { UserRoles } from "@/lib/models/interfaces";
import clsx from "clsx";
import { Image } from "evergreen-ui";
import { Nunito } from "next/font/google";
import { useEffect } from "react";
import LoadingComponent from "./loading";

const nunito = Nunito({ subsets: ['latin'] })

export default function LoginPageComponent({ role = UserRoles.User }: { role?: UserRoles}) {
  const { status } = useSession({
    redirect: false,
  });

  useEffect(() => {
    if (status === 'authenticated') {
      window.location.replace('/' + role)
    }
    // eslint-disable-next-line
  }, [status]);

  if (status === 'loading') {
    return <div className="h-screen w-full"><LoadingComponent /></div>
  }

  return status === 'authenticated' ? null : (
    <div className="max-w-sm mx-auto mt-2 mb-4 rounded-lg bg-white p-6 shadow">
      <div className="w-full flex justify-evenly">
        <Image src="/mon.svg" alt="logo" marginX="auto" marginY="10px" width="100px" />
        { (role !== UserRoles.User) && (
            <Image src="/paboni.svg" alt="logo" marginX="auto" marginY="15px" width="100px" />
          )
        }
      </div>
      <h2 className={clsx(nunito.className, "text-center font-semibold mb-4 text-xl text-emerald-500 uppercase")}>{role} LOGIN</h2>
      <LoginForm role={role} />
    </div>
  )
}