'use client'

import { useRouter } from "next/navigation"

export default function LoginForm({
  action = () => {}
}: Readonly<{
  action: (e?: any) => any|Promise<any>,
}>) {
  const router = useRouter()
  return (
    <div className="flex flex-col">
      <form action={action} className="flex-grow flex flex-col gap-y-8 px-4 justify-start text-start pt-8">
        <div className="grid grid-cols-5 items-center">
          <label htmlFor="employeeId" className="text-right pr-4 col-span-2">Employee ID</label>
          <input type="text" id="employeeId" placeholder="" className="rounded col-span-3 px-2 py-1" />
        </div>
        <div className="grid grid-cols-5 items-center">
          <label htmlFor="password" className="text-right pr-4 col-span-2">Password</label>
          <input type="password" id="password" placeholder="" className="rounded col-span-3 px-2 py-1" />
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