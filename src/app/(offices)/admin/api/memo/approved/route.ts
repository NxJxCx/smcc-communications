'use server';;
import connectDB from "@/lib/database";
import { DocumentType, LetterDocument, LetterIndividualDocument, MemoDocument, MemoIndividualDocument, Roles } from "@/lib/modelInterfaces";
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
        const user = await User.findById(session.user._id).select('departmentIds').exec();
        const signature = await ESignature.findOne({ adminId: user?._id?.toHexString() }).select('_id').exec();
        const MemoLetter = doctype === DocumentType.Memo ? Memo : Letter;
        const MemoLetterIndividual = doctype === DocumentType.Memo ? MemoIndividual : LetterIndividual;
        const signature_id = signature?._id?.toHexString();
        const resultFind = await MemoLetter.find({
          $or: [
            {
              $and: [
                {
                  departmentId: {
                    $nin: user._doc.departmentIds,
                  },
                },
                {
                  signatureApprovals: {
                    $elemMatch: { signature_id: signature_id },
                  }
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
            },
            {
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
            }
          ]
        }).populate('departmentId').exec();
        const resultFindIndividual = await MemoLetterIndividual.find({
          userId: {
            $ne: user._doc._id,
          },
          preparedBy: user._doc._id,
        }).exec();
        const departmentalMemoLetter = (JSON.parse(JSON.stringify(resultFind)) as MemoDocument[]|LetterDocument[]).map((item, i) => ({
          ...item,
          isPreparedByMe: item.preparedBy === session.user._id
        }))
        const individualMemoLetter = (JSON.parse(JSON.stringify(resultFindIndividual)) as MemoIndividualDocument[]|LetterIndividualDocument[])
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