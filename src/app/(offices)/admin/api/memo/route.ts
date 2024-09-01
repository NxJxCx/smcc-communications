'use server';;
import connectDB from "@/lib/database";
import { DocumentType, LetterDocument, MemoDocument, Roles } from "@/lib/modelInterfaces";
import ESignature from "@/lib/models/ESignature";
import Letter from "@/lib/models/Letter";
import Memo from "@/lib/models/Memo";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  await connectDB()
  try {
    const session = await getSession(Roles.Admin)
    if (!!session?.user) {
      const doctype = request.nextUrl.searchParams.get('doctype');
      if ([DocumentType.Memo, DocumentType.Letter].includes(doctype as DocumentType)) {
        const esignature = await ESignature.findOne({ adminId: session.user._id }).exec();
        if (!!esignature?._id) {
          const signature_id = esignature._id;
          const MemoLetter = doctype === DocumentType.Memo? Memo : Letter;
          const resultFind = await MemoLetter.find({
            $or: [
              { preparedBy: session.user._id, signatureApprovals: { $elemMatch: { rejectedDate: { $ne: null }, approvedDate: null }} },
              { preparedBy: session.user._id, signatureApprovals: { $elemMatch: { approvedDate: null }} },
              { preparedBy: { $ne: session.user._id }, signatureApprovals: { $elemMatch: { rejectedDate: { $ne: null }, approvedDate: null, signature_id }} },
              { preparedBy: { $ne: session.user._id }, signatureApprovals: { $elemMatch: { approvedDate: null, signature_id }} },
              { preparedBy: { $ne: session.user._id }, signatureApprovals: { $elemMatch: { approvedDate: null, rejectedDate: null, signature_id }} },
              { $and: [
                { signatureApprovals: { $elemMatch: { approvedDate: { $ne: null }, signature_id } }},
                { signatureApprovals: { $elemMatch: { approvedDate: null, signature_id: { $ne: signature_id } }}}
              ] },
            ]
          }).populate('departmentId').exec();
          const result = (JSON.parse(JSON.stringify(resultFind)) as MemoDocument[]|LetterDocument[]).map((item, i) => ({
            ...item,
            isPreparedByMe: item.preparedBy === session.user._id,
            isPending: item.signatureApprovals.some((s) => !s.approvedDate) && ((item.preparedBy === session.user._id) || (item.preparedBy !== session.user._id && !!item.signatureApprovals.find((s) => s.signature_id == signature_id)?.approvedDate)),
            isRejected: item.signatureApprovals.some((s) => !!s.rejectedDate)
          }))
          return NextResponse.json({ result })
        }
      }
    }
  } catch (e) {
    console.log("error:", e)
  }
  return NextResponse.json({ result: [] })
}