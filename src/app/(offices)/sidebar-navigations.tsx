import { Roles } from "@/lib/models/interfaces";
import { type IconComponent, NotificationsIcon } from "evergreen-ui";

export interface SidebarNavigation {
  name: string;
  icon?: JSX.Element|IconComponent;
  url?: string;
}

const superAdminSidebarNavList: SidebarNavigation[] = [
  // {
  //   name: 'Dashboard',
  //   icon: DashboardIcon,
  //   url: '/admin',
  // },
  {
    name: 'Notifications',
    icon: NotificationsIcon,
    url: '/mpdc/notifications',
  },
  {
    name: 'Receiving List',
    url: '/mpdc/permit/receiving',
  },
  {
    name: 'Going Assessment',
    url: '/mpdc/permit/assessment',
  },
  {
    name: 'Rejected Permits',
    url: '/mpdc/permit/rejects',
  },
  {
    name: 'Completed',
    url: '/mpdc/permit/complete',
  },
  {
    name: 'Account',
    url: '/mpdc/settings/account',
  },
]

const adminSidebarNavList: any[] = [
  // {
  //   name: 'Dashboard',
  //   icon: DashboardIcon,
  //   url: '/obo',
  // },
  {
    name: 'Notifications',
    icon: NotificationsIcon,
    url: '/mpdc/notifications',
  },
  {
    name: 'Receiving List',
    url: '/mpdc/permit/receiving',
  },
  {
    name: 'Going Assessment',
    url: '/mpdc/permit/assessment',
  },
  {
    name: 'Rejected Permits',
    url: '/mpdc/permit/rejects',
  },
  {
    name: 'Completed',
    url: '/mpdc/permit/complete',
  },
  {
    name: 'Account',
    url: '/mpdc/settings/account',
  },
]

const facultySidebarNavList: any[] = [
  // {
  //   name: 'Dashboard',
  //   icon: DashboardIcon,
  //   url: '/mpdc',
  // },
  {
    name: 'Notifications',
    icon: NotificationsIcon,
    url: '/mpdc/notifications',
  },
  {
    name: 'Receiving List',
    url: '/mpdc/permit/receiving',
  },
  {
    name: 'Going Assessment',
    url: '/mpdc/permit/assessment',
  },
  {
    name: 'Rejected Permits',
    url: '/mpdc/permit/rejects',
  },
  {
    name: 'Completed',
    url: '/mpdc/permit/complete',
  },
  {
    name: 'Account',
    url: '/mpdc/settings/account',
  },
]

export function getSidebarNavigations(role: Roles) {
  return role === Roles.SuperAdmin
  ? superAdminSidebarNavList
  : role === Roles.Admin
  ? adminSidebarNavList
  : role === Roles.Faculty
  ? facultySidebarNavList
  : []
}