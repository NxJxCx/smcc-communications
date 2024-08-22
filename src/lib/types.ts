import { JWTPayload } from 'jose';
import { z } from 'zod';
import { Roles } from './models/interfaces';

export const SignupFormSchema = z.object({
  employeeId: z.string().trim(),
  password: z.string(),
  role: z.enum([Roles.Admin, Roles.SuperAdmin, Roles.Faculty]),
  email: z.string().trim().email({ message: 'Invalid Email' }),
  prefixName: z.string().trim().optional(),
  suffixName: z.string().trim().optional(),
  firstName: z.string().trim(),
  middleName: z.string().trim().optional(),
  lastName: z.string().trim(),
  departmentIds: z.array(z.string()).optional(),
})

export const LoginFormSchema = z.object({
  role: z.enum([Roles.Admin, Roles.SuperAdmin, Roles.Faculty]),
  employeeId: z.string().trim(),
  password: z.string()
    .min(1, { message: 'Fill in password' })
    .trim(),
});


export const ChangePasswordFormSchema = z.object({
  role: z.enum([Roles.Admin, Roles.SuperAdmin, Roles.Faculty]),
  current_password: z.string()
    .min(1, { message: 'Fill in current password' })
    .trim(),
  new_password: z.string()
    .min(8, { message: 'Be at least 8 characters long' })
    .regex(/[a-zA-Z]/, { message: 'Contain at least one letter.' })
    .regex(/[0-9]/, { message: 'Contain at least one number.' })
    .regex(/[^a-zA-Z0-9]/, {
      message: 'Contain at least one special character.',
    })
    .trim(),
  confirm_password: z.string()
    .min(1, { message: 'Fill in confirm password' })
    .trim()
});


export type LoginFormState =
| {
    success?: boolean,
    errors?: {
      role?: string[]
      employeeId?: string[]
      password?: string[]
      credentials?: string[]
    }
    message?: string
  }
| undefined

export type ResponseFormState =
| {
    errors?: {
      role?: string[]
    } & { [key: string]: string[] };
    message?: string,
    success?: boolean
  }
| undefined

export interface UserSessionProp {
  userId: string;
  employeeId: string
  email: string;
  fullName: string;
  role: Roles;
  prefixName?: string
  suffixName?: string
  firstName: string;
  middleName?: string;
  lastName: string;
  photo: Buffer|string;
  deactivated: boolean;
  createdAt: Date|string;
  updatedAt: Date|string;
}

export interface SessionPayloadProp extends JWTPayload {
  user: UserSessionProp
  expiresAt: Date|string
}

export type SessionPayload = SessionPayloadProp | undefined

export type AuthenticationStatus = 'authenticated' | 'unauthenticated' | 'loading' | 'error'
