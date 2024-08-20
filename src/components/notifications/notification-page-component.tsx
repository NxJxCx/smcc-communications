'use client';;
import BannerWithBreadcrumb from "@/app/(offices)/banner-with-breadcrumb";
import CardContainer from "@/app/(offices)/card-container";
import LoadingComponent from "@/components/loading";
import { useSession } from "@/components/useSession";
import { NotificationDocument } from "@/lib/models/interfaces";
import clsx from "clsx";
import { Button, HomeIcon, Pagination, PeopleIcon, Spinner } from "evergreen-ui";
import NextLink from 'next/link';
import { useCallback, useEffect, useMemo, useState } from "react";

export default function NotificationsPage({ withHeader = true } : { withHeader?: boolean }) {

  const { data: session, status, notifications, markAsAllRead, markAsRead } = useSession({
    redirect: true,
  });

  const authenticated = useMemo(() => status === 'authenticated', [status])

  const [allNotifications, setAllNotifications] = useState<NotificationDocument[]>([]);
  const [page, setPage] = useState(1);
  const totalPages = useMemo(() => authenticated ? Math.ceil(allNotifications.length / 10) : 0, [allNotifications, authenticated]);
  const currentPageNotifications = useMemo(() => totalPages > 0 ? allNotifications.slice((page - 1) * 10, page * 10) : [], [totalPages, page, allNotifications]);
  const hasNotifications = useMemo(() => authenticated && allNotifications.length > 0, [authenticated, allNotifications]);
  const [eventSource, setEventSource] = useState<EventSource|undefined>();
  const [isLoading, setLoading] = useState(true);

  const onMessage = useCallback((ev: MessageEvent) => {
    setLoading(true)
    const notifs = JSON.parse(ev.data)
    setAllNotifications(notifs)
    setLoading(false)
  }, [])

  const onNotifError = useCallback((ev: Event) => {
    if (!!eventSource?.OPEN) {
      eventSource.close()
    }
  }, [eventSource])

  const refreshNotif = useCallback(() => {
    if (!!eventSource?.OPEN) {
      eventSource.close()
    }
    const url = new URL('/' + session!.user.role + '/api/stream/notification', window.location.origin)
    const newEventSource = new EventSource(url, { withCredentials: true });
    setEventSource(newEventSource)

    newEventSource.onmessage = onMessage;

    newEventSource.onerror = onNotifError;

    return newEventSource
  }, [eventSource, onMessage, onNotifError, session])

  useEffect(() => {
    if (authenticated) {
      setLoading(true)
      const newEventSource = refreshNotif()

      return () => {
        if (!!newEventSource?.OPEN) {
          newEventSource.close();
        }
      };
    }
    return () => {
      if (!!eventSource?.OPEN) {
        eventSource.close();
      }
    };
    // eslint-disable-next-line
  }, [authenticated]);

  const breadcrumb = useMemo(() => [
    {
      icon: HomeIcon,
      url: '/' + session?.user.role,
    },
    {
      label: 'Notifications',
      url: '/' + session?.user.role + '/notifications',
    },
  ], [session?.user.role])

  if (status === 'loading') {
    return <div className="h-screen w-full"><LoadingComponent /></div>
  }

  return status === 'authenticated' && (
    withHeader ? (
    <>
      <BannerWithBreadcrumb
        role={session!.user.role}
        title="Notifications"
        icon={PeopleIcon}
        description="View All Notifications"
        breadcrumb={breadcrumb}
      />
      <div className="p-6">
        <CardContainer title={
            <div className="flex justify-between items-center">
              <span>All Notifications</span>
              <span className="text-sm font-normal">
                ({notifications.length})
                <Button
                  onClick={() => {
                    markAsAllRead()
                    refreshNotif()
                  }}
                  disabled={notifications.length === 0}
                  appearance="primary"
                  intent="success"
                  marginLeft={8}
                >
                  Mark all as read
                </Button>
              </span>
            </div>
          }
        >
          <ul>
            {currentPageNotifications.map((notification) => (
                <li key={notification._id} className="mb-1">
                  <NextLink
                    href={notification.href}
                    onClick={() => {
                      markAsRead(notification._id as string)
                      eventSource?.close()
                    }}
                    className={clsx(
                      "relative flex flex-col justify-start items-start px-2 mb-0.5 pt-2 pb-6 min-h-[80px] rounded border border-green-600",
                      notification.read
                      ? "text-slate-500"
                      : "bg-orange-100 text-green-600"
                    )}
                  >
                      <div className="font-bold text-sm">{notification.title}</div>
                      <div className="text-xs text-gray-500">{notification.message}</div>
                      <span className="absolute left-2 bottom-1 text-xs text-slate-800">{new Date(notification.date as string|Date).toLocaleString()}</span>
                  </NextLink>
                </li>
              )
            )}
          </ul>
          { hasNotifications ? (
            <div className="w-full flex justify-center">
              <Pagination page={page} onPageChange={setPage} totalPages={totalPages} />
            </div>
          ) : (
            isLoading ? (
              <div className="w-full flex justify-center">
                <Spinner />
              </div>
            ) : (
              <div className="w-full text-center">
                {/* // message here */}
                <div className="text-slate-500 text-sm">
                  No notifications yet
                </div>
              </div>
              )
            )
          }
        </CardContainer>
      </div>
    </>
  ) : (
    <>
      <div className="p-6">
        <CardContainer title={
            <div className="flex justify-between items-center">
              <span>All Notifications</span>
              <span className="text-sm font-normal">
                ({notifications.length})
                <Button
                  onClick={() => {
                    markAsAllRead()
                    refreshNotif()
                  }}
                  disabled={notifications.length === 0}
                  appearance="primary"
                  intent="success"
                  marginLeft={8}
                >
                  Mark all as read
                </Button>
              </span>
            </div>
          }
        >
          <ul>
            {currentPageNotifications.map((notification) => (
                <li key={notification._id} className="mb-1">
                  <NextLink
                    href={notification.href}
                    onClick={() => {
                      markAsRead(notification._id as string)
                      eventSource?.close()
                    }}
                    className={clsx(
                      "relative flex flex-col justify-start items-start px-2 mb-0.5 pt-2 pb-6 min-h-[80px] rounded border border-green-600",
                      notification.read
                      ? "text-slate-500"
                      : "bg-orange-100 text-green-600"
                    )}
                  >
                      <div className="font-bold text-sm">{notification.title}</div>
                      <div className="text-xs text-gray-500">{notification.message}</div>
                      <span className="absolute left-2 bottom-1 text-xs text-slate-800">{new Date(notification.date as string|Date).toLocaleString()}</span>
                  </NextLink>
                </li>
              )
            )}
          </ul>
          { hasNotifications ? (
            <div className="w-full flex justify-center">
              <Pagination page={page} onPageChange={setPage} totalPages={totalPages} />
            </div>
          ) : (
            isLoading ? (
              <div className="w-full flex justify-center">
                <Spinner />
              </div>
            ) : (
              <div className="w-full text-center">
                {/* // message here */}
                <div className="text-slate-500 text-sm">
                  No notifications yet
                </div>
              </div>
              )
            )
          }
        </CardContainer>
      </div>
    </>
  ))
}