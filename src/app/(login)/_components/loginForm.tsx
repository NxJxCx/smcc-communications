'use client';;
import { login } from '@/actions/auth';
import { useSession } from '@/components/useSession';
import { Roles } from '@/lib/models/interfaces';
import { toaster } from 'evergreen-ui';
import { redirect, useRouter } from "next/navigation";
import { useEffect } from 'react';
import { useFormState } from 'react-dom';

export default function LoginForm({
  role,
}: Readonly<{
  role: Roles,
}>) {
  const { status, refresh, data: sessionData } = useSession({ redirect: false })
  const loginAction = login.bind(null, role)
  const [state, formAction, pending] = useFormState(loginAction, undefined)
  const router = useRouter()
  useEffect(() => {
    if (!pending && state?.success) {
      toaster.success(state.message, { description: "Redirecting to home page...", duration: 3000, id: "login" })
      refresh()
    } else if (!pending && state?.errors) {
      toaster.danger(state.message, { duration: 3000, id: "login" })
    }
  }, [state, pending, refresh])

  if (status === 'authenticated') {
    if (sessionData?.user?.role === role) {
      redirect("/" + role)
    }
  }

  return (
    <div className="flex flex-col">
      <form action={formAction} className="flex-grow flex flex-col gap-y-8 px-4 justify-start text-start pt-8">
        <div className="grid grid-cols-5 items-center">
          <label htmlFor="employeeId" className="text-right pr-4 col-span-2">Employee ID</label>
          <input type="text" id="employeeId" name="employeeId" placeholder="" className="rounded col-span-3 px-2 py-1" />
        </div>
        <div className="grid grid-cols-5 items-center">
          <label htmlFor="password" className="text-right pr-4 col-span-2">Password</label>
          <input type="password" id="password" name="password" placeholder="" className="rounded col-span-3 px-2 py-1" />
        </div>
        <div className="flex flex-wrap justify-evenly items-center">
          <button type="submit" className="border border-black rounded-full text-white bg-blue-800 px-6 py-1">Login</button>
          <button type="reset" className="border border-black rounded-full text-white bg-blue-800 px-6 py-1" onClick={() => router.back()}>Back</button>
        </div>
      </form>
      <div className="text-center text-red-500 pt-4 text-[10px]">Reminder: Please remember your password.</div>
    </div>
  )
}