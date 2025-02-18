'use server'

import connectDB from "@/lib/database";
import { Roles, SignatureApprovals } from "@/lib/modelInterfaces";
import Letter from "@/lib/models/Letter";
import LetterIndividual from "@/lib/models/LetterIndividual";
import Memo from "@/lib/models/Memo";
import MemoIndividual from "@/lib/models/MemoIndividual";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  await connectDB()
  try {
    const session = await getSession(Roles.Admin)
    if (!!session?.user) {
      const mlid = request.nextUrl.searchParams.get('mlid');
      const individual = request.nextUrl.searchParams.get('isForIndividual') === "true";
      const MemoI = !individual ? Memo : MemoIndividual;
      const LetterI = !individual ? Letter : LetterIndividual;
      const memo = await MemoI.findById(mlid).select('signatureApprovals').populate('signatureApprovals.signature_id').exec();
      if (!!memo?._id) {
        const result = (JSON.parse(JSON.stringify(memo)).signatureApprovals as SignatureApprovals[]).filter(({ approvedDate }) => !!approvedDate).map(({ signature_id, approvedDate }) => signature_id);
        return NextResponse.json({ result })
      }
      const letter = await LetterI.findById(mlid).select('signatureApprovals').populate('signatureApprovals.signature_id').exec();
      if (!!letter?._id) {
        const result = (JSON.parse(JSON.stringify(letter)).signatureApprovals as SignatureApprovals[]).filter(({ approvedDate }) => !!approvedDate).map(({ signature_id, approvedDate }) => signature_id);
        return NextResponse.json({ result })
      }
    }
  } catch (e) {
    console.log("error", e)
  }
  return NextResponse.json({ result: undefined })
}