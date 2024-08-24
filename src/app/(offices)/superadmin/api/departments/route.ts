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
      const departments = await Department.find({});
      await Promise.all(departments.map(async (department) => {
        const data = {
          _id: department._id.toHexString(),
          name: department.name,
          memorandums: department.memoTemplates.length,
          letters: department.letterTemplates.length,
          status: department.isDissolved ? "dissolved" : "active",
        }
        result.push(data);
      }))
    }
  } catch (e) {}

  return NextResponse.json({ result });
}