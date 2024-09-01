'use server';;
import connectDB from "@/lib/database";
import { DocumentType, Roles } from "@/lib/modelInterfaces";
import Letter from "@/lib/models/Letter";
import Memo from "@/lib/models/Memo";
import User from "@/lib/models/User";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  await connectDB()
  try {
    const session = await getSession(Roles.Faculty)
    if (!!session?.user) {
      const doctype = request.nextUrl.searchParams.get('doctype');
      if ([DocumentType.Memo, DocumentType.Letter].includes(doctype as DocumentType)) {
        const user = await User.findById(session.user._id).select('departmentIds').exec();
        const MemoLetter = doctype === DocumentType.Memo ? Memo : Letter;
        const result = await MemoLetter.find({
          $and: [
            {
              departmentId: {
                $in: user._doc.departmentIds,
              },
            },
            {
              signatureApprovals: {
                $not: {
                  $all: {
                    $elemMatch: { approvedDate: null },
                  },
                },
              },
            },
            {
              signatureApprovals: {
                $all: {
                  $elemMatch: { rejectedDate: null },
                }
              }
            }
          ],
        }).populate('departmentId').exec();
        return NextResponse.json({ result })
      }
    }
  } catch (e) {
    console.log("error:", e)
  }
  return NextResponse.json({ result: [] })
}