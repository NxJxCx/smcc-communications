'use server';
import { Roles, UserDocument } from "@/lib/modelInterfaces";
import ESignature from "@/lib/models/ESignature";
import User from "@/lib/models/User";
import { getSession } from "@/lib/session";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(Roles.SuperAdmin);
    if (!!session) {
      const users = await User.find({ role: Roles.Admin }).select('-role -readMemos -readLetters -notification').populate('departmentIds photo').exec();
      const result = await Promise.all(JSON.parse(JSON.stringify(users)).map(async (user: UserDocument) => ({ ...user, hasRegisteredSignature: (await ESignature.find({ adminId: user._id }).countDocuments().exec()) > 0 })));
      return NextResponse.json({ result });
    }
  } catch (e) { }

  return NextResponse.json({ result: [] });
}