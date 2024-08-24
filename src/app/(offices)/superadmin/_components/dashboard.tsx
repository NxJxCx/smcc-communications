'use client';
import LoadingComponent from '@/components/loading';
import { Roles } from '@/lib/modelInterfaces';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from "react";
import { DashboardDataProps } from "./types";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardDataProps>({
    departmentsCount: <LoadingComponent />,
    adminAccountsCount: <LoadingComponent />,
    facultyAccountsCount: <LoadingComponent />,
    eSignatureCount: <LoadingComponent />,
    totalMemorandumsCount: <LoadingComponent />,
    totalLettersCount: <LoadingComponent />,
  });

  const pathname = usePathname();

  const getData = useCallback(() => {
    fetch('/' + Roles.SuperAdmin + '/api/dashboard')
      .then((response) => response.json())
      .then(({ result }) => setData(result))
      .catch(console.log)
  }, []);

  useEffect(() => {
    getData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <div className="px-8 py-4">
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-2 lg:gap-4 mt-8">
        <div className="border h-[130px] bg-white shadow rounded-lg text-wrap">
          <div className="flex flex-nowrap h-full">
            <h1 className="text-4xl min-w-[100px] h-full flex items-center justify-center font-[600] p-6">{data.departmentsCount}</h1>
            <p className="flex-grow h-full pl-6 items-center justify-start flex border-l">Departments</p>
          </div>
        </div>
        <div className="border h-[130px] bg-white shadow rounded-lg">
          <div className="flex flex-nowrap h-full">
            <h1 className="text-4xl min-w-[100px] h-full flex items-center justify-center font-[600] p-6">{data.adminAccountsCount}</h1>
            <p className="flex-grow h-full pl-6 items-center justify-start flex border-l">Admin Accounts</p>
          </div>
        </div>
        <div className="border h-[130px] bg-white shadow rounded-lg">
          <div className="flex flex-nowrap h-full">
            <h1 className="text-4xl min-w-[100px] h-full flex items-center justify-center font-[600] p-6">{data.eSignatureCount}</h1>
            <p className="flex-grow h-full pl-6 items-center justify-start flex border-l">Registered E-Signatures</p>
          </div>
        </div>
        <div className="border h-[130px] bg-white shadow rounded-lg">
          <div className="flex flex-nowrap h-full">
            <h1 className="text-4xl min-w-[100px] h-full flex items-center justify-center font-[600] p-6">{data.facultyAccountsCount}</h1>
            <p className="flex-grow h-full pl-6 items-center justify-start flex border-l">Faculty Accounts</p>
          </div>
        </div>
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-2 lg:gap-4 mt-3">
        <div className="border h-[130px] bg-white shadow rounded-lg">
          <div className="flex flex-nowrap h-full">
            <h1 className="text-4xl min-w-[100px] h-full flex items-center justify-center font-[600] p-6">{data.totalMemorandumsCount}</h1>
            <p className="flex-grow h-full pl-6 items-center justify-start flex border-l">Total Memorandums</p>
          </div>
        </div>
        <div className="border h-[130px] bg-white shadow rounded-lg">
          <div className="flex flex-nowrap h-full">
            <h1 className="text-4xl min-w-[100px] h-full flex items-center justify-center font-[600] p-6">{data.totalLettersCount}</h1>
            <p className="flex-grow h-full pl-6 items-center justify-start flex border-l">Total Letters</p>
          </div>
        </div>
      </div>
    </div>
  )
}