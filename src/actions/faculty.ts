'use server';
import connectDB from "@/lib/database";
import { DocumentType, Roles } from "@/lib/modelInterfaces";
import User from "@/lib/models/User";
import { getSession } from "@/lib/session";
import { isObjectIdOrHexString } from "mongoose";
import { ActionResponseType } from "./superadmin";


const role = Roles.Faculty;

export async function archiveMemorandumLetter(doctype: DocumentType, id: string, isIndividual: boolean): Promise<ActionResponseType>
{
  await connectDB()
  try {
    const session = await getSession(role)
    if (!!session?.user) {
      if (!id || !isObjectIdOrHexString(id)) {
        return {
          error: 'Invalid Document ID'
        }
      }
      const memoLetterField = isIndividual ? (doctype === DocumentType.Memo ? "archivedMemoIndividuals" : "archivedLetterIndividuals") : (doctype === DocumentType.Memo ? "archivedMemos" : "archivedLetters");
      const memo = await User.updateOne({ _id: session.user._id }, { $push: { [memoLetterField]: id } }).exec();
      if (memo.acknowledged && memo.modifiedCount > 0) {
        return {
          success: 'Memorandum Archived',
        }
      }
    }
  } catch (e) {
    console.log(e)
  }
  return {
    error: 'Failed to save'
  }
}


export async function unarchiveMemorandumLetter(doctype: DocumentType, id: string, isIndividual: boolean): Promise<ActionResponseType>
{
  await connectDB()
  try {
    const session = await getSession(role)
    if (!!session?.user) {
      if (!id || !isObjectIdOrHexString(id)) {
        return {
          error: 'Invalid Document ID'
        }
      }
      const memoLetterField = isIndividual ? (doctype === DocumentType.Memo ? "archivedMemoIndividuals" : "archivedLetterIndividuals") : (doctype === DocumentType.Memo ? "archivedMemos" : "archivedLetters");
      const memo = await User.updateOne({ _id: session.user._id }, { $pull: { [memoLetterField]: id } }).exec();
      if (memo.acknowledged && memo.modifiedCount > 0) {
        return {
          success: 'Memorandum Archived',
        }
      }
    }
  } catch (e) {
    console.log(e)
  }
  return {
    error: 'Failed to save'
  }
}

