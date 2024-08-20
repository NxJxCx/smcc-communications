'use server';
import connectDB from "@/lib/database";
import Application from "@/lib/models/Application";
import { type ApplicationDocument, type ApplicationStatus, type NotificationDocument, StatusType, TypeOfPermit, UserRoles } from "@/lib/models/interfaces";
import MayorsPermit from "@/lib/models/MayorsPermit";
import User from "@/lib/models/User";
import { sendEmailNotification } from "@/lib/sendGrid";
import { decrypt, encrypt, getSession } from "@/lib/session";
import { sendSMSMessage } from "@/lib/twilio";
import {
  BuildingApplicationSchema,
  BuildingApplicationSchemaOBO,
  ElectricalApplicationSchema,
  ElectricalApplicationSchemaOBO,
  Permits,
  ResponseFormState,
  SanitaryApplicationSchema,
  SanitaryApplicationSchemaOBO,
  TypeOfPermitApplicationSchema,
} from "@/lib/types";
import { cookies } from "next/headers";
import { compress, decompress } from 'shrink-string';
import { addNotification, broadcastNotification } from "./notifications";

const maxSteps = 9;

enum MimeType {
  jpeg = 'image/jpeg',
  // pdf = 'application/pdf',
  png = 'image/png',
  // svg = 'image/svg+xml',
  webp = 'image/webp',
  // zip = 'application/zip'
}

function generateStatus({ step, data, statusType = StatusType.Pending, scenario = 1 }: { step: number, data: ApplicationDocument, statusType?: StatusType, scenario?: 1|2 }) : ApplicationStatus|undefined {
  const permits = [
    !!data.buildingPermit ? 'Building Permit' : undefined,
    !!data.electricalPermit ? 'Electrical Permit' : undefined,
    !!data.sanitaryPermit ? 'Sanitary Permit' : undefined
  ].filter(v => !!v).join(', ')

  return step === 1 && statusType === StatusType.Pending
  ? ({
      name: 'You have successfully registered for building permit application',
      messages: 'You have successfully registered for the initials steps for the ' + permits + ' application. You will be notified again for updates. Thank you.',
      step,
      statusType
    })
  : step === 1 && (statusType === StatusType.Cancelled || statusType === StatusType.Rejected)
  ? ({
      name: 'Your permit application has been invalidated (Step 1)',
      messages: 'Your permit application (' + permits + ') has been declined and cannot proceed to the next step of your application for some reason. Please try to submit another valid permit application.',
      step,
      statusType: StatusType.Cancelled
    })
  : step === 1 && statusType === StatusType.Approved
  ? ({
      name: 'Your permit application has been accepted (Step 1)',
      messages: 'You permit registration has been accepted.',
      step,
      statusType
    })
  : step === 2 && statusType === StatusType.Pending
  ? ({
      name: 'You may now proceed to the Office of the Building Officials (Step 2)',
      messages: 'You may now proceed to the next step of your application with your ' + permits + '. Please visit the Office of the Building Officials with all the requirements at your convenient time.',
      step,
      statusType
    })
  : step === 2 && statusType === StatusType.Rejected
  ? ({
      name: 'Lacking Requirements (Step 2)',
      messages: 'Assessment for your (' + permits + ') application has been seen to be lacking requirements. Please comply and visit the Office of the Building Officials for more details.',
      step,
      statusType
    })
  : step === 2 && statusType === StatusType.Cancelled
  ? ({
      name: 'Permit Application Cancelled (Step 2)',
      messages: 'Your permit application (' + permits + ') has been declined and cannot proceed to the next step of the application for some reason. Please visit the office of the building official for more details.',
      step,
      statusType
    })
  : step === 2 && statusType === StatusType.Approved
  ? ({
      name: 'Your documents has been received (Step 2)',
      messages: 'Your complied documents has now received by the Office of the Building Officials.',
      step,
      statusType
    })
  : step === 3 && statusType === StatusType.Pending
  ? ({
      name: 'On Going Assessment (Step 3)',
      messages: 'Assessmment for your documents is on going. You will be notified again for updates.',
      step,
      statusType
    })
  : step === 3 && statusType === StatusType.Rejected
  ? ({
      name: 'Rejected By Office of the Building Officials (Step 3)',
      messages: 'Your application has been rejected by the MPDC. Please visit the office of the building official for more details.',
      step,
      statusType
    })
  : step === 3 && statusType === StatusType.Approved
  ? ({
      name: 'Assessment Complete by the Office of the Building Officials (Step 3)',
      messages: 'Assessment by the Office of the Building Officials is complete. Your total assessment at the Office of the Building Officials is ' + data.amountOBO!.toLocaleString('en-US', {  style: 'currency', currency: 'PHP', minimumFractionDigits: 2  }) + '. Your documents are now being forwarded to MPDC.',
      step,
      statusType
    })
  : step === 4 && statusType === StatusType.Pending && scenario === 1
  ? ({
      name: 'On Going Assessment by MPDC (Step 4)',
      messages: 'MPDC has received your documents for assessment. You will be notified again for updates. Thank you.',
      step,
      statusType
    })
  : step === 4 && statusType === StatusType.Pending && scenario === 2
  ? ({
      name: 'On Going Assessment by MPDC (Step 4)',
      messages: 'Assessmment for your documents by the MPDC is on going. You will be notified again for updates.',
      step,
      statusType
    })
  : step === 4 && statusType === StatusType.Rejected
  ? ({
      name: 'Rejected By MPDC (Step 4)',
      messages: 'Your application has been rejected by the MPDC. Please visit the office of the building official for more details.',
      step,
      statusType
    })
  : step === 4 && statusType === StatusType.Approved
  ? ({
      name: 'Assessment Complete by the MPDC (Step 4)',
      messages: 'Assessment of your documents by the MPDC is complete. Your total assessment at the MPDC office is ' + data.amountMPDC!.toLocaleString('en-US', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2  }) + '.',
      step,
      statusType
    })
  : step === 5 && statusType === StatusType.Pending
  ? ({
      name: 'Total Assessment Amount (Step 5)',
      messages: 'Your overall total assessment amount by the Office of the Building Officials (' + data.amountOBO!.toLocaleString('en-US', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2  }) + ') and MPDC (' + data.amountMPDC!.toLocaleString('en-US', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2  }) + ') is ' + (data.amountOBO! + data.amountMPDC!).toLocaleString('en-US', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2  }) + '. You may now proceed to the Office of the Building Officials for the copy of your Order of Payment.',
      step,
      statusType
    })
  : step === 5 && statusType === StatusType.Approved
  ? ({
      name: 'Paid Assessment (Step 5)',
      messages: 'Your total assessment amounted to ' + (data.amountOBO! + data.amountMPDC!).toLocaleString('en-US', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2  }) + ' has been paid. Your documents is now ready to be forwarded to the BFP office. Please visit the Office of the Building Officials for more details.',
      step,
      statusType
    })
  : step === 6 && statusType === StatusType.Pending && scenario === 1
  ? ({
      name: 'Forwarded to BFP (Step 6)',
      messages: 'Your documents has been received by the BFP office. Assessment of your documents are on going. You will be notified again for updates.',
      step,
      statusType,
    })
  : step === 6 && statusType === StatusType.Pending && scenario === 2
  ? ({
      name: 'On Going Assessment by BFP (Step 6)',
      messages: 'Assessmment of your documents by the BFP is on going. You will be notified again for updates.',
      step,
      statusType,
    })
  : step === 6 && statusType === StatusType.Rejected
  ? ({
      name: 'Forwarded to BFP (Step 6)',
      messages: 'Your application has been rejected by the BFP. Please visit the office of the building official for more details.',
      step,
      statusType,
    })
  : step === 6 && statusType === StatusType.Approved
  ? ({
      name: 'Assessment Complete by the BFP (Step 6)',
      messages: 'Assessment of your documents by the BFP is complete.',
      step,
      statusType
    })
  : step === 7 && statusType === StatusType.Pending
  ? ({
      name: 'Total Assessment Amount (Step 7)',
      messages: 'Your overall total assessment amount by the BFP is ' + data.amountBFP!.toLocaleString('en-US', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2  }) + '. You may now proceed to the BFP for the copy of your Order of Payment.',
      step,
      statusType
    })
  : step === 7 && statusType === StatusType.Approved
  ? ({
      name: 'Paid Assessment (Step 7)',
      messages: 'Your total assessment amounted to ' + data.amountBFP!.toLocaleString('en-US', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2  }) + ' has been paid.',
      step,
      statusType
    })
  : step === 8 && statusType === StatusType.Pending
  ? ({
      name: 'Forward to Office of the Building Official (Step 8)',
      messages: 'Your documents will now be forwarded back to the Office of the Building Officials.',
      step,
      statusType
    })
  : step === 8 && statusType === StatusType.Approved
  ? ({
      name: 'Received by Office of the Building Official (Step 8)',
      messages: 'Your documents has been received by the Office of the Building Officials.',
      step,
      statusType
    })
  : step === 9 && statusType === StatusType.Pending
  ? ({
      name: "Forward to Mayor's Office (Step 9)",
      messages: "Your documents is being forwarded to the Mayor's Office for Mayor's Permit. Please wait for the next notification for approval.",
      step,
      statusType
    })
  : step === 9 && statusType === StatusType.Approved
  ? ({
      name: "Approved Mayor's Permit (Step 9)",
      messages: "Your application has been approved. You may now claim your permit at the Office of the Building Official.",
      step,
      statusType
    })
  : step === 10 && statusType === StatusType.Completed
  ? ({
      name: data.typeOfPermit.split(' ').map(v => v[0].toUpperCase() + v.substring(1).toLowerCase()).join(' ') + " Application Completed",
      messages: "You have now received your permit. Thank you.",
      step,
      statusType
    })
  : undefined
}

