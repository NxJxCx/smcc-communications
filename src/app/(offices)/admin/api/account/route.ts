'use server';
import connectDB from "@/lib/database";
import { Roles } from "@/lib/modelInterfaces";
import User from "@/lib/models/User";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  await connectDB()
  try {
    const session = await getSession(Roles.Admin)
    if (!!session?.user) {
      const users = await User.findById({ _id: session.user._id}).select('-password -departmentIds -readMemos -readLetters -deactivated -notification').populate('photo').exec()
      return NextResponse.json({ result: users })
    }
  } catch (e) {}
  return NextResponse.json({ result: {} })
}