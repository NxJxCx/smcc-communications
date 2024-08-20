'use server'
import type { SessionPayload } from '@/lib/types';
import { type JWTPayload, SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import connectDB from './database';
import { hashPassword } from './hash';
import { NotificationDocument, Roles } from './models/interfaces';
import User from './models/User';
const secretKey = process.env.SESSION_SECRET
const encodedKey = new TextEncoder().encode(secretKey)

export async function encrypt(payload: SessionPayload | { [key: string]: any }, hours: number = 8) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${hours}h`)
    .sign(encodedKey)
}

export async function decrypt(session: string | undefined = ''): Promise<SessionPayload | JWTPayload | { [key: string]: any } | undefined> {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ['HS256'],
    })
    return payload
  } catch (error) {
    return undefined
    // console.log('Failed to verify session')
  }
}

export async function generateSessionPayload(role: Roles, userId: string, expHours: number = 8) {
  await connectDB();
  try {
    const user = await User.findOne({ role, _id: userId }).select('-password').exec()
    if (user) {
      return {
        user: {
          userId: user._id.toHexString(),
          email: user.email,
          role: user.role,
          position: user.position,
          firstName: user.firstName,
          middleName: user.middleName,
          lastName: user.lastName,
          contactNo: user.contactNo,
          isEmailVerified: user.emailVerified.status === 'approved',
          isPhoneVerified: user.contactVerified.status === 'approved',
          deactivated: user.deactivated,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        expiresAt: new Date(Date.now() + expHours * 60 * 60 * 1000)
      }
    }
  } catch (e) {}
  return null;
}

export async function createSession(role: Roles, userId: string, expHours: number = 8): Promise<boolean> {
  const payload = await generateSessionPayload(role, userId, expHours);
  if (!payload) {
    return false;
  }

  const session = await encrypt(payload, expHours)

  cookies().set('session-' + role, session, {
    httpOnly: true,
    secure: true,
    expires: payload.expiresAt as Date,
    sameSite: 'lax',
    path: '/' + role,
  })

  return true;
}

export async function getSession(role: Roles): Promise<JWTPayload | SessionPayload | { [key: string]: any } | null> {
  const cookie = cookies().get('session-' + role)
  if (cookie && cookie.value) {
    const session = await decrypt(cookie.value)
    if (session && (Math.floor(Date.now() / 1000) > (session as any).exp)) {
      await destroySession(role)
      return null;
    }
    return session
  }
  return null;
}

export async function destroySession(role: Roles) {
  cookies().delete('session-' + role)
  const expires = new Date()
  expires.setFullYear(1901, 1, 1)
  cookies().set('session-' + role, '', {
    httpOnly: true,
    secure: true,
    expires,
    sameSite: 'lax',
    path: '/' + role,
  })
}

export async function updateSession(role: Roles): Promise<boolean> {
  const session = await getSession(role);
  if (session) {
    const result = await createSession(role, session.user.userId)
    return result;
  }
  return false;
}

export async function createSignupSession() {
  const suid = await hashPassword(Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15))
  const dth = await hashPassword(Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15))
  const data = {
    firstName: null,
    middleName: null,
    lastName: null,
    address: {
      no: '',
      street: null,
      barangay: null,
      cityMunicipality: null,
      province: null,
      zipCode: null,
    },
    email: null,
    password: null,
    contactNo: null,
    contactVerified: false,
    govId: {
      no: null,
      dateIssued: null,
      placeIssued: null
    },
    tin: null,
    ctcNo: null
  }
  const session = await encrypt({ suid, dth, data }, 1)
  cookies().set('SS', session, {
    httpOnly: true,
    secure: true,
    expires: new Date(Date.now() + 60 * 60 * 1000),
    sameSite: 'lax',
    path: '/signup/steps',
  })
  return { suid, dth }
}

export async function getSignupSession(suid: string, dth: string) {
  const cookie = cookies().get('SS');
  if (cookie?.value) {
    try {
      const session = await decrypt(cookie.value)
      if (session && session.suid === suid && session.dth === dth) {
        return session.data;
      }
    } catch (e) {
      console.log("ERROR: ", e)
    }
  }
  return null
}

export async function updateSignupSession(suid: string | null | undefined, dth: string | null | undefined, data: any) {
  if (!suid || !dth) {
    return null
  }
  const cookie = cookies().get('SS');
  if (cookie?.value) {
    try {
      const session = await decrypt(cookie.value)
      if (session && session.suid === suid && session.dth === dth) {
        const newDth = await hashPassword(Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15))
        let d1 = {
          firstName: null,
          middleName: null,
          lastName: null,
          address: {
            no: '',
            street: null,
            barangay: null,
            cityMunicipality: null,
            province: null,
            zipCode: null,
          },
          email: null,
          password: null,
          contactNo: null,
          contactVerified: null,
        }
        d1 = {...d1, ...data}
        const newSession = await encrypt({ suid, dth: newDth as string, data: d1 }, 1)
        cookies().set('SS', newSession, {
          httpOnly: true,
          secure: true,
          expires: new Date(Date.now() + 60 * 60 * 1000),
          sameSite: 'lax',
          path: '/signup/steps',
        })
        return { suid, dth: newDth as string };
      }
    } catch (e) {}
  }
  return null;
}

export async function getMyNotifications(role: Roles, unreadOnly?: boolean): Promise<NotificationDocument[]|null> {
  await connectDB();
  try {
    const session = await getSession(role);
    if (!session) {
      return null
    }
    // correct this code next line
    const user = await User.findOne({ email: session.user.email, role });
    if (!user) {
      return []
    }
    const notifications = user.notification.reverse()
    if (!unreadOnly) {
      const notifs = JSON.parse(JSON.stringify(notifications)) as NotificationDocument[];
      return notifs;
    }
    const filtered = JSON.parse(JSON.stringify(notifications.filter((n: any) => !n.read))) as NotificationDocument[];
    return filtered
  } catch (e) {
    console.log("ERROR:", e);
  }
  return null;
}