async function generateBroadcastNotification({ step, data }: { step: number, data: ApplicationDocument }): Promise<NotificationDocument[] & { role?: UserRoles }[]> {
  const user = await User.findById(data.user).exec()
  const statuses: ApplicationStatus[] = [...data.status]
  const statusLength = statuses.length
  const lastStatus: ApplicationStatus|undefined = statuses.length > 0 ? statuses.pop() : undefined
  const last2Status: ApplicationStatus|undefined = statuses.length > 1 ? statuses.pop() : undefined
  return step === 1 && statusLength === 1
  ? [{
      title: 'New Permit Request Application',
      message: user?.firstName + ' ' + user?.lastName + ' has newly registered for ' + data.typeOfPermit + '.',
      href: '/' + UserRoles.OBO + '/permit/applications?appNo=' + data.applicationNo,
    }]
  : step === 1 && statusLength === 2 && (lastStatus!.statusType === StatusType.Cancelled || lastStatus!.statusType === StatusType.Rejected)
  ? [{
      title: 'Permit application declined (Step 1)',
      message: 'Application No. ' +  data.applicationNo + ' has been declined.',
      href: '/' + UserRoles.OBO + '/permit/declined?appNo=' + data.applicationNo,
    }]
  : step === 2 && statusLength > 2 && lastStatus!.statusType === StatusType.Pending
  ? [{
      title: 'Permit application approved on queue (Step 1)',
      message: 'Application No. ' +  data.applicationNo + ' is on queue for compliance.',
      href: '/' + UserRoles.OBO + '/permit/queue?appNo=' + data.applicationNo,
    }]
  : step === 2 && statusLength > 3 && lastStatus!.statusType === StatusType.Cancelled
  ? [{
      title: 'Permit application declined (Step 2)',
      message: 'Application No. ' +  data.applicationNo + ' has been declined.',
      href: '/' + UserRoles.OBO + '/permit/declined?appNo=' + data.applicationNo,
    }]
  : step === 2 && statusLength > 3 && lastStatus!.statusType === StatusType.Rejected
  ? [{
      title: 'Permit application rejected (Step 2)',
      message: 'Application No. ' +  data.applicationNo + ' has been rejected. Subject for compliance.',
      href: '/' + UserRoles.OBO + '/permit/rejects?appNo=' + data.applicationNo,
    }]
  : step === 3 && statusLength > 4 && lastStatus!.statusType === StatusType.Pending
  ? [{
      title: last2Status!.statusType === StatusType.Rejected
        ? 'On Going Reassessment (Step 3)'
        : 'On Going Assessment (Step 3)',
      message: 'Application No. ' +  data.applicationNo + ' is subject for assessment.',
      href: '/' + UserRoles.OBO + '/permit/assessment?appNo=' + data.applicationNo,
    }]
  : step === 3 && statusLength > 4 && lastStatus!.statusType === StatusType.Rejected
  ? [{
      title: 'Assessment of documents rejected (Step 3)',
      message: 'Assessment for Application No. ' +  data.applicationNo + ' has been rejected. Subject for compliance.',
      href: '/' + UserRoles.OBO + '/permit/rejects?appNo=' + data.applicationNo,
    }]
  : step === 3 && statusLength > 4 && lastStatus!.statusType === StatusType.Approved
  ? [{
      title: 'Assessment Complete with Assessment Amount (Step 3)',
      message: 'Assessment complete for Application No. ' +  data.applicationNo + '. Please forward the documents to MPDC.',
      href: '/' + UserRoles.OBO + '/permit/mpdc/forward?appNo=' + data.applicationNo,
    },
    {
      role: UserRoles.MPDC,
      title: 'Documents to be received from Office of the Building Officials (Step 1)',
      message: 'Documents of Application No. ' +  data.applicationNo + ' will be forwarded for assessment. Once received, please confirm if received.',
      href: '/' + UserRoles.MPDC + '/permit/receiving?appNo=' + data.applicationNo,
    }]
  : step === 4 && statusLength > 4 && lastStatus!.statusType === StatusType.Pending
  ? [{
      title: last2Status!.statusType === StatusType.Rejected
        ? 'MPDC is on going reassessment (Step 4)'
        : 'MPDC is on going assessment (Step 4)',
      message: 'Assessment by MPDC for Application No. ' +  data.applicationNo + ' is in process.',
      href: '/' + UserRoles.OBO + '/permit/mpdc/pending?appNo=' + data.applicationNo,
    },
    {
      role: UserRoles.MPDC,
      title: last2Status!.statusType === StatusType.Rejected
        ? 'On Going Reassessment (Step 4)'
        : 'On Going Assessment (Step 4)',
      message: 'Assessment for Application No. ' +  data.applicationNo + ' is in process.',
      href: '/' + UserRoles.MPDC + '/permit/assessment?appNo=' + data.applicationNo,
    }]
  : step === 4 && statusLength > 4 && lastStatus!.statusType === StatusType.Rejected
  ? [{
      title: 'Assessment of documents by MPDC rejected (Step 4)',
      message: 'Assessment for Application No. ' +  data.applicationNo + ' has been rejected by MPDC. Subject for compliance.',
      href: '/' + UserRoles.OBO + '/permit/mpdc/rejects?appNo=' + data.applicationNo,
    },
    {
      role: UserRoles.MPDC,
      title: 'Assessment of documents rejected (Step 4)',
      message: 'Assessment for Application No. ' +  data.applicationNo + ' has been rejected. Subject for compliance.',
      href: '/' + UserRoles.MPDC + '/permit/rejects?appNo=' + data.applicationNo,
    }]
  : step === 5 && statusLength > 4 && lastStatus!.statusType === StatusType.Pending
  ? [{
      title: 'Total Assessment for Payment Ready (Step 5)',
      message: 'Application No. ' +  data.applicationNo + ' is ready for payment. Total assessment is ' + (data.amountOBO! + data.amountMPDC!).toLocaleString('en-US', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }) + '',
      href: '/' + UserRoles.OBO + '/permit/payment?appNo=' + data.applicationNo,
    },
    {
      role: UserRoles.Accounting,
      title: 'Total Assessment for Payment Ready (Step 5)',
      message: 'Application No. ' +  data.applicationNo + ' is ready for payment. Total assessment is ' + (data.amountOBO! + data.amountMPDC!).toLocaleString('en-US', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }) + '',
      href: '/' + UserRoles.Accounting + '/permit/payment?appNo=' + data.applicationNo,
    },
    {
      role: UserRoles.MPDC,
      title: 'Assessment Completed',
      message: 'Assessment Complete and Assessment Amount of Application No. ' +  data.applicationNo + ' is ' + data.amountMPDC!.toLocaleString('en-US', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }) + '. Please forward the documents to the Office of the Building Officials.',
      href: '/' + UserRoles.MPDC + '/permit/complete?appNo=' + data.applicationNo,
    }]
  : step === 5 && statusLength > 4 && lastStatus!.statusType === StatusType.Approved
  ? [{
      title: 'Total Assessment Amount Paid (Step 5)',
      message: 'Assessment Amount of ' + (data.amountOBO! + data.amountMPDC!).toLocaleString('en-US', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }) + ' of Application No. ' +  data.applicationNo + ' has been paid. Please forward the documents to the BFP office.',
      href: '/' + UserRoles.OBO + '/permit/bfp/forward?appNo=' + data.applicationNo,
    },
    {
      role: UserRoles.Accounting,
      title: 'Total Assessment Amount Paid (Step 5)',
      message: 'Assessment Amount of ' + (data.amountOBO! + data.amountMPDC!).toLocaleString('en-US', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }) + ' of Application No. ' +  data.applicationNo + ' is marked as paid.',
      href: '/' + UserRoles.Accounting + '/permit/paid?appNo=' + data.applicationNo,
    },
    {
      role: UserRoles.BFP,
      title: 'Documents to be received from Office of the Building Officials (Step 5)',
      message: 'Documents of Application No. ' +  data.applicationNo + ' will be forwarded for assessment. Once received, please confirm if received.',
      href: '/' + UserRoles.BFP + '/permit/receiving?appNo=' + data.applicationNo,
    }]
  : step === 6 && statusLength > 4 && lastStatus!.statusType === StatusType.Pending
  ? [{
      title: last2Status!.statusType === StatusType.Rejected
        ? 'BFP is on going reassessment (Step 6)'
        : 'BFP is on going assessment (Step 6)',
      message: 'Assessment by BFP for Application No. ' +  data.applicationNo + ' is in process.',
      href: '/' + UserRoles.OBO + '/permit/bfp/pending?appNo=' + data.applicationNo,
    },
    {
      role: UserRoles.BFP,
      title: last2Status!.statusType === StatusType.Rejected
        ? 'On Going Reassessment (Step 6)'
        : 'On Going Assessment (Step 6)',
      message: 'Assessment for Application No. ' +  data.applicationNo + ' is in process.',
      href: '/' + UserRoles.BFP + '/permit/assessment?appNo=' + data.applicationNo,
    }]
  : step === 6 && statusLength > 4 && lastStatus!.statusType === StatusType.Rejected
  ? [{
      title: 'Assessment of documents by BFP rejected (Step 6)',
      message: 'Assessment for Application No. ' +  data.applicationNo + ' has been rejected by BFP. Subject for compliance.',
      href: '/' + UserRoles.OBO + '/permit/bfp/rejects?appNo=' + data.applicationNo,
    },
    {
      role: UserRoles.BFP,
      title: 'Assessment of documents rejected (Step 6)',
      message: 'Assessment for Application No. ' +  data.applicationNo + ' has been rejected. Subject for compliance.',
      href: '/' + UserRoles.BFP + '/permit/rejects?appNo=' + data.applicationNo,
    }]
  : step === 7 && statusLength > 4 && lastStatus!.statusType === StatusType.Pending
  ? [{
      title: 'Total Assessment for Payment Ready (Step 7)',
      message: 'Application No. ' +  data.applicationNo + ' is ready for payment. Total assessment is ' + (data.amountOBO! + data.amountMPDC!).toLocaleString('en-US', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }) + '',
      href: '/' + UserRoles.OBO + '/permit/bfp/pending?appNo=' + data.applicationNo,
    },
    {
      role: UserRoles.BFP,
      title: 'Total Assessment for Payment Ready (Step 7)',
      message: 'Application No. ' +  data.applicationNo + ' is ready for payment. Total assessment is ' + (data.amountOBO! + data.amountMPDC!).toLocaleString('en-US', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }) + '',
      href: '/' + UserRoles.BFP + '/permit/payment?appNo=' + data.applicationNo,
    }]
  : step === 8 && statusLength > 4 && lastStatus!.statusType === StatusType.Pending
  ? [{
      title: 'BFP Assessment Completed (Step 8)',
      message: 'Assessment by BFP of Application No. ' +  data.applicationNo + ' has been completed. Documents will be forwarded to your (OBO) office.',
      href: '/' + UserRoles.OBO + '/permit/bfp?appNo=' + data.applicationNo,
    },
    {
      role: UserRoles.BFP,
      title: 'Total Assessment Amount Paid',
      message: 'Assessment Amount of ' + (data.amountOBO! + data.amountMPDC!).toLocaleString('en-US', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }) + ' of Application No. ' +  data.applicationNo + ' has been paid. Please forward the documents to the Office of the Building Officials.',
      href: '/' + UserRoles.BFP + '/permit/complete?appNo=' + data.applicationNo,
    }]
  : step === 9 && statusLength > 4 && lastStatus!.statusType === StatusType.Pending
  ? [{
      title: "Forward for Mayor's Permit (Step 9)",
      message: 'You have received the documents of Application No. ' + data.applicationNo + ". Forward them to the Mayor's Office for Mayor's Permit. Once approved and complete (approved mayor's permit), please approve again to be claimed by the owner of the permit.",
      href: '/' + UserRoles.OBO + '/permit/mayors?appNo=' + data.applicationNo,
    }]
  : step === 9 && statusLength > 4 && lastStatus!.statusType === StatusType.Approved
  ? [{
      title: "Forward for Mayor's Permit (Step 9)",
      message: 'You have received the documents of Application No. ' + data.applicationNo + " from the Mayor's Office. You may contact " + user.contactNo + " to notify the " + user.firstName + " " + user.lastName + " to claim his permit at your (OBO) office.",
      href: '/' + UserRoles.OBO + '/permit/claimable?appNo=' + data.applicationNo,
    }]
  : step === 10 && statusLength > 4 && lastStatus!.statusType === StatusType.Completed
  ? [{
      title: "Permit Claimed",
      message: 'Completed Permit of Application No. ' + data.applicationNo + " has been claimed.",
      href: '/' + UserRoles.OBO + '/permit/completed?appNo=' + data.applicationNo,
    }]
  : []
}

export async function getDecryptedDraftData() {
  const draftDataEncrypted = cookies().get('permit-draft-data')
  const stepDraftEncrypted = cookies().get('permit-step-draft')
  const prevDraftDataEncrypted1 = cookies().get('permit-prev-draft-1')
  const prevDraftDataEncrypted2 = cookies().get('permit-prev-draft-2')
  const dataDraft: {
    draftDataEncrypted?: string
    stepDraftEncrypted?: string
    prevDraftDataEncrypted?: string
  } = {
    draftDataEncrypted: draftDataEncrypted?.value,
    stepDraftEncrypted: stepDraftEncrypted?.value,
    prevDraftDataEncrypted: [prevDraftDataEncrypted1?.value, prevDraftDataEncrypted2?.value].join(''),
  }
  if (Object.values(dataDraft).every((v) => !!v)) {
    const dd = await decompress(dataDraft.draftDataEncrypted)
    const sd = await decompress(dataDraft.stepDraftEncrypted)
    const pdd = await decompress(dataDraft.prevDraftDataEncrypted)
    const ddData = await decrypt(dd)
    const sdData = await decrypt(sd)
    const pddData = await decrypt(pdd)
    return {
      draftData: ddData?.draftData,
      step: sdData?.step,
      prevSteps: sdData?.prevSteps,
      prevDraftData: pddData?.prevDraftData,
    }
  }
  return false
}

export async function removeEncryptedDraftData() {
  cookies().delete('permit-draft-data')
  cookies().delete('permit-step-draft')
  cookies().delete('permit-prev-draft-1')
  cookies().delete('permit-prev-draft-2')
  cookies().set('permit-draft-data', '', {
    httpOnly: true,
    secure: true,
    expires: new Date(),
    sameSite: 'lax',
    path: '/' + UserRoles.User,
  })
  cookies().set('permit-step-draft', '', {
    httpOnly: true,
    secure: true,
    expires: new Date(),
    sameSite: 'lax',
    path: '/' + UserRoles.User,
  })
  cookies().set('permit-prev-draft-1', '', {
    httpOnly: true,
    secure: true,
    expires: new Date(),
    sameSite: 'lax',
    path: '/' + UserRoles.User,
  })
  cookies().set('permit-prev-draft-2', '', {
    httpOnly: true,
    secure: true,
    expires: new Date(),
    sameSite: 'lax',
    path: '/' + UserRoles.User,
  })
}

