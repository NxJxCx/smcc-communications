'use server'

import connectDB from "@/lib/database";
import Assignation from "@/lib/models/Assignation";
import { UserRoles } from "@/lib/models/interfaces";
import User from "@/lib/models/User";
import { getSession } from "@/lib/session";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(_: NextRequest) {
  const session = await getSession(UserRoles.Admin);
  if (session === null) {
    return NextResponse.json('access denied', { status: 401, statusText: 'Access Denied' })
  }
  await connectDB();
  try {
    const filterSearch = {
      role: { $nin: [UserRoles.Admin, UserRoles.User] },
      deactivated: false,
    }
    const data = await User.find(filterSearch).select('firstName middleName lastName role position').exec();
    const assignedIds = await Assignation.findOne({}).exec();
    return NextResponse.json({ data, assignedIds, length: data?.length || 0 })
  } catch (err: any) {}
  return NextResponse.json('access denied', { status: 401, statusText: 'Access Denied' })
}