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
    name: 'Account',
    url: '/superadmin/account',
  },
]

const adminSidebarNavList: any[] = [
  {
    name: 'Dashboard',
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
    name: 'Memorandom List',
    url: '/admin/memo',
  },
  {
    name: 'Letter List',
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
    name: 'Notifications',
    url: '/admin/notifications',
  },
  {
    name: 'Account',
    url: '/admin/account',
  },
]

const facultySidebarNavList: any[] = [
  {
    name: 'Recent',
    url: '/faculty',
  },
  {
    name: 'Memorandoms',
    url: '/faculty/memos',
  },
  {
    name: 'Letters',
    url: '/faculty/letters',
  },
  {
    name: 'Notifications',
    url: '/faculty/notifications',
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