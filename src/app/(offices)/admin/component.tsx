'use client';
import LoadingComponent from "@/components/loading";
import { useSession } from "@/components/useSession";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { status } = useSession({
    redirect: true,
  });
  const router = useRouter();
  useEffect(() => {
    status === 'authenticated' && router.replace('/admin/notifications');
    status === 'unauthenticated' && router.replace('/admin/login')
  }, [status, router]);

  if (status === 'loading') {
    return <div className="h-screen w-full"><LoadingComponent /></div>
  }
  return null;
}