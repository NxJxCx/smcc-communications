'use server';;
import connectDB from "@/lib/database";
import { DocumentType, LetterDocument, LetterIndividualDocument, MemoDocument, MemoIndividualDocument, Roles, UserDocument } from "@/lib/modelInterfaces";
import Department from "@/lib/models/Department";
import ESignature from "@/lib/models/ESignature";
import Letter from "@/lib/models/Letter";
import LetterIndividual from "@/lib/models/LetterIndividual";
import Memo from "@/lib/models/Memo";
import MemoIndividual from "@/lib/models/MemoIndividual";
import User from "@/lib/models/User";
import { getSession } from "@/lib/session";
import { HighestPosition } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";


function getFullName(admin?: UserDocument) {
  return !!admin ? ((admin.prefixName || "") + " " + admin.firstName + " " + (admin.middleName ? admin.middleName[0].toUpperCase() + ". " : "") + admin.lastName + (admin.suffixName ? ", " + admin.suffixName : "")).trim() : ""
}

export async function GET(request: NextRequest) {
  await connectDB()
  try {
    const session = await getSession(Roles.Admin)
    if (!!session?.user) {
      const doctype = request.nextUrl.searchParams.get('doctype');
      const populate = request.nextUrl.searchParams.get('populate');
      if ([DocumentType.Memo, DocumentType.Letter].includes(doctype as DocumentType)) {
        const memoLetterField = doctype === DocumentType.Memo ? "archivedMemos" : "archivedLetters";
        const memoLetterIndividualField = doctype === DocumentType.Memo ? "archivedMemoIndividuals" : "archivedLetterIndividuals";
        const user = await User.findById(session.user._id).select(`departmentIds ${memoLetterField} ${memoLetterIndividualField}`).exec();
        const signature = await ESignature.findOne({ adminId: user?._id?.toHexString() }).select('_id').exec();
        const MemoLetter = doctype === DocumentType.Memo ? Memo : Letter;
        const MemoLetterIndividual = doctype === DocumentType.Memo ? MemoIndividual : LetterIndividual;
        const signature_id = signature?._id?.toHexString();
        let departments = await Department.find({}).select('_id').exec();
        const departmentIds = departments.map((dp) => dp._id?.toHexString())
        let populate_args = 'departmentId';
        if (!!populate) {
          populate_args += ` ${populate.replaceAll(","," ")}`;
        }
        const resultFind = await MemoLetter.find({
          $or: [
            {
              $and: [
                {
                  _id: {
                    $nin: [...(user._doc[memoLetterField] || [])]
                  }
                },
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
                  _id: {
                    $nin: [...(user._doc[memoLetterField] || [])]
                  }
                },
                {
                  departmentId: {
                    $in: user._doc.highestPosition === HighestPosition.Admin ? user._doc.departmentIds : departmentIds,
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
        }).populate(populate_args).lean<MemoDocument[]|LetterDocument[]>().exec();
        const resultFindIndividual = await MemoLetterIndividual.find({
          _id: {
            $nin: [...(user._doc[memoLetterIndividualField] || [])]
          },
          userId: {
            $ne: user._doc._id,
          },
          preparedBy: user._doc._id,
        }).lean<MemoIndividualDocument[]|LetterIndividualDocument[]>().exec();
        const departmentalMemoLetter = await Promise.all(resultFind.map(async (item, i) => ({
          ...item,
          isPreparedByMe: item.preparedBy === session.user._id?.toString(),
          preparedByName: (await new Promise(async (resolve) => {
            const u = await User.findById(item.preparedBy).lean<UserDocument>().exec();
            resolve(getFullName(u as UserDocument))
          }))
        })))
        const individualMemoLetter = await Promise.all(
          resultFindIndividual.map(async (item) => ({
            ...item,
            isPreparedByMe: item.preparedBy === session.user._id?.toString(),
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