export async function setEncryptedDraftData(nextStep: number, draftDataValue: any, prevSteps: number[], prevDraftData: any[] = [null]) {
  try {
    const cookiesExpHrs = 24
    const draftData = await encrypt({
      draftData: draftDataValue,
    }, cookiesExpHrs)
    const stepDraft = await encrypt({
      step: nextStep,
      prevSteps,
    })
    const prevDraft = await encrypt({
      prevDraftData
    })
    const compressedDraftData = await compress(draftData)
    const compressedStepDraft = await compress(stepDraft)
    const compressedPrevDraftData = await compress(prevDraft)
    const cpdd1 = compressedPrevDraftData.substring(0, Math.ceil(compressedPrevDraftData.length / 2))
    const cpdd2 = compressedPrevDraftData.substring(Math.ceil(compressedPrevDraftData.length / 2))
    cookies().set('permit-draft-data', compressedDraftData, {
      httpOnly: true,
      secure: true,
      expires: new Date(Date.now() + cookiesExpHrs * 60 * 60 * 1000),
      sameSite: 'lax',
      path: '/' + UserRoles.User,
    })
    cookies().set('permit-step-draft', compressedStepDraft, {
      httpOnly: true,
      secure: true,
      expires: new Date(Date.now() + cookiesExpHrs * 60 * 60 * 1000),
      sameSite: 'lax',
      path: '/' + UserRoles.User,
    })
    cookies().set('permit-prev-draft-1', cpdd1, {
      httpOnly: true,
      secure: true,
      expires: new Date(Date.now() + cookiesExpHrs * 60 * 60 * 1000),
      sameSite: 'lax',
      path: '/' + UserRoles.User,
    })
    cookies().set('permit-prev-draft-2', cpdd2, {
      httpOnly: true,
      secure: true,
      expires: new Date(Date.now() + cookiesExpHrs * 60 * 60 * 1000),
      sameSite: 'lax',
      path: '/' + UserRoles.User,
    })
    return true
  } catch (e: any) {
    console.log("error", e)
    return false
  }
}

