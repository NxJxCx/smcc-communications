'use server'

import connectDB from "@/lib/database";
import { compare } from "@/lib/hash";
import { Roles } from "@/lib/models/interfaces";
import User from "@/lib/models/User";
import { createSession, getSession } from "@/lib/session";
import {
  ChangePasswordFormSchema,
  LoginFormSchema,
  type LoginFormState,
  type ResponseFormState,
} from "@/lib/types";

export async function login(role: Roles, state: LoginFormState, formData: FormData): Promise<LoginFormState | undefined> {
  console.log("validating login form")
  const validatedFields = LoginFormSchema.safeParse({
    role,
    employeeId: formData.get('employeeId'),
    password: formData.get('password'),
  })

  if (!validatedFields.success) {
    console.log(validatedFields.error)
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Invalid Credentials'
    }
  }

  await connectDB();
  try {
    let user;
    user = await User.findOne({ employeeId: validatedFields.data.employeeId, role: validatedFields.data.role }).exec();
    // No Such User/Admin
    if (!user) return { errors: { credentials: [] }, message: 'Employee ID is not registered' }
    const isPasswordCorrect = await compare(validatedFields.data.password, user.password)
    // Wrong Password
    if (!isPasswordCorrect) return { errors: { credentials: [] }, message: 'Invalid Credentials' }
    // Account Deactivated
    if (user.deactivated) return { errors: { credentials: [] }, message: 'This account has been deactivated' }
    // do session
    console.log("Creating credentials")
    await createSession(role, user._id.toHexString());
  } catch (err) {
    console.log("ERROR:", err)
    return { errors: { credentials: [] }, message: 'Internal Server Error' }
  }
  return {
    success: true,
    message: 'Logged In Successfully'
  }
}

export async function changePassword(role: Roles, prevState: ResponseFormState, formData: FormData) {
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