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
    name: 'My E-Signature',
    url: '/admin/esignature',
  },
  {
    name: 'Create',
    url: '/admin/create',
  },
  {
    name: 'Approvals',
    url: '/admin/approvals',
  },
  {
    name: 'Released',
    url: '/admin/approved',
  },
  {
    name: 'Received',
    url: '/admin/received',
  },
  {
    name: 'Forwarded',
    url: '/admin/forwarded',
  },
  {
    name: 'Archive',
    url: '/admin/archive',
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