export async function buildingPermitApply(step: number, prevState: any, formData: FormData) {
  let session;
  try {
    await connectDB()
    session = await getSession(UserRoles.User)
    if (!session?.user) {
      return {
        errors: {
          session: ['Invalid Session']
        },
        message: 'Error'
      }
    }
  } catch (e: any) {
    return {
      errors: {
        session: ['Error Occured on session: ' + e.message]
      },
      message: 'Error'
    }
  }
  const nextStepOption = formData.get('nextStepOption')
  const validatedFields1 = TypeOfPermitApplicationSchema.safeParse({
    typeOfPermit: formData.get('typeOfPermit'),
  })
  const validatedFields2 = BuildingApplicationSchema.safeParse({
    permitType: formData.get('permitType'),
    formOfOwnership: formData.get('formOfOwnership'),
    lotNo: formData.get('locationOfConstruction.lotNo'),
    blkNo: formData.get('locationOfConstruction.blkNo'),
    tctNo: formData.get('locationOfConstruction.tctNo'),
    taxDecNo: formData.get('locationOfConstruction.taxDecNo'),
    street: formData.get('locationOfConstruction.street'),
    barangay: formData.get('locationOfConstruction.barangay'),
    cityMunicipality: formData.get('locationOfConstruction.cityMunicipality'),
    scopeOfWork: formData.get('box1.scopeOfWork.name'),
    scopeOfWorkSpecify: formData.get('box1.scopeOfWork.specify'),
    characterOfOccupancy: formData.get('box1.characterOfOccupancy.name'),
    characterOfOccupancyGroup: formData.get('box1.characterOfOccupancy.group'),
    characterOfOccupancySpecify: formData.get('box1.characterOfOccupancy.specify'),
    architectCivilEngineer: formData.get('box2.architectCivilEngineer'),
    arcAddress: formData.get('box2.address'),
    arcPRCNo: formData.get('box2.prcNo'),
    arcPTRNo: formData.get('box2.ptrNo'),
    arcValidity: formData.get('box2.validity') || undefined,
    arcDateIssued: formData.get('box2.dateIssued') || undefined,
    arcIssuedAt: formData.get('box2.issuedAt'),
    arcTin: formData.get('box2.tin'),
    loar: formData.get('representative.lotOwnerAuthorizedRepresentative'),
    loarAddress: formData.get('representative.address'),
    loarGovId: formData.get('representative.govId.no'),
    loarDateIssued: formData.get('representative.govId.dateIssued') || undefined,
    loarPlaceIssued: formData.get('representative.govId.placeIssued'),
  })
  const validatedFields3 = ElectricalApplicationSchema.safeParse({
    useNotMyBuildingOwner: formData.get('useNotMyBuildingOwner'),
    buildingOwnerFullName: formData.get('buildingOwner.buildingOwnerFullName'),
    buildingOwnerAddress: formData.get('buildingOwner.address'),
    buildingOwnerCtcNo: formData.get('buildingOwner.ctcNo'),
    buildingOwnerDateIssued: formData.get('buildingOwner.dateIssued'),
    buildingOwnerPlaceIssued: formData.get('buildingOwner.placeIssued'),
    loar: formData.get('representative.lotOwnerFullName'),
    loarAddress: formData.get('representative.address'),
    loarCTCNo: formData.get('representative.ctc.no'),
    loarDateIssued: formData.get('representative.ctc.dateIssued') || undefined,
    loarPlaceIssued: formData.get('representative.ctc.placeIssued'),
    formOfOwnership: formData.get('formOfOwnership'),
    lotNo: formData.get('locationOfConstruction.lotNo'),
    blkNo: formData.get('locationOfConstruction.blkNo'),
    tctNo: formData.get('locationOfConstruction.tctNo'),
    taxDecNo: formData.get('locationOfConstruction.taxDecNo'),
    street: formData.get('locationOfConstruction.street'),
    barangay: formData.get('locationOfConstruction.barangay'),
    cityMunicipality: formData.get('locationOfConstruction.cityMunicipality'),
    scopeOfWork: formData.get('box1.scopeOfWork.name'),
    scopeOfWorkSpecify: formData.get('box1.scopeOfWork.specify'),
    useOrCharacterOfOccupancy: formData.get('box1.useOrCharacterOfOccupancy'),
    electricalEngineer: formData.get('box2.electricalEngineer'),
    eeAddress: formData.get('box2.address'),
    eePRCNo: formData.get('box2.prcNo'),
    eePTRNo: formData.get('box2.ptrNo'),
    eeValidity: formData.get('box2.validity') || undefined,
    eeDateIssued: formData.get('box2.dateIssued') || undefined,
    eeIssuedAt: formData.get('box2.issuedAt'),
    eeTin: formData.get('box2.tin'),
  });

  const validatedFields4 = SanitaryApplicationSchema.safeParse({
    useNotMyBuildingOwner: formData.get('useNotMyBuildingOwner'),
    buildingOwnerFullName: formData.get('buildingOwner.buildingOwnerFullName'),
    buildingOwnerAddress: formData.get('buildingOwner.address'),
    buildingOwnerCtcNo: formData.get('buildingOwner.ctcNo'),
    buildingOwnerDateIssued: formData.get('buildingOwner.dateIssued'),
    buildingOwnerPlaceIssued: formData.get('buildingOwner.placeIssued'),
    loar: formData.get('representative.lotOwnerFullName'),
    loarAddress: formData.get('representative.address'),
    loarCTCNo: formData.get('representative.ctc.no'),
    loarDateIssued: formData.get('representative.ctc.dateIssued') || undefined,
    loarPlaceIssued: formData.get('representative.ctc.placeIssued'),
    scopeOfWork: formData.get('box1.scopeOfWork.name'),
    scopeOfWorkSpecify: formData.get('box1.scopeOfWork.specify'),
    useOrCharacterOfOccupancy: formData.get('box1.useOrCharacterOfOccupancy'),
    sanitaryEngineer1: formData.get('box3.sanitaryEngineer'),
    se1Address: formData.get('box3.address'),
    se1PRCNo: formData.get('box3.prcNo'),
    se1PTRNo: formData.get('box3.ptrNo'),
    se1Validity: formData.get('box3.validity') || undefined,
    se1DateIssued: formData.get('box3.dateIssued') || undefined,
    se1IssuedAt: formData.get('box3.issuedAt'),
    se1Tin: formData.get('box3.tin'),
    // sanitaryEngineer2: formData.get('box4.sanitaryEngineer'),
    // se2Address: formData.get('box4.address'),
    // se2PRCNo: formData.get('box4.prcNo'),
    // se2PTRNo: formData.get('box4.ptrNo'),
    // se2Validity: formData.get('box4.validity') || undefined,
    // se2DateIssued: formData.get('box4.dateIssued') || undefined,
    // se2IssuedAt: formData.get('box4.issuedAt'),
    // se2Tin: formData.get('box4.tin'),
  });
  try {
    switch (step) {
      // step 0 - request new permit form
      case 0: {
        const nextStep = 1
        const draftDataValue = {}
        const success = await setEncryptedDraftData(nextStep, draftDataValue, [], [])
        return {
          success,
          step: nextStep
        }
      }
      // step 1 - Type Of Permit Selection
      case 1: {
        if (!validatedFields1.success) {
          return {
            errors: validatedFields1.error.flatten().fieldErrors,
            message: 'Error'
          }
        }
        const typeOfPermitValue = validatedFields1.data.typeOfPermit
        const nextStep = typeOfPermitValue === TypeOfPermit.ElectricalPermitOnly ? 7 : 2;
        const draftDataValue = {
          typeOfPermit: typeOfPermitValue
        }
        const success = await setEncryptedDraftData(nextStep, draftDataValue, [step])
        return {
          success,
          step: nextStep
        }
      }
      // step 2 - Building Permit
      case 2: {
        if (!validatedFields2.success) {
          console.log(validatedFields2.error.flatten().fieldErrors)
          return {
            errors: validatedFields2.error.flatten().fieldErrors,
            message: 'Error'
          }
        }
        let nextStep = 3
        const getDraftData = await getDecryptedDraftData()
        if (!getDraftData) {
          nextStep = 1
          return {
            success: true,
            step: nextStep
          }
        }
        const prevSteps = [...getDraftData.prevSteps, step]
        const representative: any = !!validatedFields2.data.loar ? ({
          lotOwnerAuthorizedRepresentative: validatedFields2.data.loar,
          address: validatedFields2.data.loarAddress,
          govId: {
            no: validatedFields2.data.loarGovId,
            dateIssued: validatedFields2.data.loarDateIssued,
            placeIssued: validatedFields2.data.loarPlaceIssued,
          }
        }) : undefined
        const draftDataValue: any = {
          ...getDraftData.draftData,
          formOfOwnership: validatedFields2.data.formOfOwnership,
          locationOfConstruction: {
            lotNo: validatedFields2.data.lotNo,
            blkNo: validatedFields2.data.blkNo,
            tctNo: validatedFields2.data.tctNo,
            taxDecNo: validatedFields2.data.taxDecNo,
            street: validatedFields2.data.street,
            barangay: validatedFields2.data.barangay,
            cityMunicipality: validatedFields2.data.cityMunicipality,
          },
          representative,
          buildingPermit: {
            permitType: validatedFields2.data.permitType,
            box1: {
              scopeOfWork: {
                name: validatedFields2.data.scopeOfWork,
                specify: validatedFields2.data.scopeOfWorkSpecify,
              },
              characterOfOccupancy: {
                name: validatedFields2.data.characterOfOccupancy,
                group: validatedFields2.data.characterOfOccupancyGroup,
                specify: validatedFields2.data.characterOfOccupancySpecify,
              }
            },
            box2: {
              architectCivilEngineer: validatedFields2.data.architectCivilEngineer,
              address: validatedFields2.data.arcAddress,
              prcNo: validatedFields2.data.arcPRCNo,
              ptrNo: validatedFields2.data.arcPTRNo,
              validity: validatedFields2.data.arcValidity,
              dateIssued: validatedFields2.data.arcDateIssued,
              issuedAt: validatedFields2.data.arcIssuedAt,
              tin: validatedFields2.data.arcTin,
            },
          }
        }
        const prevDraftData = [...getDraftData.prevDraftData, draftDataValue]
        const success = await setEncryptedDraftData(nextStep, draftDataValue, prevSteps, prevDraftData)
        return {
          success,
          step: nextStep
        }
      }
      // step 3 or 5 or 8 - Next Step Option Selection
      case 3:
      case 5:
      case 8: {
        if (!nextStepOption) break;
        let nextStep = Number.parseInt(nextStepOption as string);
        const getDraftData = await getDecryptedDraftData()
        if (!getDraftData) {
          nextStep = 1
          return {
            success: true,
            step: nextStep
          }
        }
        const prevSteps = [...getDraftData.prevSteps, step]
        const draftDataValue = getDraftData.draftData
        const prevDraftData = [...getDraftData.prevDraftData, draftDataValue]
        const success = await setEncryptedDraftData(nextStep, draftDataValue, prevSteps, prevDraftData)
        return {
          success,
          step: nextStep
        }
      }
      // step 4 - Electrical Permit w/ Building Permit
      case 4: {
        if (!validatedFields3.success) {
          console.log(validatedFields3.error.flatten().fieldErrors)
          return {
            errors: validatedFields3.error.flatten().fieldErrors,
            message: 'Error'
          }
        }
        let nextStep = 5
        const getDraftData = await getDecryptedDraftData()
        if (!getDraftData) {
          nextStep = 1
          return {
            success: true,
            step: nextStep
          }
        }
        const prevSteps = [...getDraftData.prevSteps, step]
        const useNotMyBuildingOwner = validatedFields3.data.useNotMyBuildingOwner === 'yes'
        const representative = !!validatedFields3.data.loar && !!getDraftData.draftData?.representative?.lotOwnerAuthorizedRepresentative
          ? ({
              ...getDraftData.draftData.representative,
              ctc: {
                no: validatedFields3.data.loarCTCNo,
                dateIssued: validatedFields3.data.loarDateIssued,
                placeIssued: validatedFields3.data.loarPlaceIssued,
              }
            })
          : undefined;
        const buildingOwner = {
          buildingOwnerFullName: validatedFields3.data.buildingOwnerFullName,
          address: validatedFields3.data.buildingOwnerAddress,
          ctcNo: validatedFields3.data.buildingOwnerCtcNo,
          dateIssued: validatedFields3.data.buildingOwnerDateIssued,
          placeIssued: validatedFields3.data.buildingOwnerPlaceIssued
        };
        const draftDataValue: any = {
          ...getDraftData.draftData,
          useNotMyBuildingOwner,
          buildingOwner,
          representative,
          electricalPermit: {
            box1: {
              scopeOfWork: {
                name: validatedFields3.data.scopeOfWork,
                specify: validatedFields3.data.scopeOfWorkSpecify,
              },
              useOrCharacterOfOccupancy: validatedFields3.data.useOrCharacterOfOccupancy,
            },
            box2: {
              electricalEngineer: validatedFields3.data.electricalEngineer,
              address: validatedFields3.data.eeAddress,
              prcNo: validatedFields3.data.eePRCNo,
              ptrNo: validatedFields3.data.eePTRNo,
              validity: validatedFields3.data.eeValidity,
              dateIssued: validatedFields3.data.eeDateIssued,
              issuedAt: validatedFields3.data.eeIssuedAt,
              tin: validatedFields3.data.eeTin,
            },
          }
        }
        const prevDraftData = [...getDraftData.prevDraftData, draftDataValue]
        const success = await setEncryptedDraftData(nextStep, draftDataValue, prevSteps, prevDraftData)
        return {
          success,
          step: nextStep
        }
      }
      // step 6 - Sanitary Permit w/ Building and Electrical Permit
      case 6: {
        if (!validatedFields4.success) {
          console.log(validatedFields4.error.flatten().fieldErrors)
          return {
            errors: validatedFields4.error.flatten().fieldErrors,
            message: 'Error'
          }
        }
        let nextStep = 100
        const getDraftData = await getDecryptedDraftData()
        if (!getDraftData) {
          nextStep = 1
          return {
            success: true,
            step: nextStep
          }
        }
        const prevSteps = [...getDraftData.prevSteps, step]
        const draftDataValue: any = {
          ...getDraftData.draftData,
          sanitaryPermit: {
            box1: {
              scopeOfWork: {
                name: validatedFields4.data.scopeOfWork,
                specify: validatedFields4.data.scopeOfWorkSpecify,
              },
              useOrCharacterOfOccupancy: getDraftData.draftData.electricalPermit.box1.useOrCharacterOfOccupancy,
            },
            box3: {
              sanitaryEngineer: validatedFields4.data.sanitaryEngineer1,
              address: validatedFields4.data.se1Address,
              prcNo: validatedFields4.data.se1PRCNo,
              ptrNo: validatedFields4.data.se1PTRNo,
              validity: validatedFields4.data.se1Validity,
              dateIssued: validatedFields4.data.se1DateIssued,
              issuedAt: validatedFields4.data.se1IssuedAt,
              tin: validatedFields4.data.se1Tin,
            },
            box4: {
              sanitaryEngineer: validatedFields4.data.sanitaryEngineer2,
              address: validatedFields4.data.se2Address,
              prcNo: validatedFields4.data.se2PRCNo,
              ptrNo: validatedFields4.data.se2PTRNo,
              validity: validatedFields4.data.se2Validity,
              dateIssued: validatedFields4.data.se2DateIssued,
              issuedAt: validatedFields4.data.se2IssuedAt,
              tin: validatedFields4.data.se2Tin,
            },
          }
        }
        const prevDraftData = [...getDraftData.prevDraftData, draftDataValue]
        const success = await setEncryptedDraftData(nextStep, draftDataValue, prevSteps, prevDraftData)
        return {
          success,
          step: nextStep
        }
      }
      // step 7 - Electrical Permit only
      case 7: {
        if (!validatedFields3.success) {
          console.log(validatedFields3.error.flatten().fieldErrors)
          return {
            errors: validatedFields3.error.flatten().fieldErrors,
            message: 'Error'
          }
        }
        let nextStep = 100
        const getDraftData = await getDecryptedDraftData()
        if (!getDraftData) {
          nextStep = 1
          return {
            success: true,
            step: nextStep
          }
        }
        const prevSteps = [...getDraftData.prevSteps, step]
        const useNotMyBuildingOwner = validatedFields3.data.useNotMyBuildingOwner === 'yes'
        const representative = !!validatedFields3.data.loar ? ({
              lotOwnerAuthorizedRepresentative: validatedFields3.data.loar,
              address: validatedFields3.data.loarAddress,
              ctc: {
                no: validatedFields3.data.loarCTCNo,
                dateIssued: validatedFields3.data.loarDateIssued,
                placeIssued: validatedFields3.data.loarPlaceIssued,
              }
            })
          : undefined;
        const buildingOwner = {
          buildingOwnerFullName: validatedFields3.data.buildingOwnerFullName,
          address: validatedFields3.data.buildingOwnerAddress,
          ctcNo: validatedFields3.data.buildingOwnerCtcNo,
          dateIssued: validatedFields3.data.buildingOwnerDateIssued,
          placeIssued: validatedFields3.data.buildingOwnerPlaceIssued
        };
        const draftDataValue: any = {
          ...getDraftData.draftData,
          useNotMyBuildingOwner,
          formOfOwnership: validatedFields3.data.formOfOwnership,
          locationOfConstruction: {
            lotNo: validatedFields3.data.lotNo,
            blkNo: validatedFields3.data.blkNo,
            tctNo: validatedFields3.data.tctNo,
            taxDecNo: validatedFields3.data.taxDecNo,
            street: validatedFields3.data.street,
            barangay: validatedFields3.data.barangay,
            cityMunicipality: validatedFields3.data.cityMunicipality,
          },
          buildingOwner,
          representative,
          electricalPermit: {
            box1: {
              scopeOfWork: {
                name: validatedFields3.data.scopeOfWork,
                specify: validatedFields3.data.scopeOfWorkSpecify,
              },
              useOrCharacterOfOccupancy: validatedFields3.data.useOrCharacterOfOccupancy,
            },
            box2: {
              electricalEngineer: validatedFields3.data.electricalEngineer,
              address: validatedFields3.data.eeAddress,
              prcNo: validatedFields3.data.eePRCNo,
              ptrNo: validatedFields3.data.eePTRNo,
              validity: validatedFields3.data.eeValidity,
              dateIssued: validatedFields3.data.eeDateIssued,
              issuedAt: validatedFields3.data.eeIssuedAt,
              tin: validatedFields3.data.eeTin,
            },
          }
        }
        const prevDraftData = [...getDraftData.prevDraftData, draftDataValue]
        const success = await setEncryptedDraftData(nextStep, draftDataValue, prevSteps, prevDraftData)
        return {
          success,
          step: nextStep
        }
      }
      // step 9 - Sanitary Permit w/ Building Permit Only
      case 9: {
        if (!validatedFields4.success) {
          console.log(validatedFields4.error.flatten().fieldErrors)
          return {
            errors: validatedFields4.error.flatten().fieldErrors,
            message: 'Error'
          }
        }
        let nextStep = 100
        const getDraftData = await getDecryptedDraftData()
        if (!getDraftData) {
          nextStep = 1
          return {
            success: true,
            step: nextStep
          }
        }
        const prevSteps = [...getDraftData.prevSteps, step]
        const useNotMyBuildingOwner = validatedFields4.data.useNotMyBuildingOwner === 'yes'
        const representative = !!validatedFields4.data.loar ? ({
            lotOwnerAuthorizedRepresentative: validatedFields4.data.loar,
            address: validatedFields4.data.loarAddress,
            ctc: {
              no: validatedFields4.data.loarCTCNo,
              dateIssued: validatedFields4.data.loarDateIssued,
              placeIssued: validatedFields4.data.loarPlaceIssued,
            }
          })
          : undefined;
        const buildingOwner = {
          buildingOwnerFullName: validatedFields4.data.buildingOwnerFullName,
          address: validatedFields4.data.buildingOwnerAddress,
          ctcNo: validatedFields4.data.buildingOwnerCtcNo,
          dateIssued: validatedFields4.data.buildingOwnerDateIssued,
          placeIssued: validatedFields4.data.buildingOwnerPlaceIssued
        };
        const draftDataValue: any = {
          ...getDraftData.draftData,
          useNotMyBuildingOwner,
          buildingOwner,
          representative,
          sanitaryPermit: {
            box1: {
              scopeOfWork: {
                name: validatedFields4.data.scopeOfWork,
                specify: validatedFields4.data.scopeOfWorkSpecify,
              },
              useOrCharacterOfOccupancy: validatedFields4.data.useOrCharacterOfOccupancy,
            },
            box3: {
              sanitaryEngineer: validatedFields4.data.sanitaryEngineer1,
              address: validatedFields4.data.se1Address,
              prcNo: validatedFields4.data.se1PRCNo,
              ptrNo: validatedFields4.data.se1PTRNo,
              validity: validatedFields4.data.se1Validity,
              dateIssued: validatedFields4.data.se1DateIssued,
              issuedAt: validatedFields4.data.se1IssuedAt,
              tin: validatedFields4.data.se1Tin,
            },
            // box4: {
            //   sanitaryEngineer: validatedFields4.data.sanitaryEngineer2,
            //   address: validatedFields4.data.se2Address,
            //   prcNo: validatedFields4.data.se2PRCNo,
            //   ptrNo: validatedFields4.data.se2PTRNo,
            //   validity: validatedFields4.data.se2Validity,
            //   dateIssued: validatedFields4.data.se2DateIssued,
            //   issuedAt: validatedFields4.data.se2IssuedAt,
            //   tin: validatedFields4.data.se2Tin,
            // },
          }
        }
        const prevDraftData = [...getDraftData.prevDraftData, draftDataValue]
        const success = await setEncryptedDraftData(nextStep, draftDataValue, prevSteps, prevDraftData)
        return {
          success,
          step: nextStep
        }
      }
      // final - Uploading registration permit to database
      case 100: {
        const getDraftData = await getDecryptedDraftData()
        if (!getDraftData) {
          await removeEncryptedDraftData()
          return {
            success: true,
            step: 1
          }
        }
        const draftData = { ...getDraftData.draftData }
        draftData.useNotMyBuildingNumber = undefined
        draftData.user = session.user.userId
        const applicationNo = (await Application.countDocuments()) + 1;
        draftData.applicationNo = applicationNo.toString().padStart(10, '0')
        draftData.status = [generateStatus({ step: 1, data: draftData, statusType: StatusType.Pending })]
        const apply = await Application.create(draftData)
        const success = !!apply?.applicationNo;
        if (success) {
          try {
            await addNotification(apply.user.toHexString(), { title: draftData.status[0].name, message: draftData.status[0].messages, href: '/user/permit/track/' + apply.applicationNo })
            const notifs = await generateBroadcastNotification({ step: 1, data: apply })
            await Promise.all(notifs.map(async (notif) => await broadcastNotification(notif)))
            await removeEncryptedDraftData()
          } catch (err) {}
        }
        return {
          success,
          message: success ? 'Success' : 'Failed',
          applicationId: success ? applicationNo : undefined
        }
      }
    }
  } catch (e) {
    console.log(e)
  }

  return {
    errors: {
      session: ['Fill out the form']
    },
    message: 'Error'
  }
}

