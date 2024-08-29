'use server';;
import connectDB from "@/lib/database";
import { DocumentType, Roles } from "@/lib/modelInterfaces";
import Department from "@/lib/models/Department";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    const session = await getSession(Roles.SuperAdmin);
    if (!!session?.user) {
      const doctype = request.nextUrl.searchParams.get('doctype');
      let department: any = Department.find({})
      if (doctype === DocumentType.Memo) {
        department = department.populate('memoTemplates');
      } else if (doctype === DocumentType.Letter) {
        department = department.populate('letterTemplates');
      } else {
        department = [];
      }
      const result = await department.exec();
      return NextResponse.json({ result });
    }
  } catch (e) {
    console.log("error", e)
  }

  return NextResponse.json({ result: [] });
}