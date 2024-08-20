import { Metadata } from "next";
import EmailVerificationComponent from "@/components/verifications/email-verification";
import { UserRoles } from "@/lib/models/interfaces";

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
  return <EmailVerificationComponent role={UserRoles.Admin} token={token} code={code} />
}