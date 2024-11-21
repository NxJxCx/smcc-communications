'use server';;
import { addNotification } from "@/actions/notifications";
import connectDB from "@/lib/database";
import { DocumentType, Roles } from "@/lib/modelInterfaces";
import LetterIndividual from "@/lib/models/LetterIndividual";
import MemoIndividual from "@/lib/models/MemoIndividual";
import User from "@/lib/models/User";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  await connectDB()
  try {
    const session = await getSession(Roles.Admin)
    if (!!session?.user) {
      const id = request.nextUrl.searchParams.get('id');
      const doctype = request.nextUrl.searchParams.get('doctype');
      // const isForIndividual = request.nextUrl.searchParams.get('isForIndividual') === "true";
      if ([DocumentType.Memo, DocumentType.Letter].includes(doctype as DocumentType) && !!id) {
        const user = await User.findById(session.user._id).exec();
        if (!user) {
          return NextResponse.json({ success: false, message: 'User not found' });
        }
        const MemoLetterIndividual = doctype === DocumentType.Memo ? MemoIndividual : LetterIndividual;
        const memoLetterIndividual = await MemoLetterIndividual.findById(id).exec();
        if (!!memoLetterIndividual) {
          if (!memoLetterIndividual.isRead) {
            memoLetterIndividual.isRead = true;
            try {
              await memoLetterIndividual.save({ runValidators: true });
              await addNotification(memoLetterIndividual.preparedBy, {
                title: "The " + (doctype === DocumentType.Memo ? "Memorandum" : "Letter") + " you sent have been read.",
                message: (user.prefixName ? user.prefixName + " " : "") + user.firstName + " " + user.lastName + (user.suffixName ? ", " + user.suffixName : "") + " has read the "
                  + (doctype === DocumentType.Memo ? "Memorandum" : "Letter") + " you have sent",
                href: '/' + Roles.Admin + '/' + (doctype === DocumentType.Memo ? "memo" : "letter") + '/approved?id=' + memoLetterIndividual._id.toHexString(),
              });
            } catch (err) {
              console.log("ERROR:", err);
            }
          }
        }
      }
    }
  } catch (e) {
    console.log("error:", e)
  }
  return NextResponse.json({ error: true })
}