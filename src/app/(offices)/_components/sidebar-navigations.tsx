import { Roles } from "@/lib/modelInterfaces";

export interface SidebarNavigation {
  name: string;
  url?: string;
}

const superAdminSidebarNavList: SidebarNavigation[] = [
  {
    name: 'Dashboard',
    url: '/superadmin',
  },
  {
    name: 'Departments',
    url: '/superadmin/departments',
  },
  {
    name: 'Admin Accounts',
    url: '/superadmin/admin',
  },
  {
    name: 'Faculty Accounts',
    url: '/superadmin/faculty',
  },
  {
    name: 'E-Signature Registration',
    url: '/superadmin/admin/esignature',
  },
  {
    name: 'Memo Templates',
    url: '/superadmin/memo',
  },
  {
    name: 'Letter Templates',
    url: '/superadmin/letter',
  },
  {
    name: 'Individual Templates',
    url: '/superadmin/individual',
  },
  {
    name: 'Account',
    url: '/superadmin/account',
  },
]

const adminSidebarNavList: any[] = [
  {
    name: 'Notifications',
    url: '/admin',
  },
  {
    name: 'Create Memo',
    url: '/admin/memo/create',
  },
  {
    name: 'Create Letter',
    url: '/admin/letter/create',
  },
  {
    name: 'Memorandom Inbox',
    url: '/admin/memo',
  },
  {
    name: 'Letter Inbox',
    url: '/admin/letter',
  },
  {
    name: 'Approved Memorandoms',
    url: '/admin/memo/approved',
  },
  {
    name: 'Approved Letters',
    url: '/admin/letter/approved',
  },
  {
    name: 'Received Memorandums',
    url: '/admin/memo/receive',
  },
  {
    name: 'Received Letters',
    url: '/admin/letter/receive',
  },
  {
    name: 'Account',
    url: '/admin/account',
  },
]

const facultySidebarNavList: any[] = [
  {
    name: 'Notifications',
    url: '/faculty',
  },
  {
    name: 'Memorandoms',
    url: '/faculty/memo',
  },
  {
    name: 'Letters',
    url: '/faculty/letter',
  },
  {
    name: 'Account',
    url: '/faculty/account',
  },
]

export function getSidebarNavigations(role?: Roles) {
  return role === Roles.SuperAdmin
  ? superAdminSidebarNavList
  : role === Roles.Admin
  ? adminSidebarNavList
  : role === Roles.Faculty
  ? facultySidebarNavList
  : []
}