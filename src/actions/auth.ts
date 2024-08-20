'use server'

import connectDB from "@/lib/database";
import { compare } from "@/lib/hash";
import GovId from "@/lib/models/GovId";
import { UserRoles } from "@/lib/models/interfaces";
import User from "@/lib/models/User";
import { createSession, getSession, updateSession } from "@/lib/session";
import {
  ChangeContactNoFormSchema,
  ChangeEmailFormSchema,
  ChangePasswordFormSchema,
  ChangeProfileFormSchema,
  LoginFormSchema,
  SignupFormSchema,
  type LoginFormState,
  type ResponseFormState,
} from "@/lib/types";

export async function login(role: UserRoles, state: LoginFormState, formData: FormData): Promise<LoginFormState | undefined> {
  const validatedFields = LoginFormSchema.safeParse({
    role,
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Invalid Credentials'
    }
  }

  await connectDB();
  try {
    let user;
    if (validatedFields.data.email.includes('@')) {
      user = await User.findOne({ email: validatedFields.data.email, role: validatedFields.data.role }).exec();
    } else {
      const contactNo = validatedFields.data.email.startsWith('09')
        ? '+63' + validatedFields.data.email.substring(1)
        : validatedFields.data.email.startsWith('9')
        ? '+63' + validatedFields.data.email
        : validatedFields.data.email;
      user = await User.findOne({ contactNo, role: validatedFields.data.role }).exec();
    }
    // No Such User/Admin
    if (!user) return { errors: { credentials: [] }, message: 'Invalid Email/Password' }
    const isPasswordCorrect = await compare(validatedFields.data.password, user.password)
    // Wrong Password
    if (!isPasswordCorrect) return { errors: { credentials: [] }, message: 'Invalid Email/Password' }
    // Account Deactivated
    if (user.deactivated) return { errors: { credentials: [] }, message: 'This account has been deactivated' }
    // do session
    await createSession(role, user._id.toHexString());
  } catch (err) {
    console.log("ERROR:", err)
    return { errors: { credentials: [] }, message: 'Internal Server Error' }
  }
  return {
    message: 'Logged In'
  }
}

export async function changePassword(role: UserRoles, prevState: ResponseFormState, formData: FormData) {
  const validatedFields = ChangePasswordFormSchema.safeParse({
    role,
    current_password: formData.get('current_password'),
    new_password: formData.get('new_password'),
    confirm_password: formData.get('confirm_password'),
  })
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Error'
    }
  }
  await connectDB();
  try {
    const session = await getSession(role);
    if (!session) {
      return {
        errors: {
          session: ['Invalid Session']
        },
        message: 'Error'
      }
    }
    const user = await User.findOne({ email: session.user.email,  role }).select('password').exec();
    if (!user?._id) {
      return {
        errors: {
          session: ['Invalid Session']
        },
        message: 'Error'
      }
    }
    const currentPassword = validatedFields.data.current_password;
    const isCorrectPassword = await compare(currentPassword, user.password);
    if (!isCorrectPassword) {
      return {
        errors: {
          current_password: ['Incorrect Password']
        },
        message: 'Error'
      }
    }
    const newPassword = validatedFields.data.new_password;
    const confirmPassword = validatedFields.data.confirm_password;
    if (newPassword !== confirmPassword) {
      return {
        errors: {
          confirm_password: ['Password not matched']
        }
      }
    }
    // update password
    const oldPassword = user.password
    user.password = newPassword
    const updatedUser = await user.save()
    return {
      success: !!updatedUser && updatedUser?.password !== oldPassword
    }
  } catch (err: any) {
    return {
      message: 'Error',
      errors: {
        current_password: [err.message]
      }
    }
  }
}

