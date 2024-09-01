'use server';;
import connectDB from "@/lib/database";
import { DocumentType, Roles } from "@/lib/modelInterfaces";
import Department from "@/lib/models/Department";
import ESignature from "@/lib/models/ESignature";
import Letter from "@/lib/models/Letter";
import Memo from "@/lib/models/Memo";
import { getSession } from "@/lib/session";
import { ActionResponseType } from "./superadmin";


export async function saveMemorandumLetterTemplate(departmentId: string, doctype: DocumentType, eSignatures: string[], formData: FormData): Promise<ActionResponseType & { memorandumId?: string, letterId?: string }>
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

export async function approveMemorandumLetter(doctype: DocumentType, memoLetterId: string): Promise<ActionResponseType>
{
  await connectDB()
  try {
    const session = await getSession(Roles.Admin)
    if (!!session?.user) {
      const eSignature = await ESignature.findOne({ adminId: session.user._id }).exec()
      if (!!eSignature?._id) {
        const sid = eSignature._id.toHexString()
        if (doctype === DocumentType.Memo) {
          const memo = await Memo.findById(memoLetterId).exec()
          memo.signatureApprovals.find((signatureApproval: any) => signatureApproval.signature_id.toHexString() === sid).approvedDate = new Date()
          const updated = await memo.save({ new: true, upsert: false, runValidators: true })
          if (!!updated?._id) {
            return {
              success: "Memorandum approved successfully",
            }
          }
        } else if (doctype === DocumentType.Letter) {
          const letter = await Letter.findById(memoLetterId).exec()
          letter.signatureApprovals.find((signatureApproval: any) => signatureApproval.signature_id.toHexString() === sid).approvedDate = new Date()
          const updated = await letter.save({ new: true, upsert: false, runValidators: true })
          if (!!updated?._id) {
            return {
              success: "Letter approved successfully",
            }
          }
        } else {
          return {
            error: 'Invalid document type'
          }
        }
      }
    }
  } catch (e) {
    console.log(e)
  }
  return {
    error: 'Failed to approve'
  }
}

export async function rejectMemorandumLetter(doctype: DocumentType, memoLetterId: string): Promise<ActionResponseType>
{
  await connectDB()
  try {
    const session = await getSession(Roles.Admin)
    if (!!session?.user) {
      const eSignature = await ESignature.findOne({ adminId: session.user._id }).exec()
      if (!!eSignature?._id) {
        const sid = eSignature._id.toHexString()
        if (doctype === DocumentType.Memo) {
          const memo = await Memo.findById(memoLetterId).exec()
          memo.signatureApprovals.find((signatureApproval: any) => signatureApproval.signature_id.toHexString() === sid).rejectedDate = new Date()
          const updated = await memo.save({ new: true, upsert: false, runValidators: true })
          if (!!updated?._id) {
            return {
              success: "Memorandum rejected successfully",
            }
          }
        } else if (doctype === DocumentType.Letter) {
          const letter = await Letter.findById(memoLetterId).exec()
          letter.signatureApprovals.find((signatureApproval: any) => signatureApproval.signature_id.toHexString() === sid).rejectedDate = new Date()
          const updated = await letter.save({ new: true, upsert: false, runValidators: true })
          if (!!updated?._id) {
            return {
              success: "Letter rejected successfully",
            }
          }
        } else {
          return {
            error: 'Invalid document type'
          }
        }
      }
    }
  } catch (e) {
    console.log(e)
  }
  return {
    error: 'Failed to rekect'
  }
}
