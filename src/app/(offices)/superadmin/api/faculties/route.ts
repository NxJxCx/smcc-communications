'use server';
import { AccountsColumns } from "@/app/(offices)/superadmin/_components/types";
import { Roles } from "@/lib/modelInterfaces";
import User from "@/lib/models/User";
import { getSession } from "@/lib/session";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const result: AccountsColumns[] = [];
  try {
    const session = await getSession(Roles.SuperAdmin);
    if (!!session) {
      const users = await User.find({ role: Roles.Faculty }).select('-role -readMemos -readLetters -notification').populate('departmentIds photo').exec();
      users.forEach((user) => {
        const data = {
          ...JSON.parse(JSON.stringify(user)),
        }
        result.push(data);
      })
    }
  } catch (e) {}

  return NextResponse.json({ result });
}