export async function changeEmailAddress(role: UserRoles|null, prevState: ResponseFormState, formData: FormData) {
  const validatedFields = ChangeEmailFormSchema.safeParse({
    role,
    email: formData.get('email'),
  })
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Error'
    }
  }
  await connectDB();
  const roleData = validatedFields.data.role;
  try {
    const session = await getSession(roleData);
    if (!session) {
      return {
        errors: {
          session: ['Invalid Session']
        },
        message: 'Error'
      }
    }
    const user = await User.findOne({ _id: session.user.userId,  role }).select('email emailVerified').exec();
    if (!user?._id) {
      return {
        errors: {
          session: ['Invalid Session']
        },
        message: 'Error'
      }
    }
    // update the email and verification
    const newEmail = validatedFields.data.email;
    user.email = newEmail;
    user.emailVerified.status = 'pending';
    user.emailVerified.createdAt = new Date();
    user.emailVerified.updatedAt = new Date();
    const updatedUser = await user.save();
    const success = !!updatedUser && updatedUser?.email === newEmail;
    if (success) {
      await updateSession(roleData)
    }
    return {
      success
    }
  } catch (err: any) {
    return {
      message: 'Error',
      errors: {
        email: [err.message]
      }
    }
  }
}

export async function changeContactNo(role: UserRoles|null, prevState: ResponseFormState, formData: FormData) {
  const validatedFields = ChangeContactNoFormSchema.safeParse({
    role,
    contactNo: '+63' + formData.get('contactNo'),
  })
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Error'
    }
  }
  await connectDB();
  const roleData = validatedFields.data.role;
  try {
    const session = await getSession(roleData);
    if (!session) {
      return {
        errors: {
          session: ['Invalid Session']
        },
        message: 'Error'
      }
    }
    const user = await User.findOne({ _id: session.user.userId,  role }).select('contactNo contactVerified').exec();
    if (!user?._id) {
      return {
        errors: {
          session: ['Invalid Session']
        },
        message: 'Error'
      }
    }
    // update the contactNo and verification
    const newContactNo = validatedFields.data.contactNo;
    user.contactNo = newContactNo;
    user.contactVerified.status = 'pending';
    user.contactVerified.createdAt = new Date();
    user.contactVerified.updatedAt = new Date();
    const updatedUser = await user.save();
    const success = !!updatedUser && updatedUser?.contactNo === newContactNo;
    if (success) {
      await updateSession(roleData)
    }
    return {
      success
    }
  } catch (err: any) {
    return {
      message: 'Error',
      errors: {
        email: [err.message]
      }
    }
  }
}

export async function fileToBuffer(file: File) {
  if (!file || !file.size) {
    return null
  }
  const arrayBuffer = await new Blob([file], { type: file.type }).arrayBuffer()
  if (!arrayBuffer) {
    return null
  }
  return Buffer.from(arrayBuffer)
}


