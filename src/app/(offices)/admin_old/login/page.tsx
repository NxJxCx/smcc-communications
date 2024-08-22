import LoginPageComponent from "@/components/login-page-component";
import AdminDefaultContainer from "@/components/office-default-container";
import { Roles } from "@/lib/models/interfaces";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Login",
};

export default function Login() {
  return (<AdminDefaultContainer>
    <LoginPageComponent role={Roles.Admin} />
  </AdminDefaultContainer>)
}