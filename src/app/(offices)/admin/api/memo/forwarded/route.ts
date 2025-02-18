'use server';;
import connectDB from "@/lib/database";
import { DocumentType, ESignatureDocument, LetterDocument, LetterIndividualDocument, MemoDocument, MemoIndividualDocument, Roles, SignatureApprovals } from "@/lib/modelInterfaces";
import ESignature from "@/lib/models/ESignature";
import Letter from "@/lib/models/Letter";
import LetterIndividual from "@/lib/models/LetterIndividual";
import Memo from "@/lib/models/Memo";
import MemoIndividual from "@/lib/models/MemoIndividual";
import User from "@/lib/models/User";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  await connectDB()
  try {
    const session = await getSession(Roles.Admin)
    if (!!session?.user) {
      const doctype = request.nextUrl.searchParams.get('doctype');
      if ([DocumentType.Memo, DocumentType.Letter].includes(doctype as DocumentType)) {
        const memoLetterField = doctype === DocumentType.Memo ? "archivedMemos" : "archivedLetters";
        const memoLetterIndividualField = doctype === DocumentType.Memo ? "archivedMemoIndividuals" : "archivedLetterIndividuals";
        const user = await User.findById(session.user._id).select(`departmentIds ${memoLetterField} ${memoLetterIndividualField}`).exec();
        const MemoLetter = doctype === DocumentType.Memo ? Memo : Letter;
        const MemoLetterIndividual = doctype === DocumentType.Memo ? MemoIndividual : LetterIndividual;
        const resultFind = await MemoLetter.find({
          $and: [
            {
              _id: {
                $nin: [...(user._doc[memoLetterField] || [])]
              }
            },
            {
              $or: [
                {
                  departmentId: {
                    $in: user._doc.departmentIds,
                  },
                },
                {
                  cc: {
                    $in: [user?._id?.toHexString()]
                  }
                }
              ]
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
            },
          ],
        }).populate('departmentId').exec();
        const resultFindIndividual = await MemoLetterIndividual.find({
          _id: {
            $nin: [...(user._doc[memoLetterIndividualField] || [])]
          },
          $or: [
            {
              preparedBy: {
                $in: [user?._id?.toHexString()]
              }
            },
            {
              cc: {
                $in: [user?._id?.toHexString()]
              }
            }
          ]
        }).exec();
        const departmentalMemoLetter = (JSON.parse(JSON.stringify(resultFind)) as MemoDocument[]|LetterDocument[]).map((item, i) => ({
          ...item,
          isPreparedByMe: item.preparedBy === session.user._id
        }))
        const mySig = session.user!.role === Roles.Admin ? (await ESignature.findOne({ adminId: session.user!._id }).lean<ESignatureDocument>().exec()) : null;
        const individualMemoLetter = (JSON.parse(JSON.stringify(resultFindIndividual)) as MemoIndividualDocument[]|LetterIndividualDocument[]).map((item) => {
          const hasSignatureNotSigned = mySig !== null && item && (item.signatureApprovals as SignatureApprovals[]).some((esig) => {
            return esig.signature_id.toString() === mySig._id?.toString() && !esig.approvedDate
          });
          return {
            ...item,
            hasSignatureNotSigned
          }
        })
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