export async function updateProfile(role: UserRoles, prevState: ResponseFormState, formData: FormData) {
  const validatedFields = ChangeProfileFormSchema.safeParse({
    role: role,
    position: formData.get('position') || undefined,
    firstName: formData.get('firstName'),
    middleName: formData.get('middleName'),
    lastName: formData.get('lastName'),
    addressNo: formData.get('address.no'),
    addressStreet: formData.get('address.street'),
    addressBarangay: formData.get('address.barangay'),
    addressCityMunicipality: formData.get('address.cityMunicipality'),
    addressProvince: formData.get('address.province'),
    addressZipCode: formData.get('address.zipCode'),
    govIdNo: formData.get('govId.no'),
    govIdDateIssued: formData.get('govId.dateIssued') || null,
    govIdPlaceIssued: formData.get('govId.placeIssued'),
    tin: formData.get('tin'),
    ctcNo: formData.get('ctc.no'),
    ctcDateIssued: formData.get('ctc.dateIssued'),
    ctcPlaceIssued: formData.get('ctc.placeIssued'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Error'
    }
  }

  await connectDB();
  const roleData = validatedFields.data.role;
  try {
    const session = await getSession(roleData);
    if (!session) {
      return {
        errors: {
          session: ['Invalid Session']
        },
        message: 'Error'
      }
    }
    const user = await User.exists({ email: session!.user.email, role: roleData });
    const uid = user?._id;
    if (!uid) {
      return {
        errors: {
          session: ['Invalid Session']
        },
        message: 'Error'
      }
    }
    // update the profile information
    const data = {
      $set: {
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
        },
        govId: {
          no: validatedFields.data.govIdNo,
          dateIssued: validatedFields.data.govIdDateIssued,
          placeIssued: validatedFields.data.govIdPlaceIssued,
          photo: null,
        },
        tin: validatedFields.data.tin,
        ctc: {
          no: validatedFields.data.ctcNo,
          dateIssued: validatedFields.data.ctcDateIssued,
          placeIssued: validatedFields.data.ctcPlaceIssued,
        }
      }
    };
    const gipData: File|null = formData.get('govId.photo') as File|null;
    if (!!gipData) {
      try {
        const file = await fileToBuffer(gipData);
        const dataGovId = {
          file,
          mimeType: gipData.type,
          size: gipData.size
        }
        const govIdResult = await GovId.create(dataGovId)
        if (govIdResult?._id) {
          const govIdPhoto = govIdResult._id.toHexString()
          data.$set.govId.photo = govIdPhoto
        }
      } catch (e: any) {
        console.log("ERROR", e.message);
      }
    }
    const updatedUser = await User.updateOne({ _id: uid }, data, { new: true, upsert: false, runValidators: true });
    const success = updatedUser.acknowledged && updatedUser.modifiedCount > 0;

    if (success) {
      await updateSession(roleData)
    }
    return {
      success,
      message: success ? 'Successfully Updated Profile' : 'Failed to Update Profile'
    }
  } catch (err: any) {
    return {
      message: 'Error',
      errors: {
        email: [err.message]
      }
    }
  }
}


export async function updateAccount(prevState: ResponseFormState, formData: FormData) {
  const validatedFields = SignupFormSchema.safeParse({
    uid: formData.get('uid'),
    role: formData.get('role'),
    email: formData.get('email'),
    contactNo: formData.get('contactNo'),
    position: formData.get('position'),
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
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Error'
    }
  }

  await connectDB();
  const data = {
    role: validatedFields.data.role,
    email: validatedFields.data.email,
    contactNo: validatedFields.data.contactNo,
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
    const user = await User.findOne({ _id: validatedFields.data.uid });
    if (!!user?._id) {
      user.emailVerified.status = data.email === user.email ? user.emailVerified.status : 'pending';
      user.contactVerified.status = data.contactNo === user.contactNo ? user.contactVerified.status : 'pending';
      if (data.email !== user.email) {
        user.emailVerified.createdAt = new Date();
        user.emailVerified.updatedAt = new Date();
      }
      if (data.contactNo !== user.contactNo) {
        user.contactVerified.createdAt = new Date();
        user.contactVerified.updatedAt = new Date();
      }
      user.email = data.email;
      user.contactNo = data.contactNo;
      user.role = data.role;
      user.position = data.position;
      user.firstName = data.firstName;
      user.middleName = data.middleName;
      user.lastName = data.lastName;
      user.address.no = data.address.no;
      user.address.street = data.address.street;
      user.address.barangay = data.address.barangay;
      user.address.cityMunicipality = data.address.cityMunicipality;
      user.address.province = data.address.province;
      user.address.zipCode = data.address.zipCode;

      const updated = await user.save();
      const success = !!updated?._id
      return { success, message: success ? 'Successfully Updated Account' : 'Failed to Update Account' }
    }
  } catch (error: any) {
    return {
      message: 'Error',
      errors: {
        email: [error.message.includes('contactNo_1') ? 'Contact No. already taken' : (error.message.includes('email_1') ? 'Email already taken' : error.message)]
      }
    }
  }
}