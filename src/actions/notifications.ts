'use server'

import { UserRoles } from "@/lib/models/interfaces";
import User from "@/lib/models/User";
import { getMyNotifications, getSession } from "@/lib/session";
import { NextRequest } from "next/server";

export async function getNotifications(request: NextRequest) {
  const role = request.nextUrl.pathname.split('/')[1] as UserRoles;
  const unreadOnly = request.nextUrl.searchParams.get('unread')

  let ni = -1;

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  writer.ready.then(async () => {
    let abort = false;
    request.signal.onabort = () => {
      abort = true
    }
    while (!abort) {
      await (async () => {
        const data = await getMyNotifications(role, unreadOnly === '1');
        if (data === null) {
          return
        }
        if (ni === -1 && data.length === 0) {
          ni = data.length
          writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } else if (unreadOnly === '1' && data.length !== ni) {
          ni = data.length
          writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } else if (unreadOnly !== '1' && data.filter((v) => v.read === false).length !== ni) {
          ni = data.filter((v) => v.read === false).length
          writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        }
      })()
      await new Promise(resolve => setTimeout(resolve, 5000))
    }
    if (!writer.closed) {
      await writer.close()
    }
    readable?.cancel()
  })
  return new Response(readable, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "text/event-stream; charset=utf-8",
      Connection: "keep-alive",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
      "Content-Encoding": "none",
    },
  });
}

export async function updateReadNotification(role: UserRoles, notifId: string) {
  try {
    const session = await getSession(role);
    if (!session) {
      return {
        error: 'Invalid Session',
        message: 'Error'
      }
    }
    const user = await User.updateOne(
      { _id: session.user.userId, role },
      {
        $set: { "notification.$[elem].read": true }
      },
      {
        arrayFilters: [{ "elem._id": notifId }],
        new: true,
        upsert: false,
        runValidators: true,
      }
    ).exec();
    const success = user.acknowledged && user.modifiedCount > 0
    return {
      success,
      message: success ? 'Success' : 'Failed'
    }
  } catch (e: any) {
    return {
      error: e.message,
      message: 'Error'
    }
  }
}

export async function updateReadAllNotification(role: UserRoles) {
  try {
    const session = await getSession(role);
    if (!session) {
      return {
        error: 'Invalid Session',
        message: 'Error'
      }
    }
    const user = await User.updateOne(
      { _id: session.user.userId, role },
      {
        $set: { "notification.$[elem].read": true }
      },
      {
        arrayFilters: [{ "elem.read": false }],
        new: true,
        upsert: false,
        runValidators: true,
      }
    ).exec();
    const success = user.acknowledged && user.modifiedCount > 0
    return {
      success,
      message: success ? 'Success' : 'Failed'
    }
  } catch (e: any) {
    return {
      error: e.message,
      message: 'Error'
    }
  }
}

export async function addNotification(userId: string, { title, message, href }: { title: string, message: string, href: string }) {
  try {
    if (userId.length === 24) {
      const notification = {
        title,
        message,
        href,
      }
      const updated = await User.updateOne(
        { _id: userId },
        { $push: { notification }},
        {
          new: true,
          upsert: false,
          runValidators: true
        }
      );
      return updated.acknowledged && updated.modifiedCount > 0
    }
  } catch (e) {
    console.log(e)
  }
  return false
}

export async function broadcastNotification({ role = UserRoles.OBO, title, message, href }: { role?: UserRoles, title: string, message: string, href: string }) {
  try {
    const notification = {
      title,
      message,
      href,
    }
    const updated = await User.updateMany(
      { role },
      { $push: { notification }},
      {
        new: true,
        upsert: false,
        runValidators: true,
      }
    );
    return updated.acknowledged && updated.modifiedCount > 0
  } catch (e) {
    console.log(e)
  }
  return false
}