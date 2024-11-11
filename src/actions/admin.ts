'use server';;
import connectDB from "@/lib/database";
import { DocumentType, Roles } from "@/lib/modelInterfaces";
import Department from "@/lib/models/Department";
import ESignature from "@/lib/models/ESignature";
import Letter from "@/lib/models/Letter";
import Memo from "@/lib/models/Memo";
import User from "@/lib/models/User";
import { getSession } from "@/lib/session";
import { SignatureApprovals } from '../lib/modelInterfaces';
import { addNotification, broadcastNotification } from "./notifications";
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
      const departmentName = department.name
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
          try {
            await addNotification(memo.preparedBy.toHexString(), {
              title: 'New Memorandum Pending Approval',
              message: memo.title + ' for ' + departmentName + ' by you',
              href: '/' + Roles.Admin + '/memo?id' + memo._id
            })
          } catch (e) {
            console.log(e)
          }
          await Promise.all(signatureApprovals.map(async (sa) => {
            try {
              const eSig = await ESignature.findById(sa.signature_id).exec();
              const userSig = await User.findById(eSig.adminId.toHexString()).exec();
              const preparedByUser = session.user
              await addNotification(userSig._id.toHexString(), {
                title: 'New Memorandum Pending Approval',
                message: memo.title + ' for ' + departmentName + ' by ' + preparedByUser.fullName,
                href: '/' + Roles.Admin + '/memo?id' + memo._id
              })
            } catch (e) {
              console.log(e)
            }
          }))
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
          try {
            await addNotification(letter.preparedBy.toHexString(), {
              title: 'New Memorandum Pending Approval',
              message: letter.title + ' for ' + departmentName + ' by you',
              href: '/' + Roles.Admin + '/memo?id' + letter._id
            })
          } catch (e) {
            console.log(e)
          }
          await Promise.all(signatureApprovals.map(async (signatureApproval) => {
            try {
              const eSig = await ESignature.findById(signatureApproval.signature_id).exec();
              const userSig = await User.findById(eSig.adminId.toHexString()).exec();
              const preparedByUser = session.user
              await addNotification(userSig._id.toHexString(), {
                title: 'New Letter Pending Approval',
                message: 'New Letter for '+ departmentName + ' by ' + preparedByUser.fullName,
                href: '/' + Roles.Admin + '/memo?id=' + letter._id.toHexString()
              })
            } catch (e) {
              console.log(e)
            }
          }))
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
            if (JSON.parse(JSON.stringify(updated)).signatureApprovals.every((signatureApproval: any) => !!signatureApproval.approvedDate)) {
              const title = 'New Memorandum'
              const message = memo.title
              const href = '/' + Roles.Faculty + '/memo?id=' + memo._id.toHexString()
              try {
                await broadcastNotification({ role: Roles.Faculty, departmentId: memo.departmentId as string, title, message, href })
              } catch (e) {
                console.log(e)
              }
              const titleAdmin = 'Memorandum'
              const messageAdmin = memo.title
              const hrefAdmin = '/' + Roles.Admin + '/memo/approved?id=' + memo._id.toHexString()
              try {
                await broadcastNotification({ role: Roles.Admin, departmentId: memo.departmentId as string, title: titleAdmin, message: messageAdmin, href: hrefAdmin })
              } catch (e) {
                console.log(e)
              }
            }
            return {
              success: "Memorandum approved successfully",
            }
          }
        } else if (doctype === DocumentType.Letter) {
          const letter = await Letter.findById(memoLetterId).exec()
          letter.signatureApprovals.find((signatureApproval: any) => signatureApproval.signature_id.toHexString() === sid).approvedDate = new Date()
          const updated = await letter.save({ new: true, upsert: false, runValidators: true })
          if (!!updated?._id) {
            if (JSON.parse(JSON.stringify(updated)).signatureApprovals.every((signatureApproval: any) => !!signatureApproval.approvedDate)) {
              const title = 'New Letter'
              const message = letter.title
              const href = '/' + Roles.Faculty + '/memo?id=' + letter._id.toHexString()
              try {
                await broadcastNotification({ role: Roles.Faculty, departmentId: letter.departmentId as string, title, message, href })
              } catch (e) {
                console.log(e)
              }
              const titleAdmin = 'Letter Approved'
              const messageAdmin = letter.title
              const hrefAdmin = '/' + Roles.Admin + '/memo/approved?id=' + letter._id.toHexString()
              try {
                await broadcastNotification({ role: Roles.Admin, departmentId: letter.departmentId as string, title: titleAdmin, message: messageAdmin, href: hrefAdmin })
              } catch (e) {
                console.log(e)
              }
            }
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
          const memo = await Memo.findById(memoLetterId).populate('departmentId').exec()
          const departmentName = memo.departmentId.name
          memo.signatureApprovals.find((signatureApproval: any) => signatureApproval.signature_id.toHexString() === sid).rejectedDate = new Date()
          const updated = await memo.save({ new: true, upsert: false, runValidators: true })
          if (!!updated?._id) {
            const title = 'Memorandum Rejected'
            const message = memo.title + ' for ' + departmentName + ' by '+ session.user.fullName
            const href = '/' + Roles.Admin + '/memo?id=' + memo._id.toHexString() + '&show=rejected'
            try {
              await addNotification(memo.preparedBy.toHexString(), {
                title,
                message: memo.title,
                href
              })
            } catch (e) {
              console.log(e)
            }
            await Promise.all(JSON.parse(JSON.stringify(memo)).signatureApprovals.map(async (signatureApproval: SignatureApprovals) => {
              try {
                const eSig = await ESignature.findById(signatureApproval.signature_id).exec()
                const userSign = await User.findById(eSig.adminId.toHexString()).exec()
                await addNotification(userSign._id.toHexString(), {
                  title,
                  message,
                  href
                })
              } catch (e) {
                console.log(e)
              }
            }))
            return {
              success: "Memorandum rejected successfully",
            }
          }
        } else if (doctype === DocumentType.Letter) {
          const letter = await Letter.findById(memoLetterId).exec()
          const departmentName = letter.departmentId.name
          letter.signatureApprovals.find((signatureApproval: any) => signatureApproval.signature_id.toHexString() === sid).rejectedDate = new Date()
          const updated = await letter.save({ new: true, upsert: false, runValidators: true })
          if (!!updated?._id) {
            const title = 'Letter Rejected'
            const message = letter.title + ' for ' + departmentName + ' by '+ session.user.fullName
            const href = '/' + Roles.Admin + '/memo?id=' + letter._id.toHexString() + '&show=rejected'
            try {
              await addNotification(letter.preparedBy.toHexString(), {
                title,
                message: letter.title,
                href
              })
            } catch (e) {
              console.log(e)
            }
            await Promise.all(JSON.parse(JSON.stringify(letter)).signatureApprovals.map(async (signatureApproval: SignatureApprovals) => {
              try {
                const eSig = await ESignature.findById(signatureApproval.signature_id).exec()
                const userSign = await User.findById(eSig.adminId.toHexString()).exec()
                await addNotification(userSign._id.toHexString(), {
                  title,
                  message,
                  href
                })
              } catch (e) {
                console.log(e)
              }
            }))
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
    error: 'Failed to reject'
  }
}
