'use server';;
import connectDB from "@/lib/database";
import { DocumentType, Roles } from "@/lib/modelInterfaces";
import Department from "@/lib/models/Department";
import Letter from "@/lib/models/Letter";
import Memo from "@/lib/models/Memo";
import { getSession } from "@/lib/session";
import { ActionResponseType } from "./superadmin";


export async function saveMemorandumLetter(departmentId: string, doctype: DocumentType, eSignatures: string[], formData: FormData): Promise<ActionResponseType & { memorandumId?: string, letterId?: string }>
{
  await connectDB()
  try {
    const session = await getSession(Roles.Admin)
    if (!!session?.user) {
      const preparedBy = session.user._id;
      const department = await Department.findById(departmentId).exec()
      if (!department) {
        return {
          error: 'Department not found'
        }
      }
      const content = formData.get('content')
      const title = formData.get('title')
      if (!content) {
        return {
          error: 'Memorandum title should not be empty'
        }
      }
      const signatureApprovals = eSignatures.map(signatureId => ({ signature_id: signatureId, approvedDate: null }))
      if (doctype === DocumentType.Memo) {
        const memo = await Memo.create({
          departmentId,
          title,
          content: content,
          preparedBy,
          signatureApprovals
        })
        if (!!memo?._id) {
          return {
            success: 'Memorandum Saved and Sent for Approval',
            memorandumId: memo._id.toHexString()
          }
        }
      } else if (doctype === DocumentType.Letter) {
        const letter = await Letter.create({
          departmentId,
          title,
          content: content,
          preparedBy,
          signatureApprovals
        })
        if (!!letter?._id) {
          return {
            success: 'Letter Saved and Sent for Approval.',
            memorandumId: letter._id.toHexString()
          }
        }
      } else {
        return {
          error: 'Invalid document type'
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