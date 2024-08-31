'use server'

import connectDB from "@/lib/database";
import { Roles, SignatureApprovals } from "@/lib/modelInterfaces";
import Letter from "@/lib/models/Letter";
import Memo from "@/lib/models/Memo";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  await connectDB()
  try {
    const session = await getSession(Roles.SuperAdmin)
    if (!!session?.user) {
      const mlid = request.nextUrl.searchParams.get('mlid');
      const memo = await Memo.findById(mlid).select('signatureApprovals').populate('signatureApprovals.signature_id').exec();
      if (!!memo) {
        const result = (JSON.parse(JSON.stringify(memo)).signatureApprovals as SignatureApprovals[]).map(({ approvedDate }) => !!approvedDate);
        return NextResponse.json({ result })
      }
      const letter = await Letter.findById(mlid).select('signatureApprovals').populate('signatureApprovals.signature_id').exec();
      if (!!letter) {
        const result = (JSON.parse(JSON.stringify(memo)).signatureApprovals as SignatureApprovals[]).map(({ approvedDate }) => !!approvedDate);
        return NextResponse.json({ result })
      }
    }
  } catch (e) {
    console.log("error", e)
  }
  return NextResponse.json({ result: undefined })
}