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
      const id = request.nextUrl.searchParams.get('id');
      const doctype = request.nextUrl.searchParams.get('doctype');
      if ([DocumentType.Memo, DocumentType.Letter].includes(doctype as DocumentType) && !!id) {
        const user = await User.findById(session.user._id).exec();
        if (!user) {
          return NextResponse.json({ success: false, message: 'User not found' });
        }
        const MemoLetter = doctype === DocumentType.Memo ? Memo : Letter;
        const memoletter = await MemoLetter.findById(id).exec();
        if (!!memoletter) {
          if (doctype === DocumentType.Memo) {
            user.readMemos.push(memoletter._id);
          } else {
            user.readLetters.push(memoletter._id);
          }
          await user.save({ runValidators: true });
          return NextResponse.json({ success: true });
        }
      }
    }
  } catch (e) {
    console.log("error:", e)
  }
  return NextResponse.json({ error: true })
}