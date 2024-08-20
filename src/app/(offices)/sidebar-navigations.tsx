import { UserRoles } from "@/lib/models/interfaces";
import {
  DocumentOpenIcon,
  type IconComponent,
  NotificationsIcon,
  PeopleIcon,
  PersonIcon,
  TagIcon,
} from "evergreen-ui";

export interface SidebarNavigation {
  name: string;
  icon?: JSX.Element|IconComponent;
  url?: string;
  children?: SidebarNavigation[];
}

const adminSidebarNavList: SidebarNavigation[] = [
  // {
  //   name: 'Dashboard',
  //   icon: DashboardIcon,
  //   url: '/admin',
  // },
  {
    name: 'Notifications',
    icon: NotificationsIcon,
    url: '/admin/notifications',
  },
  {
    name: 'Account Management',
    icon: PeopleIcon,
    children: [
      {
        name: 'User Accounts',
        url: '/admin/accounts/users',
      },
      {
        name: 'OBO Accounts',
        url: '/admin/accounts/obo',
      },
      {
        name: 'BFP Accounts',
        url: '/admin/accounts/bfp',
      },
      {
        name: 'MPDC Accounts',
        url: '/admin/accounts/mpdc',
      },
      {
        name: 'Accounting Accounts',
        url: '/admin/accounts/accounting',
      },
    ]
  },
  {
      name: 'Assign to permits',
      icon: TagIcon,
      url: '/admin/assign',
  },
  {
    name: 'My Account',
    icon: PersonIcon,
    children: [
      {
        name: 'Profile Settings',
        url: '/admin/settings/profile',
      },
      {
        name: 'Account Settings',
        url: '/admin/settings/account',
      },
      {
        name: 'Change Password',
        url: '/admin/settings/change',
      },
    ]
  }
]

const oboSidebarNavList: any[] = [
  // {
  //   name: 'Dashboard',
  //   icon: DashboardIcon,
  //   url: '/obo',
  // },
  {
    name: 'Notifications',
    icon: NotificationsIcon,
    url: '/obo/notifications',
  },
  {
    name: 'Permit Management',
    icon: DocumentOpenIcon,
    children: [
      {
        name: 'Application List',
        url: '/obo/permit/applications',
      },
      {
        name: 'Queued Applications',
        url: '/obo/permit/queue',
      },
      {
        name: 'Going Assessment',
        url: '/obo/permit/assessment',
      },
      {
        name: 'Rejected Assessment',
        url: '/obo/permit/rejects',
      },
      {
        name: 'Forward to MPDC',
        url: '/obo/permit/mpdc/forward',
      },
      {
        name: 'MPDC Assessment',
        url: '/obo/permit/mpdc/pending',
      },
      {
        name: 'MPDC Rejects',
        url: '/obo/permit/mpdc/rejects',
      },
      {
        name: 'Assessment Payment',
        url: '/obo/permit/payment',
      },
      {
        name: 'Assessment Paid',
        url: '/obo/permit/paid',
      },
      {
        name: 'Forward to BFP',
        url: '/obo/permit/bfp/forward',
      },
      {
        name: 'BFP Assessment',
        url: '/obo/permit/bfp/pending',
      },
      {
        name: 'BFP Rejects',
        url: '/obo/permit/bfp/rejects',
      },
      {
        name: 'BFP  Completed',
        url: '/obo/permit/bfp',
      },
      {
        name: "Mayor's Permit",
        url: '/obo/permit/mayors',
      },
      {
        name: 'Claimable Permit',
        url: '/obo/permit/claimable',
      },
      {
        name: 'Completed Permit',
        url: '/obo/permit/completed',
      },
      {
        name: 'Declined Applications',
        url: '/obo/permit/declined',
      },
    ]
  },
  {
    name: 'My Account',
    icon: PersonIcon,
    children: [
      {
        name: 'Profile Settings',
        url: '/obo/settings/profile',
      },
      {
        name: 'Account Settings',
        url: '/obo/settings/account',
      },
      {
        name: 'Change Password',
        url: '/obo/settings/change',
      },
    ]
  }
]

const mpdcSidebarNavList: any[] = [
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
    name: 'Permit Management',
    icon: DocumentOpenIcon,
    children: [
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
    ]
  },
  {
    name: 'My Account',
    icon: PersonIcon,
    children: [
      {
        name: 'Profile Settings',
        url: '/mpdc/settings/profile',
      },
      {
        name: 'Account Settings',
        url: '/mpdc/settings/account',
      },
      {
        name: 'Change Password',
        url: '/mpdc/settings/change',
      },
    ]
  }
]

const bfpSidebarNavList: any[] = [
  // {
  //   name: 'Dashboard',
  //   icon: DashboardIcon,
  //   url: '/bfp',
  // },
  {
    name: 'Notifications',
    icon: NotificationsIcon,
    url: '/bfp/notifications',
  },
  {
    name: 'Permit Management',
    icon: DocumentOpenIcon,
    children: [
      {
        name: 'Receiving List',
        url: '/bfp/permit/receiving',
      },
      {
        name: 'Going Assessment',
        url: '/bfp/permit/assessment',
      },
      {
        name: 'Assessment Payment',
        url: '/bfp/permit/payment',
      },
      {
        name: 'Rejected Permits',
        url: '/bfp/permit/rejects',
      },
      {
        name: 'Completed',
        url: '/bfp/permit/complete',
      },
    ]
  },
  {
    name: 'My Account',
    icon: PersonIcon,
    children: [
      {
        name: 'Profile Settings',
        url: '/bfp/settings/profile',
      },
      {
        name: 'Account Settings',
        url: '/bfp/settings/account',
      },
      {
        name: 'Change Password',
        url: '/bfp/settings/change',
      },
    ]
  }
]


const accountingSidebarNavList: any[] = [
  // {
  //   name: 'Dashboard',
  //   icon: DashboardIcon,
  //   url: '/accounting',
  // },
  {
    name: 'Notifications',
    icon: NotificationsIcon,
    url: '/accounting/notifications',
  },
  {
    name: 'Permit Management',
    icon: DocumentOpenIcon,
    children: [
      {
        name: 'Assessment Payment',
        url: '/accounting/permit/payment',
      },
      {
        name: 'Assessment Paid',
        url: '/accounting/permit/paid',
      },
    ]
  },
  {
    name: 'My Account',
    icon: PersonIcon,
    children: [
      {
        name: 'Profile Settings',
        url: '/mpdc/settings/profile',
      },
      {
        name: 'Account Settings',
        url: '/mpdc/settings/account',
      },
      {
        name: 'Change Password',
        url: '/mpdc/settings/change',
      },
    ]
  }
]

export function getSidebarNavigations(role: UserRoles) {
  return role === UserRoles.Admin
  ? adminSidebarNavList
  : role === UserRoles.OBO
  ? oboSidebarNavList
  : role === UserRoles.BFP
  ? bfpSidebarNavList
  : role === UserRoles.MPDC
  ? mpdcSidebarNavList
  : role === UserRoles.Accounting
  ? accountingSidebarNavList
  : []
}