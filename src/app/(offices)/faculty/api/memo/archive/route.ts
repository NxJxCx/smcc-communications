'use server';;
import connectDB from "@/lib/database";
import { DocumentType, LetterDocument, LetterIndividualDocument, MemoDocument, MemoIndividualDocument, Roles, UserDocument } from "@/lib/modelInterfaces";
import Letter from "@/lib/models/Letter";
import LetterIndividual from "@/lib/models/LetterIndividual";
import Memo from "@/lib/models/Memo";
import MemoIndividual from "@/lib/models/MemoIndividual";
import User from "@/lib/models/User";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

function getFullName(admin?: UserDocument) {
  return !!admin ? ((admin.prefixName || "") + " " + admin.firstName + " " + (admin.middleName ? admin.middleName[0].toUpperCase() + ". " : "") + admin.lastName + (admin.suffixName ? ", " + admin.suffixName : "")).trim() : ""
}

export async function GET(request: NextRequest) {
  await connectDB()
  try {
    const session = await getSession(Roles.Faculty)
    if (!!session?.user) {
      const doctype = request.nextUrl.searchParams.get('doctype');
      if ([DocumentType.Memo, DocumentType.Letter].includes(doctype as DocumentType)) {
        const memoLetterField = doctype === DocumentType.Memo ? "archivedMemos" : "archivedLetters";
        const memoLetterIndividualField = doctype === DocumentType.Memo ? "archivedMemoIndividuals" : "archivedLetterIndividuals";
        const user = await User.findById(session.user._id).select(`departmentIds ${memoLetterField} ${memoLetterIndividualField}`).exec();
        const MemoLetter = doctype === DocumentType.Memo ? Memo : Letter;
        const MemoLetterIndividual = doctype === DocumentType.Memo ? MemoIndividual : LetterIndividual;
        const resultFind = await MemoLetter.find({
          _id: {
            $in: [...(user._doc[memoLetterField] || [])]
          }
        }).populate('departmentId').exec();
        const resultFindIndividual = await MemoLetterIndividual.find({
          _id: {
            $in: [...(user._doc[memoLetterIndividualField] || [])]
          }
        }).exec();
        const departmentalMemoLetter = await Promise.all((JSON.parse(JSON.stringify(resultFind)) as MemoDocument[]|LetterDocument[]).map(async (item, i) => ({
          ...item,
          isPreparedByMe: item.preparedBy === session.user._id,
          preparedByName: (await new Promise(async (resolve) => {
            const u = await User.findById(item.preparedBy).lean<UserDocument>().exec();
            resolve(getFullName(u as UserDocument))
          }))
        })))
        const individualMemoLetter = await Promise.all(
          (JSON.parse(JSON.stringify(resultFindIndividual)) as MemoIndividualDocument[]|LetterIndividualDocument[]).map(async (item) => ({
            ...item,
            isPreparedByMe: item.preparedBy === session.user._id,
            preparedByName: (await new Promise(async (resolve) => {
              const u = await User.findById(item.preparedBy).lean<UserDocument>().exec();
              resolve(getFullName(u as UserDocument))
            }))
          }))
        )
        return NextResponse.json({
          result: {
            departments: departmentalMemoLetter,
            individuals: individualMemoLetter,
          }
        })
      }
    }
  } catch (e) {
    console.log("error:", e)
  }
  return NextResponse.json({ result: [] })
}