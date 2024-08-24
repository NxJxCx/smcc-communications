'use server'

import { AccountsColumns } from "@/app/(offices)/superadmin/_components/types";
import { Roles } from "@/lib/modelInterfaces";
import ESignature from "@/lib/models/ESignature";
import User from "@/lib/models/User";
import { getSession } from "@/lib/session";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const result: AccountsColumns[] = [];
  try {
    const session = await getSession(Roles.SuperAdmin);
    if (!!session) {
      const users = await User.find({ role: Roles.Admin }).select('-role -readMemos -readLetters -notification').populate('departmentIds photo').exec();
      await Promise.all(users.map(async (user) => {
        try {
          const esignatureCount = await ESignature.find({ adminId: user._id }).countDocuments().exec();
          const data = {
            hasRegisteredSignature: esignatureCount > 0,
            ...JSON.parse(JSON.stringify(user)),
          }
          result.push(data);
        } catch (e) {
          console.log(e);
        }
      }))
    }
  } catch (e) {}

  return NextResponse.json({ result });
}