'use server';
import connectDB from "@/lib/database";
import { Roles } from "@/lib/modelInterfaces";
import PhotoFile from "@/lib/models/PhotoFile";
import User from "@/lib/models/User";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  await connectDB()
  try {
    const session = await getSession(Roles.SuperAdmin)
    if (!!session?.user) {
      console.log("SESSION", session?.user)
      const users = await User.findOne({ _id: session.user._id }).select('-password -departmentIds -readMemos -readLetters -deactivated -notification').exec()
      console.log("USER", users)
      const parsed = JSON.parse(JSON.stringify(users))
      const photo = parsed?.photo ? await PhotoFile.findById(parsed.photo) : undefined
      parsed.photo = photo
      const result = JSON.parse(JSON.stringify(parsed))
      return NextResponse.json({ result })
    }
  } catch (e) {}
  return NextResponse.json({ result: {} })
}