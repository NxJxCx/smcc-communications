'use server';;
import connectDB from "@/lib/database";
import { DepartmentDocument, DocumentType, Roles } from "@/lib/modelInterfaces";
import Department from "@/lib/models/Department";
import ESignature from "@/lib/models/ESignature";
import Letter from "@/lib/models/Letter";
import LetterIndividual from "@/lib/models/LetterIndividual";
import Memo from "@/lib/models/Memo";
import MemoIndividual from "@/lib/models/MemoIndividual";
import User from "@/lib/models/User";
import { getSession } from "@/lib/session";
import { isObjectIdOrHexString } from "mongoose";
import { SignatureApprovals, UserDocument } from '../lib/modelInterfaces';
import { addNotification, broadcastNotification } from "./notifications";
import { ActionResponseType } from "./superadmin";


const role = Roles.Admin;

export async function saveMemorandumLetter(departmentId: string, doctype: DocumentType, rejectedId: string|null, cc: string[], eSignatures: string[], formData: FormData): Promise<ActionResponseType & { memorandumId?: string, letterId?: string }>
{
  await connectDB()
  try {
    const session = await getSession(role)
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
        const dept = await Department.findOne({ _id: departmentId }).lean<DepartmentDocument>().exec();
        const count = await Memo.countDocuments({
          departmentId
        }).exec();
        const deptName = dept?.name.split(' ').filter((v: string) => v?.toLowerCase() !== "and" && v?.toLowerCase() !== "or" && v?.toLowerCase() !== "of" && v?.toLowerCase() !== "the" && v !== "").map((v: string) => v.length === 1 || /[A-Z]/.test(v) ? v?.toUpperCase() : v[0]?.toUpperCase()).join("")
        const series = `${deptName}${doctype?.[0]?.toUpperCase()}${doctype?.substring(1)?.toLowerCase()}${(count + 1).toString().padStart(3, "0")}_Series`;
        const memo = await Memo.create({
          departmentId,
          title,
          series,
          cc,
          content,
          preparedBy,
          signatureApprovals
        })
        if (!!memo?._id) {
          if (!!rejectedId) {
            try {
              const deleted = await Memo.deleteOne({ _id: rejectedId }, { runValidators: true }).exec();
              console.log("deleted", deleted)
            } catch (e) {
              console.log("Failed to delete rejected memo: ", e);
            }
          }
          try {
            await addNotification(memo.preparedBy.toHexString(), {
              title: 'New Memorandum Pending Approval',
              message: memo.title + ' for ' + departmentName + ' by you',
              href: '/' + role + '/memo?id=' + memo._id
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
                href: '/' + role + '/memo?id=' + memo._id
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
        const dept = await Department.findOne({ _id: departmentId }).lean<DepartmentDocument>().exec();
        const count = await Letter.countDocuments({
          departmentId
        }).exec();
        const deptName = dept?.name.split(' ').filter((v: string) => v?.toLowerCase() !== "and" && v?.toLowerCase() !== "or" && v?.toLowerCase() !== "of" && v?.toLowerCase() !== "the" && v !== "").map((v: string) => v.length === 1 || /[A-Z]/.test(v) ? v?.toUpperCase() : v[0]?.toUpperCase()).join("")
        const series = `${deptName}${doctype?.[0]?.toUpperCase()}${doctype?.substring(1)?.toLowerCase()}${(count + 1).toString().padStart(3, "0")}_Series`;
        const letter = await Letter.create({
          departmentId,
          title,
          series,
          cc,
          content,
          preparedBy,
          signatureApprovals
        })
        console.log(letter);
        if (!!letter?._id) {
          if (!!rejectedId) {
            try {
              await Letter.deleteOne({ _id: rejectedId }, { runValidators: true }).exec();
            } catch (e) {
              console.log("Failed to delete rejected memo: ", e);
            }
          }
          try {
            await addNotification(letter.preparedBy.toHexString(), {
              title: 'New Letter Pending Approval',
              message: letter.title + ' for ' + departmentName + ' by you',
              href: '/' + role + '/letter?id=' + letter._id
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
                title: 'New Letter Pending Approval',
                message: letter.title + ' for ' + departmentName + ' by ' + preparedByUser.fullName,
                href: '/' + role + '/letter?id=' + letter._id
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


export async function saveMemorandumLetterToIndividual(individualId: string, doctype: DocumentType, cc: string[], formData: FormData): Promise<ActionResponseType & { memorandumId?: string, letterId?: string }>
{
  await connectDB()
  try {
    const session = await getSession(role)
    if (!!session?.user) {
      const preparedBy = session.user._id;
      const individual = await User.findById(individualId).lean<UserDocument>().exec()
      if (!individual) {
        return {
          error: 'Employee not found'
        }
      }
      const content = formData.get('content')
      const title = formData.get('title')
      if (!content) {
        return {
          error: 'Memorandum title should not be empty'
        }
      }
      if (doctype === DocumentType.Memo) {
        const memo = await MemoIndividual.create({
          userId: individual._id?.toString(),
          title,
          cc,
          content: content,
          preparedBy,
        })
        if (!!memo?._id) {
          try {
            const href = individual.role === role ? '/' + role + '/memo/receive?id=' + memo._id : '/' + Roles.Faculty + '/memo?id=' + memo._id;
            await addNotification(individual._id!.toString(), {
              title: 'New Memorandum Sent to you',
              message: memo.title + ' for ' + individual.firstName + ' ' + individual.lastName,
              href
            })
          } catch (e) {
            console.log(e)
          }
          try {
            await addNotification(preparedBy._id.toString(), {
              title: 'New Memorandum Sent to ' + individual.firstName + ' ' + individual.lastName,
              message: memo.title + ' for ' + individual.firstName + ' ' + individual.lastName,
              href: '/' + role + '/memo?id=' + memo._id
            })
          } catch (e) {
            console.log(e);
          }
          return {
            success: 'Memorandum Sent',
            memorandumId: memo._id.toHexString()
          }
        }
      } else if (doctype === DocumentType.Letter) {
        const letter = await LetterIndividual.create({
          userId: individual._id?.toString(),
          title,
          cc,
          content: content,
          preparedBy,
        })
        try {
          const href = individual.role === role ? '/' + role + '/letter/receive?id=' + letter._id : '/' + Roles.Faculty + '/letter?id=' + letter._id;
          await addNotification(individual._id!.toString(), {
            title: 'New Memorandum Sent to you',
            message: letter.title + ' for ' + individual.firstName + ' ' + individual.lastName,
            href,
          })
        } catch (e) {
          console.log(e)
        }
        try {
          await addNotification(preparedBy._id.toString(), {
            title: 'New Memorandum Sent to ' + individual.firstName + ' ' + individual.lastName,
            message: letter.title + ' for ' + individual.firstName + ' ' + individual.lastName,
            href: '/' + role + '/letter?id=' + letter._id
          })
        } catch (e) {
          console.log(e);
        }
        return {
          success: 'Memorandum Sent',
          memorandumId: letter._id.toHexString()
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
    const session = await getSession(role)
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
              const hrefAdmin = '/' + role + '/memo/approved?id=' + memo._id.toHexString()
              try {
                await broadcastNotification({ role: role, departmentId: memo.departmentId as string, title: titleAdmin, message: messageAdmin, href: hrefAdmin })
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
              const hrefAdmin = '/' + role + '/memo/approved?id=' + letter._id.toHexString()
              try {
                await broadcastNotification({ role: role, departmentId: letter.departmentId as string, title: titleAdmin, message: messageAdmin, href: hrefAdmin })
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

export async function rejectMemorandumLetter(doctype: DocumentType, memoLetterId: string, rejectedReason: string): Promise<ActionResponseType>
{
  await connectDB()
  try {
    const session = await getSession(role)
    if (!!session?.user) {
      const eSignature = await ESignature.findOne({ adminId: session.user._id }).exec()
      if (!!eSignature?._id) {
        const sid = eSignature._id.toHexString()
        if (doctype === DocumentType.Memo) {
          const memo = await Memo.findById(memoLetterId).populate('departmentId').exec()
          const departmentName = memo.departmentId.name
          memo.signatureApprovals.find((signatureApproval: any) => signatureApproval.signature_id.toHexString() === sid).rejectedDate = new Date()
          memo.signatureApprovals.find((signatureApproval: any) => signatureApproval.signature_id.toHexString() === sid).rejectedReason = rejectedReason
          const updated = await memo.save({ new: true, upsert: false, runValidators: true })
          if (!!updated?._id) {
            const title = 'Memorandum Rejected'
            const message = memo.title + ' for ' + departmentName + ' by '+ session.user.fullName
            const href = '/' + role + '/memo?id=' + memo._id.toHexString() + '&show=rejected'
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
            const href = '/' + role + '/memo?id=' + letter._id.toHexString() + '&show=rejected'
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


export async function saveESignature(id: string|undefined, eSignatureDataURL?: string): Promise<ActionResponseType>
{
  await connectDB()
  try {
    const session = await getSession(role)
    if (!session) {
      return {
        error: 'Invalid Session'
      }
    }
    if (!id) {
      return {
        error: 'Invalid Account ID'
      }
    }
    if (!eSignatureDataURL) {
      return {
        error: 'Invalid e-Signature'
      }
    }
    const account = await User.findById(id).exec();
    if (!!account) {
      const esignature = await ESignature.create({
        adminId: account._id.toHexString(),
        signature: eSignatureDataURL,
      })
      if (!!esignature) {
        return {
          success: 'e-Signature saved successfully'
        }
      }
    }
  } catch (e) {
    console.log(e)
  }
  return {
    error: 'Failed to save e-signature'
  }
}


export async function updateESignature(eSignatureDataURL?: string): Promise<ActionResponseType>
{
  await connectDB()
  try {
    const session = await getSession(role)
    if (!session) {
      return {
        error: 'Invalid Session'
      }
    }
    if (!eSignatureDataURL) {
      return {
        error: 'Invalid e-Signature'
      }
    }
    const account = await User.findById(session.user?._id).exec();
    if (!!account) {
      const esignature = await ESignature.updateOne(
        { adminId: account._id.toHexString() },
        {
          signature: eSignatureDataURL,
        },
        {
          new: true,
          upsert: false,
          runValidators: true
        }
      ).exec();
      if (esignature.acknowledged && esignature.modifiedCount > 0) {
        return {
          success: 'e-Signature saved successfully'
        }
      }
    }
  } catch (e) {
    console.log(e)
  }
  return {
    error: 'Failed to save e-signature'
  }
}

// export async function removeAdminSignature(employeeId: string)
// {
//   await connectDB()
//   try {
//     const session = await getSession(role)
//     if (!session) {
//       return {
//         error: 'Invalid Session'
//       }
//     }
//     if (!employeeId) {
//       return {
//         error: 'Invalid Account ID'
//       }
//     }
//     const admin = await User.findOne({ employeeId }).lean<UserDocument>().exec()
//     if (!admin) {
//       throw new Error("Admin not found")
//     }
//     const esignature = await ESignature.deleteOne({ adminId: admin._id }, { runValidators: true }).exec()
//     if (esignature.acknowledged && esignature.deletedCount > 0) {
//       return {
//         success: 'Admin signature removed successfully'
//       }
//     }
//   } catch (e) {}
//   return {
//     error: 'Failed to remove admin signature'
//   }
// }


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

