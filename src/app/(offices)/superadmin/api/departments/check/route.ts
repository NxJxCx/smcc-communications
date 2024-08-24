'use server';
import { DepartmentColumns } from "@/app/(offices)/superadmin/_components/types";
import { Roles } from "@/lib/modelInterfaces";
import Department from "@/lib/models/Department";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const result: DepartmentColumns[] = [];
  try {
    const session = await getSession(Roles.SuperAdmin);
    if (!!session) {
      const name = request.nextUrl.searchParams.get('name');
      const department = await Department.findOne({ name }).countDocuments().exec();
      return NextResponse.json({ result: department > 0 })
    }
  } catch (e) {}

  return NextResponse.json({ result });
}