export async function buildingPermitBackAction() {
  try {
    await connectDB()
    const session = await getSession(UserRoles.User)
    if (!session?.user) {
      return {
        errors: {
          session: ['Invalid Session']
        },
        message: 'Error'
      }
    }
  } catch (e: any) {
    return {
      errors: {
        session: ['Error Occured on session: ' + e.message]
      },
      message: 'Error'
    }
  }
  try {
    const data = await getDecryptedDraftData()
    if (!!data) {
      const nStep = Math.max(1, Math.min(maxSteps, data.prevSteps.pop()))
      const pStep = data.prevSteps
      const dData = data.prevDraftData?.pop()
      const pdData = data.prevDraftData || []
      await setEncryptedDraftData(nStep, dData, pStep, pdData)
    }
    return {
      success: true,
    }
  } catch (e: any) {
    return {
      errors: {
        draftData: ['Error Occured: ' + e.message]
      },
      message: 'Error'
    }
  }
}

export async function setAssessmentAmountAction(role: UserRoles, applicationNo: string, step: number, amount: number): Promise<ResponseFormState> {
  try {
    const session = getSession(role)
    if (!!session) {
      switch (step) {
        case 3: {
          const updated = await Application.updateOne({ applicationNo }, { $set: { amountOBO: amount } }, { new: true, upsert: false, runValidators: true }).exec()
          const success = updated.acknowledged && updated.modifiedCount > 0
          return {
            success
          }
        }
        case 4: {
          const updated = await Application.updateOne({ applicationNo }, { $set: { amountMPDC: amount } }, { new: true, upsert: false, runValidators: true }).exec()
          const success = updated.acknowledged && updated.modifiedCount > 0
          return {
            success
          }
        }
        case 7: {
          const updated = await Application.updateOne({ applicationNo }, { $set: { amountBFP: amount } }, { new: true, upsert: false, runValidators: true }).exec()
          const success = updated.acknowledged && updated.modifiedCount > 0
          return {
            success
          }
        }
      }
    }
  } catch (e: any) {
    console.log("error:", e.message)
    return {
      errors: {
        Error: ['Internal Server Error']
      },
      message: e.message
    }
  }
  return {
    errors: {
      session: ['Invalid Session']
    },
    message: 'Invalid Access'
  }
}

async function fileToBuffer(file: File) {
  if (![MimeType.jpeg, MimeType.png, MimeType.webp].includes(file.type as MimeType)) {
    return null
  }
  const arrayBuffer = await file.arrayBuffer()
  if (!arrayBuffer) {
    return null
  }
  return Buffer.from(arrayBuffer)
}

async function uploadMayorsPermit(fileData: File): Promise<string|null|undefined> {
  const file = await fileToBuffer(fileData)
  const result = await MayorsPermit.create({
    file,
    mimeType: fileData.type,
    size: fileData.size
  });
  return result?._id?.toHexString()
}

export async function applicationStepStatusAction(role: UserRoles, applicationNo: string, statusType: StatusType, formData?: FormData|null|undefined): Promise<ResponseFormState> {
  try {
    const session = getSession(role)
    if (!!session) {
      const appl = await Application.findOne({ applicationNo }).populate('user').exec()
      if (!!appl) {
        // check if with mayors permit
        const mayorsPermit = formData?.get('mayors-permit')
        if (!!mayorsPermit) {
          const mayorsPermitFileID = await uploadMayorsPermit(mayorsPermit as File)
          appl.mayorsPermit = mayorsPermitFileID
        }
        const statuses = appl.status as ApplicationStatus[]
        const lastStatus = statuses.length > 0 ? [...statuses].pop() : undefined
        const nextStep = !lastStatus ? 1 : lastStatus.step + (lastStatus.statusType === StatusType.Approved ? 1 : 0)
        const scenario = !lastStatus ? 1 : lastStatus.statusType === StatusType.Rejected ? 2 : 1
        const nextStatus = generateStatus(
          {
            step: nextStep,
            data: appl,
            statusType,
            scenario
          }
        )
        if (!!nextStatus) {
          const rejectReason = formData?.get('reject-reason') || ''
          nextStatus.rejectReason = rejectReason as string;
          appl.status.push(nextStatus)
          const updated = await appl.save({ runValidators: true })
          const success = !!updated && updated.status.length === appl.status.length
          if (success) {
            const latestStatus = [...updated.status].pop()
            try {
              await addNotification(updated.user._id.toHexString(), { title: latestStatus.name, message: latestStatus.messages, href: '/user/permit/track/' + updated.applicationNo })
            } catch (err) {
              console.log("error 1st", err)
            }
            if (nextStep < 10 && nextStep !== 3 && nextStep !== 5 && nextStatus.statusType === StatusType.Approved) {
              const nextStep2 = nextStep + 1
              const nextStatus2 = generateStatus(
                {
                  step: nextStep2,
                  data: updated,
                  statusType: StatusType.Pending
                }
              )
              if (!!nextStatus2) {
                updated.status.push(nextStatus2)
                console.log(nextStatus2)
                const updated2 = await appl.save({ runValidators: true })
                const success2 = !!updated2 && updated2.status.length === updated.status.length
                const latestStatus2 = [...updated2.status].pop()
                try {
                  await addNotification(updated2.user._id.toHexString(), { title: latestStatus2.name, message: latestStatus2.messages, href: '/user/permit/track/' + updated2.applicationNo })
                } catch (err) {
                  console.log("error 1st", err)
                }
                // send SMS Notification
                sendSMSMessage(updated2.user.contactNo, `Your permit application # ${updated2.applicationNo} has been updated:\r\n- ${latestStatus.messages}\r\n- ${latestStatus2.messages}`)
                  .catch(console.log)
                // send Email Notification
                sendEmailNotification(updated2.user.email, updated.user.firstName + ' ' + updated.user.lastName, updated2.applicationNo, [latestStatus, latestStatus2])
                  .catch(console.log)
                try {
                  const notifs = await generateBroadcastNotification({ step: nextStep2, data: updated2 })
                  await Promise.all(notifs.map(async (notif) => await broadcastNotification(notif)))
                } catch (err) {}
                return {
                  success: success2
                }
              }
            } else {
              // send SMS Notification
              sendSMSMessage(updated.user.contactNo, `Your permit application # ${updated.applicationNo} has been updated:\r\n${latestStatus.messages}`)
                .catch(console.log)
              // send Email Notification
              sendEmailNotification(updated.user.email, updated.user.firstName + ' ' + updated.user.lastName, updated.applicationNo, [latestStatus])
                .catch(console.log)
            }
            const notifs = await generateBroadcastNotification({ step: nextStep, data: updated })
            await Promise.all(notifs.map(async (notif) => await broadcastNotification(notif)))
          }
          return {
            success
          }
        }
      }
    }
  } catch (e: any) {
    console.log("error:", e.message)
    return {
      errors: {
        Error: ['Internal Server Error']
      },
      message: e.message
    }
  }
  return {
    errors: {
      session: ['Invalid Session']
    },
    message: 'Invalid Access'
  }
}

