'use server';
import connectDB from "@/lib/database";
import { Roles, UserDocument } from "@/lib/modelInterfaces";
import PhotoFile from "@/lib/models/PhotoFile";
import User from "@/lib/models/User";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  await connectDB()
  try {
    const session = await getSession(Roles.SuperAdmin)
    if (!!session?.user) {
      const users = await User.findById({ _id: session.user._id}).select('-password -departmentIds -readMemos -readLetters -deactivated -notification').exec()
      const result = await Promise.all(JSON.parse(JSON.stringify(users)).map(async (user: UserDocument) => ({...user, photo: user.photo? JSON.parse(JSON.stringify(await PhotoFile.findById(user.photo))) : undefined })));
      return NextResponse.json({ result: users })
    }
  } catch (e) {}
  return NextResponse.json({ result: {} })
}