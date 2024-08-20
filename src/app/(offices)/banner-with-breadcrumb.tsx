'use client'
import { UserRoles } from "@/lib/models/interfaces";
import { type IconComponent, HomeIcon, Badge, Icon } from "evergreen-ui";
import { Fragment } from "react";
import NextLink from 'next/link';

export interface Breadcrumb {
  label?: string;
  url?: string;
  icon?: JSX.Element|IconComponent;
}

export default function BannerWithBreadcrumb({
  role,
  title,
  icon,
  description,
  breadcrumb = [{
    icon: HomeIcon,
    url: '/' + role,
  }],
}: {
  role: UserRoles;
  title: string;
  icon?: JSX.Element|IconComponent;
  description?: string;
  breadcrumb?: Breadcrumb[],
}) {
  return (
    <div className="min-h-[60px] w-full bg-slate-50 shadow py-4 px-8 flex flex-col justify-start md:flex-row md:justify-between md:items-center">
      <div>
        <div className="text-2xl">
          {icon && <Icon icon={icon} marginRight={8} size={20} />}
          {title}
        </div>
        <div className="text-xs italic">
          {description}{' '}
        </div>
      </div>
      <div className="mr-2">
        { breadcrumb.map((item: Breadcrumb, index: number) => (
          <Fragment key={index}>
            <NextLink href={item.url || '/' + role}>
              <Badge color={!item.label ? 'neutral' : (index + 1 === breadcrumb.length ? 'yellow' : 'green')} marginRight={8}>
                {item.icon && <Icon icon={item.icon} />} {item.label}
              </Badge>
            </NextLink>
            { (index + 1 < breadcrumb.length || breadcrumb.length === 1) && (
              <div className="inline-flex items-end text-gray-500 text-sm italic text-center mr-4">{'/'}</div>
            )}
          </Fragment>
          )
        )}
      </div>
    </div>
  )
}