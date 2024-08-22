import VerifyEmailComponent from "@/components/verifications/verify-email-component";
import { Roles } from "@/lib/models/interfaces";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Email Verification - Admin",
};

type ParamProp = { searchParams: { resend?: string; } }

export default function Page({ searchParams: { resend } }: ParamProp ) {
  return <VerifyEmailComponent role={Roles.Admin} resend={resend} />
}