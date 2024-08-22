import LoginForm from "@/app/(login)/_components/loginForm";
import { Roles } from "@/lib/models/interfaces";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Login",
}

export default function AdminLoginPage() {
  return <LoginForm role={Roles.Admin} />
}