'use server';
import connectDB from "@/lib/database";
import { Roles } from "@/lib/modelInterfaces";
import Department from "@/lib/models/Department";
import ESignature from "@/lib/models/ESignature";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  await connectDB()
  try {
    const session = await getSession(Roles.Admin);
    if (!!session?.user) {
      const signatories = await ESignature.find({}).populate('adminId').exec();
      let result = JSON.parse(JSON.stringify(signatories))
      result = await Promise.all(result.filter((r: any) => !!r.adminId).map(async (r: any) => ({ ...r, adminId: {...r.adminId, allDepartments: await Promise.all(r.adminId.departmentIds.map((async (did: string) => await Department.findById(did).exec())))} })));
      return NextResponse.json({ result })
    }
  } catch (e) {
    console.log(e)
  }
  return NextResponse.json({ result: [] })
}