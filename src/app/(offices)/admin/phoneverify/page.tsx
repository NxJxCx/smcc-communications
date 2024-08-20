import { Metadata } from "next";
import OfficePhoneVerificationComponent from "@/components/verifications/office-phone-verification";
import { UserRoles } from "@/lib/models/interfaces";

export const metadata: Metadata = {
  title: "Phone Verification - Admin",
};

export default function Page() {
  return <OfficePhoneVerificationComponent role={UserRoles.Admin} />
}