export async function updatePermitApplication(applicationNo: string|undefined, prevState: ResponseFormState, formData: FormData): Promise<ResponseFormState> {
  try {
    const session = getSession(UserRoles.OBO)
    if (!!session && !!applicationNo) {
      const validatedFields1 = BuildingApplicationSchemaOBO.safeParse({
        permitType: formData.get('permitType'),
        areaNo: formData.get('buildingPermit.areaNo'),
        formOfOwnership: formData.get('formOfOwnership'),
        lotNo: formData.get('locationOfConstruction.lotNo'),
        blkNo: formData.get('locationOfConstruction.blkNo'),
        tctNo: formData.get('locationOfConstruction.tctNo'),
        taxDecNo: formData.get('locationOfConstruction.taxDecNo'),
        street: formData.get('locationOfConstruction.street'),
        barangay: formData.get('locationOfConstruction.barangay'),
        cityMunicipality: formData.get('locationOfConstruction.cityMunicipality'),
        scopeOfWork: formData.get('buildingPermit.box1.scopeOfWork.name'),
        scopeOfWorkSpecify: formData.get('buildingPermit.box1.scopeOfWork.specify'),
        characterOfOccupancy: formData.get('buildingPermit.box1.characterOfOccupancy.name'),
        characterOfOccupancyGroup: formData.get('buildingPermit.box1.characterOfOccupancy.group'),
        characterOfOccupancySpecify: formData.get('buildingPermit.box1.characterOfOccupancy.specify'),
        architectCivilEngineer: formData.get('buildingPermit.box2.architectCivilEngineer'),
        arcAddress: formData.get('buildingPermit.box2.address'),
        arcPRCNo: formData.get('buildingPermit.box2.prcNo'),
        arcPTRNo: formData.get('buildingPermit.box2.ptrNo'),
        arcValidity: formData.get('buildingPermit.box2.validity') || null,
        arcDateIssued: formData.get('buildingPermit.box2.dateIssued') || null,
        arcIssuedAt: formData.get('buildingPermit.box2.issuedAt'),
        arcTin: formData.get('buildingPermit.box2.tin'),
        loar: formData.get('representative.lotOwnerFullName'),
        loarAddress: formData.get('representative.address'),
        loarGovId: formData.get('representative.govId.no'),
        loarDateIssued: formData.get('representative.govId.dateIssued') || null,
        loarPlaceIssued: formData.get('representative.govId.placeIssued'),
        occupancyClassified: Number.parseFloat(formData.get('buildingPermit.box1.occupancyClassified') as string) || 0,
        numberOfUnits: Number.parseFloat(formData.get('buildingPermit.box1.numberOfUnits') as string) || 0,
        numberOfStorey: Number.parseFloat(formData.get('buildingPermit.box1.numberOfStorey') as string) || 0,
        totalFloorArea: Number.parseFloat(formData.get('buildingPermit.box1.totalFloorArea') as string) || 0,
        lotArea: Number.parseFloat(formData.get('buildingPermit.box1.lotArea') as string) || 0,
        building: formData.get('buildingPermit.box1.building'),
        electrical: formData.get('buildingPermit.box1.electrical'),
        mechanical: formData.get('buildingPermit.box1.mechanical'),
        electronics: formData.get('buildingPermit.box1.electronics'),
        plumbing: formData.get('buildingPermit.box1.plumbing'),
        costOfEquipmentInstalled: [
          Number.parseFloat(formData.get('buildingPermit.box1.costOfEquipmentInstalled.0') as string) || 0,
          Number.parseFloat(formData.get('buildingPermit.box1.costOfEquipmentInstalled.1') as string) || 0,
          Number.parseFloat(formData.get('buildingPermit.box1.costOfEquipmentInstalled.2') as string) || 0,
          Number.parseFloat(formData.get('buildingPermit.box1.costOfEquipmentInstalled.3') as string) || 0,
        ],
        totalEstimatedCost: Number.parseFloat(formData.get('buildingPermit.box1.totalEstimatedCost') as string) || 0,
        proposedDateOfConstruction: formData.get('buildingPermit.box1.proposedDateOfConstruction') || null,
        expectedDateOfCompletion: formData.get('buildingPermit.box1.expectedDateOfCompletion') || null,
      })
      const validatedFields2 = ElectricalApplicationSchemaOBO.safeParse({
        epNo: formData.get('electricalPermit.epNo'),
        buildingPermitNo: formData.get('electricalPermit.buildingPermitNo'),
        buildingOwnerFullName: formData.get('buildingOwner.buildingOwnerFullName'),
        buildingOwnerAddress: formData.get('buildingOwner.address'),
        buildingOwnerCtcNo: formData.get('buildingOwner.ctcNo'),
        buildingOwnerDateIssued: formData.get('buildingOwner.dateIssued'),
        buildingOwnerPlaceIssued: formData.get('buildingOwner.placeIssued'),
        useOrCharacterOfOccupancy: formData.get('electricalPermit.box1.useOrCharacterOfOccupancy'),
        scopeOfWork: formData.get('electricalPermit.box1.scopeOfWork.name'),
        scopeOfWorkSpecify: formData.get('electricalPermit.box1.scopeOfWork.specify'),
        totalConnectedLoad: Number.parseFloat(formData.get('electricalPermit.box1.totalConnectedLoad') as string) || 0,
        totalTransformerCapacity: Number.parseFloat(formData.get('electricalPermit.box1.totalTransformerCapacity') as string) || 0,
        totalGeneratorUPSCapacity: Number.parseFloat(formData.get('electricalPermit.box1.totalGeneratorUPSCapacity') as string) || 0,
        electricalEngineer: formData.get('electricalPermit.box2.electricalEngineer'),
        eeAddress: formData.get('electricalPermit.box2.address'),
        eePRCNo: formData.get('electricalPermit.box2.prcNo'),
        eePTRNo: formData.get('electricalPermit.box2.ptrNo'),
        eeValidity: formData.get('electricalPermit.box2.validity') || null,
        eeDateIssued: formData.get('electricalPermit.box2.dateIssued') || null,
        eeIssuedAt: formData.get('electricalPermit.box2.issuedAt'),
        eeTin: formData.get('electricalPermit.box2.tin'),
        supervisorTypeOfProfession: formData.get('electricalPermit.box3.supervisorTypeOfProfession') || undefined,
        supervisorFullName: formData.get('electricalPermit.box3.supervisorFullName'),
        supervisorAddress: formData.get('electricalPermit.box3.address'),
        supervisorPRCNo: formData.get('electricalPermit.box3.prcNo'),
        supervisorPTRNo: formData.get('electricalPermit.box3.ptrNo'),
        supervisorValidity: formData.get('electricalPermit.box3.validity') || null,
        supervisorDateIssued: formData.get('electricalPermit.box3.dateIssued') || null,
        supervisorIssuedAt: formData.get('electricalPermit.box3.issuedAt'),
        supervisorTin: formData.get('electricalPermit.box3.tin'),
        formOfOwnership: formData.get('formOfOwnership'),
        lotNo: formData.get('locationOfConstruction.lotNo'),
        blkNo: formData.get('locationOfConstruction.blkNo'),
        tctNo: formData.get('locationOfConstruction.tctNo'),
        taxDecNo: formData.get('locationOfConstruction.taxDecNo'),
        street: formData.get('locationOfConstruction.street'),
        barangay: formData.get('locationOfConstruction.barangay'),
        cityMunicipality: formData.get('locationOfConstruction.cityMunicipality'),
        loar: formData.get('representative.lotOwnerFullName'),
        loarAddress: formData.get('representative.address'),
        loarCTCNo: formData.get('representative.ctc.no'),
        loarDateIssued: formData.get('representative.ctc.dateIssued') || undefined,
        loarPlaceIssued: formData.get('representative.ctc.placeIssued'),
      });
      const validatedFields3 = SanitaryApplicationSchemaOBO.safeParse({
        spNo: formData.get('sanitaryPermit.spNo'),
        buildingPermitNo: formData.get('sanitaryPermit.buildingPermitNo'),
        useOrCharacterOfOccupancy: formData.get('sanitaryPermit.box1.useOrCharacterOfOccupancy'),
        scopeOfWork: formData.get('sanitaryPermit.box1.scopeOfWork.name'),
        scopeOfWorkSpecify: formData.get('sanitaryPermit.box1.scopeOfWork.specify') || undefined,
        waterSupply: formData.get('sanitaryPermit.box2.waterSupply.name') || undefined,
        waterSupplySpecify: formData.get('sanitaryPermit.box2.waterSupply.specify') || undefined,
        systemOfDisposal: formData.get('sanitaryPermit.box2.systemOfDisposal.name') || undefined,
        systemOfDisposalSpecify: formData.get('sanitaryPermit.box2.systemOfDisposal.specify') || undefined,
        sanitaryEngineer1: formData.get('sanitaryPermit.box3.sanitaryEngineer'),
        se1Address: formData.get('sanitaryPermit.box3.address'),
        se1PRCNo: formData.get('sanitaryPermit.box3.prcNo'),
        se1PTRNo: formData.get('sanitaryPermit.box3.ptrNo'),
        se1Validity: formData.get('sanitaryPermit.box3.validity') || undefined,
        se1DateIssued: formData.get('sanitaryPermit.box3.dateIssued') || undefined,
        se1IssuedAt: formData.get('sanitaryPermit.box3.issuedAt'),
        se1Tin: formData.get('sanitaryPermit.box3.tin'),
        sanitaryEngineer2: formData.get('sanitaryPermit.box4.sanitaryEngineer'),
        se2Address: formData.get('sanitaryPermit.box4.address'),
        se2PRCNo: formData.get('sanitaryPermit.box4.prcNo'),
        se2PTRNo: formData.get('sanitaryPermit.box4.ptrNo'),
        se2Validity: formData.get('sanitaryPermit.box4.validity') || undefined,
        se2DateIssued: formData.get('sanitaryPermit.box4.dateIssued') || undefined,
        se2IssuedAt: formData.get('sanitaryPermit.box4.issuedAt'),
        se2Tin: formData.get('sanitaryPermit.box4.tin'),
        buildingOwnerFullName: formData.get('buildingOwner.buildingOwnerFullName'),
        buildingOwnerAddress: formData.get('buildingOwner.address'),
        buildingOwnerCtcNo: formData.get('buildingOwner.ctcNo'),
        buildingOwnerDateIssued: formData.get('buildingOwner.dateIssued'),
        buildingOwnerPlaceIssued: formData.get('buildingOwner.placeIssued'),
        loar: formData.get('representative.lotOwnerFullName'),
        loarAddress: formData.get('representative.address'),
        loarCTCNo: formData.get('representative.ctc.no'),
        loarDateIssued: formData.get('representative.ctc.dateIssued') || undefined,
        loarPlaceIssued: formData.get('representative.ctc.placeIssued'),
      });

      const appl = await Application.findOne({ applicationNo }).exec()
      if (!appl?._id) {
        return {
          errors: {
            invalid: ['No Data Selected'],
          },
          message: 'Error'
        }
      }

      const typeOfPermit = appl.typeOfPermit;

      let updateValues: ApplicationDocument|any;

      if (typeOfPermit === TypeOfPermit.BuildingPermit) {
        const hasElectricalPermit = !!appl.electricalPermit;
        const hasSanitaryPermit = !!appl.sanitaryPermit;
        if (!validatedFields1.success) {
          console.log(validatedFields1.error.flatten().fieldErrors)
          return {
            errors: validatedFields1.error.flatten().fieldErrors,
            message: 'Building Permit Error'
          }
        }
        if (hasElectricalPermit) {
          if (!validatedFields2.success) {
            console.log(validatedFields2.error.flatten().fieldErrors)
            return {
              errors: validatedFields2.error.flatten().fieldErrors,
              message: 'Electrical Permit Error'
            }
          }
        }
        if (hasSanitaryPermit) {
          if (!validatedFields3.success) {
            console.log(validatedFields3.error.flatten().fieldErrors)
            return {
              errors: validatedFields3.error.flatten().fieldErrors,
              message: 'Sanitary Permit Error'
            }
          }
        }
        const representative: any = !!validatedFields1.data.loar ? ({
          lotOwnerAuthorizedRepresentative: validatedFields1.data.loar,
          address: validatedFields1.data.loarAddress,
          govId: {
            no: validatedFields1.data.loarGovId,
            dateIssued: validatedFields1.data.loarDateIssued,
            placeIssued: validatedFields1.data.loarPlaceIssued,
          }
        })
        : undefined;
        updateValues = {
          formOfOwnership: validatedFields1.data.formOfOwnership,
          locationOfConstruction: {
            lotNo: validatedFields1.data.lotNo,
            blkNo: validatedFields1.data.blkNo,
            tctNo: validatedFields1.data.tctNo,
            taxDecNo: validatedFields1.data.taxDecNo,
            street: validatedFields1.data.street,
            barangay: validatedFields1.data.barangay,
            cityMunicipality: validatedFields1.data.cityMunicipality,
          },
          representative,
          buildingPermit: {
            permitType: validatedFields1.data.permitType,
            areaNo: validatedFields1.data.areaNo,
            box1: {
              scopeOfWork: {
                name: validatedFields1.data.scopeOfWork,
                specify: validatedFields1.data.scopeOfWorkSpecify
              },
              characterOfOccupancy: {
                name: validatedFields1.data.characterOfOccupancy,
                group: validatedFields1.data.characterOfOccupancyGroup,
                specify: validatedFields1.data.characterOfOccupancySpecify,
              },
              occupancyClassified: validatedFields1.data.occupancyClassified,
              numberOfUnits: validatedFields1.data.numberOfUnits,
              numberOfStorey: validatedFields1.data.numberOfStorey,
              totalFloorArea: validatedFields1.data.totalFloorArea,
              lotArea: validatedFields1.data.lotArea,
              totalEstimatedCost: validatedFields1.data.totalEstimatedCost,
              building: validatedFields1.data.building,
              electrical: validatedFields1.data.electrical,
              mechanical: validatedFields1.data.mechanical,
              electronics: validatedFields1.data.electronics,
              plumbing: validatedFields1.data.plumbing,
              costOfEquipmentInstalled: validatedFields1.data.costOfEquipmentInstalled,
              proposedDateOfConstruction: validatedFields1.data.proposedDateOfConstruction,
              expectedDateOfCompletion: validatedFields1.data.expectedDateOfCompletion,
            },
            box2: {
              architectCivilEngineer: validatedFields1.data.architectCivilEngineer,
              date: new Date(),
              address: validatedFields1.data.arcAddress,
              prcNo: validatedFields1.data.arcPRCNo,
              ptrNo: validatedFields1.data.arcPTRNo,
              validity: validatedFields1.data.arcValidity,
              dateIssued: validatedFields1.data.arcDateIssued,
              issuedAt: validatedFields1.data.arcIssuedAt,
              tin: validatedFields1.data.arcTin,
            }
          }
        }
        if (hasElectricalPermit || hasSanitaryPermit) {
          if (!!validatedFields1.data.loar) {
            updateValues.representative.ctc = {
              no: hasElectricalPermit ? validatedFields2.data!.loarCTCNo : validatedFields3.data!.loarCTCNo,
              dateIssued: hasElectricalPermit ? validatedFields2.data!.loarDateIssued : validatedFields3.data!.loarDateIssued,
              placeIssued: hasElectricalPermit ? validatedFields2.data!.loarPlaceIssued : validatedFields3.data!.loarPlaceIssued,
            }
          }
          updateValues.buildingOwner = {
            buildingOwnerFullName: hasElectricalPermit ? validatedFields2.data!.buildingOwnerFullName : validatedFields3.data!.buildingOwnerFullName,
            address: hasElectricalPermit ? validatedFields2.data!.buildingOwnerAddress : validatedFields3.data!.buildingOwnerAddress,
            ctcNo: hasElectricalPermit ? validatedFields2.data!.buildingOwnerCtcNo : validatedFields3.data!.buildingOwnerAddress,
            dateIssued: hasElectricalPermit ? validatedFields2.data!.buildingOwnerDateIssued : validatedFields3.data!.buildingOwnerDateIssued,
            placeIssued: hasElectricalPermit ? validatedFields2.data!.buildingOwnerPlaceIssued : validatedFields3.data!.buildingOwnerPlaceIssued
          };
          if (hasElectricalPermit) {
            updateValues.electricalPermit = {
              epNo: validatedFields2.data!.epNo,
              buildingPermitNo: validatedFields2.data!.buildingPermitNo,
              box1: {
                scopeOfWork: {
                  name: validatedFields2.data!.scopeOfWork,
                  specify: validatedFields2.data!.scopeOfWorkSpecify,
                },
                useOrCharacterOfOccupancy: validatedFields2.data!.useOrCharacterOfOccupancy,
                totalConnectedLoad: validatedFields2.data!.totalConnectedLoad,
                totalTransformerCapacity: validatedFields2.data!.totalTransformerCapacity,
                totalGeneratorUPSCapacity: validatedFields2.data!.totalGeneratorUPSCapacity,
              },
              box2: {
                electricalEngineer: validatedFields2.data!.electricalEngineer,
                address: validatedFields2.data!.eeAddress,
                prcNo: validatedFields2.data!.eePRCNo,
                ptrNo: validatedFields2.data!.eePTRNo,
                validity: validatedFields2.data!.eeValidity,
                dateIssued: validatedFields2.data!.eeDateIssued,
                issuedAt: validatedFields2.data!.eeIssuedAt,
                tin: validatedFields2.data!.eeTin,
              },
              box3: {
                supervisorTypeOfProfession: validatedFields2.data!.supervisorTypeOfProfession,
                supervisorFullName: validatedFields2.data!.supervisorFullName,
                address: validatedFields2.data!.supervisorAddress,
                prcNo: validatedFields2.data!.supervisorPRCNo,
                ptrNo: validatedFields2.data!.supervisorPTRNo,
                validity: validatedFields2.data!.supervisorValidity,
                dateIssued: validatedFields2.data!.supervisorDateIssued,
                issuedAt: validatedFields2.data!.supervisorIssuedAt,
                tin: validatedFields2.data!.supervisorTin,
              }
            }
          }
          if (hasElectricalPermit) {
            updateValues.sanitaryPermit = {
              spNo: validatedFields3.data!.spNo,
              buildingPermitNo: validatedFields3.data!.buildingPermitNo,
              box1: {
                scopeOfWork: {
                  name: validatedFields3.data!.scopeOfWork,
                  specify: validatedFields3.data!.scopeOfWorkSpecify,
                },
                useOrCharacterOfOccupancy: validatedFields3.data!.useOrCharacterOfOccupancy
              },
              box2: {
                waterSupply: {
                  name: validatedFields3.data!.waterSupply,
                  specify: validatedFields3.data!.waterSupplySpecify,
                },
                systemOfDisposal: {
                  name: validatedFields3.data!.systemOfDisposal,
                  specify: validatedFields3.data!.systemOfDisposalSpecify,
                },
              },
              box3: {
                sanitaryEngineer: validatedFields3.data!.sanitaryEngineer1,
                address: validatedFields3.data!.se1Address,
                prcNo: validatedFields3.data!.se1PRCNo,
                ptrNo: validatedFields3.data!.se1PTRNo,
                validity: validatedFields3.data!.se1Validity,
                dateIssued: validatedFields3.data!.se1DateIssued,
                issuedAt: validatedFields3.data!.se1IssuedAt,
                tin: validatedFields3.data!.se1Tin,
              },
              box4: {
                sanitaryEngineer: validatedFields3.data!.sanitaryEngineer2,
                address: validatedFields3.data!.se2Address,
                prcNo: validatedFields3.data!.se2PRCNo,
                ptrNo: validatedFields3.data!.se2PTRNo,
                validity: validatedFields3.data!.se2Validity,
                dateIssued: validatedFields3.data!.se2DateIssued,
                issuedAt: validatedFields3.data!.se2IssuedAt,
                tin: validatedFields3.data!.se2Tin,
              },
            }
          }
        }
      } else if (typeOfPermit === TypeOfPermit.ElectricalPermitOnly) {
        if (!validatedFields2.success) {
          console.log(validatedFields2.error.flatten().fieldErrors)
          return {
            errors: validatedFields2.error.flatten().fieldErrors,
            message: 'Electrical PErmit Error'
          }
        }
        const representative = !!validatedFields2.data.loar ? ({
            lotOwnerAuthorizedRepresentative: validatedFields2.data.loar,
            address: validatedFields2.data.loarAddress,
            ctc: {
              no: validatedFields2.data.loarCTCNo,
              dateIssued: validatedFields2.data.loarDateIssued,
              placeIssued: validatedFields2.data.loarPlaceIssued,
            }
          })
          : undefined;
        const buildingOwner = {
          buildingOwnerFullName: validatedFields2.data.buildingOwnerFullName,
          address: validatedFields2.data.buildingOwnerAddress,
          ctcNo: validatedFields2.data.buildingOwnerCtcNo,
          dateIssued: validatedFields2.data.buildingOwnerDateIssued,
          placeIssued: validatedFields2.data.buildingOwnerPlaceIssued
        };
        updateValues = {
          formOfOwnership: validatedFields2.data.formOfOwnership,
          locationOfConstruction: {
            lotNo: validatedFields2.data.lotNo,
            blkNo: validatedFields2.data.blkNo,
            tctNo: validatedFields2.data.tctNo,
            taxDecNo: validatedFields2.data.taxDecNo,
            street: validatedFields2.data.street,
            barangay: validatedFields2.data.barangay,
            cityMunicipality: validatedFields2.data.cityMunicipality,
          },
          buildingOwner,
          representative,
          electricalPermit: {
            epNo: validatedFields2.data.epNo,
            buildingPermitNo: validatedFields2.data.buildingPermitNo,
            box1: {
              scopeOfWork: {
                name: validatedFields2.data.scopeOfWork,
                specify: validatedFields2.data.scopeOfWorkSpecify,
              },
              useOrCharacterOfOccupancy: validatedFields2.data.useOrCharacterOfOccupancy,
              totalConnectedLoad: validatedFields2.data.totalConnectedLoad,
              totalTransformerCapacity: validatedFields2.data.totalTransformerCapacity,
              totalGeneratorUPSCapacity: validatedFields2.data.totalGeneratorUPSCapacity,
            },
            box2: {
              electricalEngineer: validatedFields2.data.electricalEngineer,
              address: validatedFields2.data.eeAddress,
              prcNo: validatedFields2.data.eePRCNo,
              ptrNo: validatedFields2.data.eePTRNo,
              validity: validatedFields2.data.eeValidity,
              dateIssued: validatedFields2.data.eeDateIssued,
              issuedAt: validatedFields2.data.eeIssuedAt,
              tin: validatedFields2.data.eeTin,
            },
            box3: {
              supervisorTypeOfProfession: validatedFields2.data.supervisorTypeOfProfession,
              supervisorFullName: validatedFields2.data.supervisorFullName,
              address: validatedFields2.data.supervisorAddress,
              prcNo: validatedFields2.data.supervisorPRCNo,
              ptrNo: validatedFields2.data.supervisorPTRNo,
              validity: validatedFields2.data.supervisorValidity,
              dateIssued: validatedFields2.data.supervisorDateIssued,
              issuedAt: validatedFields2.data.supervisorIssuedAt,
              tin: validatedFields2.data.supervisorTin,
            }
          }
        }
      }
      const updated = await Application.updateOne(
        { applicationNo },
        { $set: updateValues },
        {
          new: true,
          upsert: false,
          runValidators: true,
        }
      )
      const success = updated.acknowledged && updated.modifiedCount > 0;
      return {
        success
      }
    }
  } catch (e: any) {
    console.log("error:", e.message)
    return {
      errors: {
        Error: ['Internal Server Error']
      },
      message: e.message
    }
  }
  return {
    errors: {
      session: ['Invalid Session']
    },
    message: 'Invalid Access'
  }
}

