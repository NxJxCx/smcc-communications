'use server';
import connectDB from "@/lib/database";
import User from "@/lib/models/User";
import { UserRoles } from "@/lib/models/interfaces";
import { createSession, getSession, updateSession } from "@/lib/session";
import { sendEmailVerificationCode } from "@/lib/twilio";
import { ResponseFormState, SignupFormSchema } from "@/lib/types";

export async function signupSteps(pathname: string, suid: string|null|undefined, dth: string|null|undefined, state: any, formData: FormData): Promise<any> {
  const d = Object.fromEntries(formData)
  if (!!d) {
    let data = Object.fromEntries(Object.entries(d).filter(([k, v]) => !k.startsWith('$')).map(([k, v]) => k === 'contactVerified' ? [k, {status: v === 'true' ? 'approved' : 'pending'}] : [k, v]))
    if (!!data.no || !!data.street || !!data.barangay || !!data.cityMunicipality || !!data.province || !!data.zipCode) {
      data = { ...data, address: { no: data.no, street: data.street, barangay: data.barangay, cityMunicipality: data.cityMunicipality, province: data.province, zipCode: data.zipCode } }
      delete data.no
      delete data.street
      delete data.barangay
      delete data.cityMunicipality
      delete data.province
      delete data.zipCode
    }
    if (!!data) {
      return {
        success: true,
        pathname,
        formData: data
      }
    }
  }
  return {
    success: false,
    pathname,
  }
}

export async function signupComplete(data: any, proceedSession: boolean = true, role?: UserRoles): Promise<any> {
  if (!!data) {
    const user = await User.create({ ...data, role: role || UserRoles.User });
    if (!!user?._id) {
      await sendEmailVerificationCode(user.email, role)
      if (proceedSession) {
        await createSession(role || UserRoles.User, user._id.toHexString());
      }
      return { success: true, message: 'Successfully Created Account' }
    }
  }
  return { success: false, message: 'Failed to create user account' }
}

export async function emailCheckExist(email: string) {
  await connectDB()
  try {
    const user = await User.exists({ email }).exec();
    if (!!user?._id) {
      return true
    }
  } catch (e: any) {}
  return false
}

export async function contactCheckExist(contactNo: string) {
  await connectDB()
  try {
    const user = await User.exists({ contactNo }).exec();
    if (!!user?._id) {
      return true
    }
  } catch (e: any) {}
  return false
}

export async function updatePhoneNumber(email: string, role: UserRoles, newContactNo: string) {
  await connectDB()
  try {
    const result = await User.updateOne(
      { email, role },
      { $set: { contactNo: newContactNo, contactVerified: { status: 'pending', createdAt: new Date(), updatedAt: new Date() } }},
      { upsert: false, new: true, runValidators: true }
    )
    if (result.acknowledged && result.modifiedCount > 0) {
      await updateSession(role);
      return true
    }
  } catch (e: any) {}
  return false;
}



export async function signup(role: UserRoles, state: ResponseFormState, formData: FormData): Promise<ResponseFormState | undefined> {
  const validatedFields = SignupFormSchema.safeParse({
    role,
    email: formData.get('email'),
    contactNo: formData.get('contactNo'),
    position: formData.get('position') || undefined,
    firstName: formData.get('firstName'),
    middleName: formData.get('middleName'),
    lastName: formData.get('lastName'),
    addressNo: formData.get('address.no'),
    addressStreet: formData.get('address.street'),
    addressBarangay: formData.get('address.barangay'),
    addressCityMunicipality: formData.get('address.cityMunicipality'),
    addressProvince: formData.get('address.province'),
    addressZipCode: formData.get('address.zipCode')
  })

  if (!validatedFields.success) {
    console.log((validatedFields.error.flatten().fieldErrors))
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Error'
    }
  }

  await connectDB();
  const data = {
    email: validatedFields.data.email,
    password: 'password',
    contactNo: validatedFields.data.contactNo,
    role: validatedFields.data.role,
    position: validatedFields.data.position,
    firstName: validatedFields.data.firstName,
    middleName: validatedFields.data.middleName,
    lastName: validatedFields.data.lastName,
    address: {
      no: validatedFields.data.addressNo,
      street: validatedFields.data.addressStreet,
      barangay: validatedFields.data.addressBarangay,
      cityMunicipality: validatedFields.data.addressCityMunicipality,
      province: validatedFields.data.addressProvince,
      zipCode: validatedFields.data.addressZipCode
    }
  }
  try {
    const session = await getSession(UserRoles.Admin);
    if (!session) {
      return {
        errors: {
          session: ['Invalid Session']
        },
        message: 'Error'
      }
    }
    const success = await signupComplete(data, false, data.role);
    return success;
  } catch (error: any) {
    return {
      message: 'Error',
      errors: {
        email: [error.message.includes('contactNo_1') ? 'Contact No. already taken' : (error.message.includes('email_1') ? 'Email already taken' : error.message)]
      }
    }
  }
}