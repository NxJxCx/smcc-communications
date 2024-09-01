'use server'

import connectDB from "@/lib/database";
import { Roles } from "@/lib/modelInterfaces";
import ESignature from "@/lib/models/ESignature";
import Letter from "@/lib/models/Letter";
import Memo from "@/lib/models/Memo";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  await connectDB()
  try {
    const session = await getSession(Roles.Faculty)
    if (!!session?.user) {
      const mlid = request.nextUrl.searchParams.get('mlid');
      const memo = await Memo.findById(mlid).select('preparedBy').exec();
      if (!!memo?._id) {
        const result = await ESignature.findOne({ adminId: memo.preparedBy.toHexString() }).exec();
        return NextResponse.json({ result })
      }
      const letter = await Letter.findById(mlid).select('preparedBy').populate('signatureApprovals.signature_id').exec();
      if (!!letter?._id) {
        const result = await ESignature.findOne({ adminId: letter.preparedBy }).exec();
        return NextResponse.json({ result })
      }
    }
  } catch (e) {
    console.log("error", e)
  }
  return NextResponse.json({ result: undefined })
}