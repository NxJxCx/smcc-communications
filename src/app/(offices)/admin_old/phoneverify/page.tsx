import OfficePhoneVerificationComponent from "@/components/verifications/office-phone-verification";
import { Roles } from "@/lib/models/interfaces";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Phone Verification - Admin",
};

export default function Page() {
  return <OfficePhoneVerificationComponent role={Roles.Admin} />
}