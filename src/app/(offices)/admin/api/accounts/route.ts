'use server'

import connectDB from "@/lib/database";
import User from "@/lib/models/User";
import { UserRoles } from "@/lib/models/interfaces";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const session = await getSession(UserRoles.Admin);
  if (session === null) {
    return NextResponse.json('access denied', { status: 401, statusText: 'Access Denied' })
  }
  const role = request.nextUrl.searchParams.get('acct');
  if (!!role && Object.values(UserRoles).includes(role as any)) {
    await connectDB();
    try {
      const data = await User.find({ role }).select('-password -notification').sort('-createdAt').exec();
      return NextResponse.json({ data, length: data?.length || 0 })
    } catch (err: any) {}
  }
  return NextResponse.json('access denied', { status: 401, statusText: 'Access Denied' })
}

export async function DELETE(request: NextRequest) {
  const session = await getSession(UserRoles.Admin);
  if (session === null) {
    return NextResponse.json('access denied', { status: 401, statusText: 'Access Denied' })
  }
  const role = request.nextUrl.searchParams.get('acct');
  const uid = request.nextUrl.searchParams.get('uid');
  if (!!role && Object.values(UserRoles).includes(role as any) && !!uid && uid.length === 24) {
    await connectDB();
    try {
      const updated = await User.updateOne(
        { _id: uid, role },
        { $set: { deactivated: true } },
        { new: true, upsert: false, runValidators: true }
      );
      const result = updated.acknowledged && updated.modifiedCount > 0;
      return NextResponse.json(result)
    } catch (err: any) {}
  }
  return NextResponse.json('access denied', { status: 401, statusText: 'Access Denied' })
}

export async function PATCH(request: NextRequest) {
  const session = await getSession(UserRoles.Admin);
  if (session === null) {
    return NextResponse.json('access denied', { status: 401, statusText: 'Access Denied' })
  }
  try {
    const { role, uid } = await request.json();
    if (!!role && Object.values(UserRoles).includes(role as any) && !!uid && uid.length === 24) {
      await connectDB();
        const updated = await User.updateOne(
          { _id: uid as string, role },
          { $set: { deactivated: false } },
          { upsert: false, new: true, runValidators: true }
        );
        const result = updated.acknowledged && updated.modifiedCount > 0;
        return NextResponse.json(result)
    }
  } catch (err: any) {}
  return NextResponse.json('access denied', { status: 401, statusText: 'Access Denied' })
}