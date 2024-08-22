import EmailVerificationComponent from "@/components/verifications/email-verification";
import { Roles } from "@/lib/models/interfaces";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Email Verification - Admin",
};

type ParamsProp = Readonly<{
  searchParams: {
    token?: string;
    code?: string;
  }
}>

export default function Page({ searchParams: { token, code } }: ParamsProp) {
  return <EmailVerificationComponent role={Roles.Admin} token={token} code={code} />
}