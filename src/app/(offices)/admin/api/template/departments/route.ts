'use server'
import connectDB from "@/lib/database";
import { DepartmentDocument, DocumentType, Roles } from "@/lib/modelInterfaces";
import Department from "@/lib/models/Department";
import User from "@/lib/models/User";
import { getSession } from "@/lib/session";
import { HighestPosition } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    const session = await getSession(Roles.Admin);
    if (!!session?.user) {
      const doctype = request.nextUrl.searchParams.get('doctype');
      const user = await User.findById(session.user._id).exec();
      let result = [];
      if (!!user) {
        if (user.highestPosition === HighestPosition.Admin) {
          result = await Promise.all(JSON.parse(JSON.stringify(user)).departmentIds.map(async (deptId: string) => {
            let department: any = Department.findById(deptId);
            if (doctype === DocumentType.Memo) {
              department = department.populate('memoTemplates');
            } else if (doctype === DocumentType.Letter) {
              department = department.populate('letterTemplates');
            } else {
              department = [];
            }
            const res = await department.exec();
            return res
          }))
        } else {
          let dep = Department.find({});
          if (doctype === DocumentType.Memo) {
            dep = dep.populate('memoTemplates');
          } else {
            dep = dep.populate('letterTemplates');
          }
          result = await dep.lean<DepartmentDocument[]>().exec();
        }
      }
      return NextResponse.json({ result });
    }
  } catch (e) {
    console.log("error", e)
  }

  return NextResponse.json({ result: [] });
}