export async function buildingPermitModify(permit: Permits, applicationNo: string, isElectricalPermitOnly: boolean, hasElectricalPermit: boolean, prevState: any, formData: FormData) {
  let session;
  try {
    await connectDB()
    session = await getSession(UserRoles.User)
    if (!session?.user) {
      return {
        errors: {
          session: ['Invalid Session']
        },
        message: 'Error'
      }
    }
  } catch (e: any) {
    return {
      errors: {
        session: ['Error Occured on session: ' + e.message]
      },
      message: 'Error'
    }
  }
  const validatedFields2 = BuildingApplicationSchema.safeParse({
    permitType: formData.get('permitType'),
    formOfOwnership: formData.get('formOfOwnership'),
    lotNo: formData.get('locationOfConstruction.lotNo'),
    blkNo: formData.get('locationOfConstruction.blkNo'),
    tctNo: formData.get('locationOfConstruction.tctNo'),
    taxDecNo: formData.get('locationOfConstruction.taxDecNo'),
    street: formData.get('locationOfConstruction.street'),
    barangay: formData.get('locationOfConstruction.barangay'),
    cityMunicipality: formData.get('locationOfConstruction.cityMunicipality'),
    scopeOfWork: formData.get('box1.scopeOfWork.name'),
    scopeOfWorkSpecify: formData.get('box1.scopeOfWork.specify'),
    characterOfOccupancy: formData.get('box1.characterOfOccupancy.name'),
    characterOfOccupancyGroup: formData.get('box1.characterOfOccupancy.group'),
    characterOfOccupancySpecify: formData.get('box1.characterOfOccupancy.specify'),
    architectCivilEngineer: formData.get('box2.architectCivilEngineer'),
    arcAddress: formData.get('box2.address'),
    arcPRCNo: formData.get('box2.prcNo'),
    arcPTRNo: formData.get('box2.ptrNo'),
    arcValidity: formData.get('box2.validity') || undefined,
    arcDateIssued: formData.get('box2.dateIssued') || undefined,
    arcIssuedAt: formData.get('box2.issuedAt'),
    arcTin: formData.get('box2.tin'),
    loar: formData.get('representative.lotOwnerAuthorizedRepresentative'),
    loarAddress: formData.get('representative.address'),
    loarGovId: formData.get('representative.govId.no'),
    loarDateIssued: formData.get('representative.govId.dateIssued') || undefined,
    loarPlaceIssued: formData.get('representative.govId.placeIssued'),
  })
  const validatedFields3 = ElectricalApplicationSchema.safeParse({
    useNotMyBuildingOwner: formData.get('useNotMyBuildingOwner'),
    buildingOwnerFullName: formData.get('buildingOwner.buildingOwnerFullName'),
    buildingOwnerAddress: formData.get('buildingOwner.address'),
    buildingOwnerCtcNo: formData.get('buildingOwner.ctcNo'),
    buildingOwnerDateIssued: formData.get('buildingOwner.dateIssued'),
    buildingOwnerPlaceIssued: formData.get('buildingOwner.placeIssued'),
    loar: formData.get('representative.lotOwnerFullName'),
    loarAddress: formData.get('representative.address'),
    loarCTCNo: formData.get('representative.ctc.no'),
    loarDateIssued: formData.get('representative.ctc.dateIssued') || undefined,
    loarPlaceIssued: formData.get('representative.ctc.placeIssued'),
    formOfOwnership: formData.get('formOfOwnership'),
    lotNo: formData.get('locationOfConstruction.lotNo'),
    blkNo: formData.get('locationOfConstruction.blkNo'),
    tctNo: formData.get('locationOfConstruction.tctNo'),
    taxDecNo: formData.get('locationOfConstruction.taxDecNo'),
    street: formData.get('locationOfConstruction.street'),
    barangay: formData.get('locationOfConstruction.barangay'),
    cityMunicipality: formData.get('locationOfConstruction.cityMunicipality'),
    scopeOfWork: formData.get('box1.scopeOfWork.name'),
    scopeOfWorkSpecify: formData.get('box1.scopeOfWork.specify'),
    useOrCharacterOfOccupancy: formData.get('box1.useOrCharacterOfOccupancy'),
    electricalEngineer: formData.get('box2.electricalEngineer'),
    eeAddress: formData.get('box2.address'),
    eePRCNo: formData.get('box2.prcNo'),
    eePTRNo: formData.get('box2.ptrNo'),
    eeValidity: formData.get('box2.validity') || undefined,
    eeDateIssued: formData.get('box2.dateIssued') || undefined,
    eeIssuedAt: formData.get('box2.issuedAt'),
    eeTin: formData.get('box2.tin'),
  });

  const validatedFields4 = SanitaryApplicationSchema.safeParse({
    useNotMyBuildingOwner: formData.get('useNotMyBuildingOwner'),
    buildingOwnerFullName: formData.get('buildingOwner.buildingOwnerFullName'),
    buildingOwnerAddress: formData.get('buildingOwner.address'),
    buildingOwnerCtcNo: formData.get('buildingOwner.ctcNo'),
    buildingOwnerDateIssued: formData.get('buildingOwner.dateIssued'),
    buildingOwnerPlaceIssued: formData.get('buildingOwner.placeIssued'),
    loar: formData.get('representative.lotOwnerFullName'),
    loarAddress: formData.get('representative.address'),
    loarCTCNo: formData.get('representative.ctc.no'),
    loarDateIssued: formData.get('representative.ctc.dateIssued') || undefined,
    loarPlaceIssued: formData.get('representative.ctc.placeIssued'),
    scopeOfWork: formData.get('box1.scopeOfWork.name'),
    scopeOfWorkSpecify: formData.get('box1.scopeOfWork.specify'),
    useOrCharacterOfOccupancy: formData.get('box1.useOrCharacterOfOccupancy'),
    sanitaryEngineer1: formData.get('box3.sanitaryEngineer'),
    se1Address: formData.get('box3.address'),
    se1PRCNo: formData.get('box3.prcNo'),
    se1PTRNo: formData.get('box3.ptrNo'),
    se1Validity: formData.get('box3.validity') || undefined,
    se1DateIssued: formData.get('box3.dateIssued') || undefined,
    se1IssuedAt: formData.get('box3.issuedAt'),
    se1Tin: formData.get('box3.tin'),
    // sanitaryEngineer2: formData.get('box4.sanitaryEngineer'),
    // se2Address: formData.get('box4.address'),
    // se2PRCNo: formData.get('box4.prcNo'),
    // se2PTRNo: formData.get('box4.ptrNo'),
    // se2Validity: formData.get('box4.validity') || undefined,
    // se2DateIssued: formData.get('box4.dateIssued') || undefined,
    // se2IssuedAt: formData.get('box4.issuedAt'),
    // se2Tin: formData.get('box4.tin'),
  });
  try {
    switch (permit) {
      // Building Permit
      case Permits.BuildingPermit: {
        if (!validatedFields2.success) {
          console.log(validatedFields2.error.flatten().fieldErrors)
          return {
            errors: validatedFields2.error.flatten().fieldErrors,
            message: 'Error'
          }
        }
        const representative: any = !!validatedFields2.data.loar ? ({
          lotOwnerAuthorizedRepresentative: validatedFields2.data.loar,
          address: validatedFields2.data.loarAddress,
          govId: {
            no: validatedFields2.data.loarGovId,
            dateIssued: validatedFields2.data.loarDateIssued,
            placeIssued: validatedFields2.data.loarPlaceIssued,
          }
        }) : undefined
        const draftDataValue: any = {
          formOfOwnership: validatedFields2.data.formOfOwnership,
          locationOfConstruction: {
            lotNo: validatedFields2.data.lotNo,
            blkNo: validatedFields2.data.blkNo,
            tctNo: validatedFields2.data.tctNo,
            taxDecNo: validatedFields2.data.taxDecNo,
            street: validatedFields2.data.street,
            barangay: validatedFields2.data.barangay,
            cityMunicipality: validatedFields2.data.cityMunicipality,
          },
          representative,
          buildingPermit: {
            permitType: validatedFields2.data.permitType,
            box1: {
              scopeOfWork: {
                name: validatedFields2.data.scopeOfWork,
                specify: validatedFields2.data.scopeOfWorkSpecify,
              },
              characterOfOccupancy: {
                name: validatedFields2.data.characterOfOccupancy,
                group: validatedFields2.data.characterOfOccupancyGroup,
                specify: validatedFields2.data.characterOfOccupancySpecify,
              }
            },
            box2: {
              architectCivilEngineer: validatedFields2.data.architectCivilEngineer,
              address: validatedFields2.data.arcAddress,
              prcNo: validatedFields2.data.arcPRCNo,
              ptrNo: validatedFields2.data.arcPTRNo,
              validity: validatedFields2.data.arcValidity,
              dateIssued: validatedFields2.data.arcDateIssued,
              issuedAt: validatedFields2.data.arcIssuedAt,
              tin: validatedFields2.data.arcTin,
            },
          }
        }
        const up = await Application.updateOne(
          { applicationNo },
          { $set: draftDataValue },
          { upsert: false, new: true, runValidations: true }
        ).exec()
        const success = up.acknowledged && up.modifiedCount > 0
        return {
          success,
        }
      }
      // Electrical Permit
      case Permits.ElectricalPermit: {
        if (!validatedFields3.success) {
          console.log(validatedFields3.error.flatten().fieldErrors)
          return {
            errors: validatedFields3.error.flatten().fieldErrors,
            message: 'Error'
          }
        }
        // w/o Building Permit
        if (isElectricalPermitOnly) {
          // const useNotMyBuildingOwner = validatedFields3.data.useNotMyBuildingOwner === 'yes'
          const representative = !!validatedFields3.data.loar ? ({
                lotOwnerAuthorizedRepresentative: validatedFields3.data.loar,
                address: validatedFields3.data.loarAddress,
                ctc: {
                  no: validatedFields3.data.loarCTCNo,
                  dateIssued: validatedFields3.data.loarDateIssued,
                  placeIssued: validatedFields3.data.loarPlaceIssued,
                }
              })
            : undefined;
          const buildingOwner = {
            buildingOwnerFullName: validatedFields3.data.buildingOwnerFullName,
            address: validatedFields3.data.buildingOwnerAddress,
            ctcNo: validatedFields3.data.buildingOwnerCtcNo,
            dateIssued: validatedFields3.data.buildingOwnerDateIssued,
            placeIssued: validatedFields3.data.buildingOwnerPlaceIssued
          };
          const draftDataValue: any = {
            formOfOwnership: validatedFields3.data.formOfOwnership,
            locationOfConstruction: {
              lotNo: validatedFields3.data.lotNo,
              blkNo: validatedFields3.data.blkNo,
              tctNo: validatedFields3.data.tctNo,
              taxDecNo: validatedFields3.data.taxDecNo,
              street: validatedFields3.data.street,
              barangay: validatedFields3.data.barangay,
              cityMunicipality: validatedFields3.data.cityMunicipality,
            },
            buildingOwner,
            representative,
            electricalPermit: {
              box1: {
                scopeOfWork: {
                  name: validatedFields3.data.scopeOfWork,
                  specify: validatedFields3.data.scopeOfWorkSpecify,
                },
                useOrCharacterOfOccupancy: validatedFields3.data.useOrCharacterOfOccupancy,
              },
              box2: {
                electricalEngineer: validatedFields3.data.electricalEngineer,
                address: validatedFields3.data.eeAddress,
                prcNo: validatedFields3.data.eePRCNo,
                ptrNo: validatedFields3.data.eePTRNo,
                validity: validatedFields3.data.eeValidity,
                dateIssued: validatedFields3.data.eeDateIssued,
                issuedAt: validatedFields3.data.eeIssuedAt,
                tin: validatedFields3.data.eeTin,
              },
            }
          }
          const up = await Application.updateOne(
            { applicationNo },
            { $set: draftDataValue },
            { upsert: false, new: true, runValidations: true }
          ).exec()
          const success = up.acknowledged && up.modifiedCount > 0
          return {
            success,
          }
          // with Building Permit
        } else {
          const getDraftData = await Application.findOne({ applicationNo }).select('representative').exec();
          // const useNotMyBuildingOwner = validatedFields3.data.useNotMyBuildingOwner === 'yes'
          const representative = !!validatedFields3.data.loar && !!getDraftData.representative?.lotOwnerAuthorizedRepresentative
            ? ({
                ...getDraftData.representative,
                ctc: {
                  no: validatedFields3.data.loarCTCNo,
                  dateIssued: validatedFields3.data.loarDateIssued,
                  placeIssued: validatedFields3.data.loarPlaceIssued,
                }
              })
            : undefined;
          const buildingOwner = {
            buildingOwnerFullName: validatedFields3.data.buildingOwnerFullName,
            address: validatedFields3.data.buildingOwnerAddress,
            ctcNo: validatedFields3.data.buildingOwnerCtcNo,
            dateIssued: validatedFields3.data.buildingOwnerDateIssued,
            placeIssued: validatedFields3.data.buildingOwnerPlaceIssued
          };
          const draftDataValue: any = {
            buildingOwner,
            representative,
            electricalPermit: {
              box1: {
                scopeOfWork: {
                  name: validatedFields3.data.scopeOfWork,
                  specify: validatedFields3.data.scopeOfWorkSpecify,
                },
                useOrCharacterOfOccupancy: validatedFields3.data.useOrCharacterOfOccupancy,
              },
              box2: {
                electricalEngineer: validatedFields3.data.electricalEngineer,
                address: validatedFields3.data.eeAddress,
                prcNo: validatedFields3.data.eePRCNo,
                ptrNo: validatedFields3.data.eePTRNo,
                validity: validatedFields3.data.eeValidity,
                dateIssued: validatedFields3.data.eeDateIssued,
                issuedAt: validatedFields3.data.eeIssuedAt,
                tin: validatedFields3.data.eeTin,
              },
            }
          }
          const up = await Application.updateOne(
            { applicationNo },
            { $set: draftDataValue },
            { upsert: false, new: true, runValidations: true }
          ).exec()
          const success = up.acknowledged && up.modifiedCount > 0
          return {
            success,
          }
        }
      }
      // Sanitary Permit
      case Permits.SanitaryPermit: {
        if (!validatedFields4.success) {
          console.log(validatedFields4.error.flatten().fieldErrors)
          return {
            errors: validatedFields4.error.flatten().fieldErrors,
            message: 'Error'
          }
        }
        // with Building and Electrical Permit
        if (hasElectricalPermit) {
          const getDraftData = await Application.findOne({ applicationNo }).select('electricalPermit').exec();
          const draftDataValue: any = {
            sanitaryPermit: {
              box1: {
                scopeOfWork: {
                  name: validatedFields4.data.scopeOfWork,
                  specify: validatedFields4.data.scopeOfWorkSpecify,
                },
                useOrCharacterOfOccupancy: getDraftData.electricalPermit.box1.useOrCharacterOfOccupancy,
              },
              box3: {
                sanitaryEngineer: validatedFields4.data.sanitaryEngineer1,
                address: validatedFields4.data.se1Address,
                prcNo: validatedFields4.data.se1PRCNo,
                ptrNo: validatedFields4.data.se1PTRNo,
                validity: validatedFields4.data.se1Validity,
                dateIssued: validatedFields4.data.se1DateIssued,
                issuedAt: validatedFields4.data.se1IssuedAt,
                tin: validatedFields4.data.se1Tin,
              },
              box4: {
                sanitaryEngineer: validatedFields4.data.sanitaryEngineer2,
                address: validatedFields4.data.se2Address,
                prcNo: validatedFields4.data.se2PRCNo,
                ptrNo: validatedFields4.data.se2PTRNo,
                validity: validatedFields4.data.se2Validity,
                dateIssued: validatedFields4.data.se2DateIssued,
                issuedAt: validatedFields4.data.se2IssuedAt,
                tin: validatedFields4.data.se2Tin,
              },
            }
          }
          const up = await Application.updateOne(
            { applicationNo },
            { $set: draftDataValue },
            { upsert: false, new: true, runValidations: true }
          ).exec()
          const success = up.acknowledged && up.modifiedCount > 0
          return {
            success,
          }
          // w/o Electrical Permit
        } else {
          // const useNotMyBuildingOwner = validatedFields4.data.useNotMyBuildingOwner === 'yes'
          const representative = !!validatedFields4.data.loar ? ({
              lotOwnerAuthorizedRepresentative: validatedFields4.data.loar,
              address: validatedFields4.data.loarAddress,
              ctc: {
                no: validatedFields4.data.loarCTCNo,
                dateIssued: validatedFields4.data.loarDateIssued,
                placeIssued: validatedFields4.data.loarPlaceIssued,
              }
            })
            : undefined;
          const buildingOwner = {
            buildingOwnerFullName: validatedFields4.data.buildingOwnerFullName,
            address: validatedFields4.data.buildingOwnerAddress,
            ctcNo: validatedFields4.data.buildingOwnerCtcNo,
            dateIssued: validatedFields4.data.buildingOwnerDateIssued,
            placeIssued: validatedFields4.data.buildingOwnerPlaceIssued
          };
          const draftDataValue: any = {
            buildingOwner,
            representative,
            sanitaryPermit: {
              box1: {
                scopeOfWork: {
                  name: validatedFields4.data.scopeOfWork,
                  specify: validatedFields4.data.scopeOfWorkSpecify,
                },
                useOrCharacterOfOccupancy: validatedFields4.data.useOrCharacterOfOccupancy,
              },
              box3: {
                sanitaryEngineer: validatedFields4.data.sanitaryEngineer1,
                address: validatedFields4.data.se1Address,
                prcNo: validatedFields4.data.se1PRCNo,
                ptrNo: validatedFields4.data.se1PTRNo,
                validity: validatedFields4.data.se1Validity,
                dateIssued: validatedFields4.data.se1DateIssued,
                issuedAt: validatedFields4.data.se1IssuedAt,
                tin: validatedFields4.data.se1Tin,
              },
              // box4: {
              //   sanitaryEngineer: validatedFields4.data.sanitaryEngineer2,
              //   address: validatedFields4.data.se2Address,
              //   prcNo: validatedFields4.data.se2PRCNo,
              //   ptrNo: validatedFields4.data.se2PTRNo,
              //   validity: validatedFields4.data.se2Validity,
              //   dateIssued: validatedFields4.data.se2DateIssued,
              //   issuedAt: validatedFields4.data.se2IssuedAt,
              //   tin: validatedFields4.data.se2Tin,
              // },
            }
          }
          const up = await Application.updateOne(
            { applicationNo },
            { $set: draftDataValue },
            { upsert: false, new: true, runValidations: true }
          ).exec()
          const success = up.acknowledged && up.modifiedCount > 0
          return {
            success,
          }
        }
      }
    }
  } catch (e) {
    console.log(e)
  }

  return {
    errors: {
      session: ['Fill out the form']
    },
    message: 'Error'
  }
}
