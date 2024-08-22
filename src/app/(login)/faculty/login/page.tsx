import LoginForm from "@/app/(login)/_components/loginForm";
import { Roles } from "@/lib/models/interfaces";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Faculty Login",
}

export default function FacultyLoginPage() {
  return <LoginForm role={Roles.Faculty} />
}