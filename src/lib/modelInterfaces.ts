export interface Documents {
  _id?: string
  createdAt?: Date|string|null
  updatedAt?: Date|string|null
}

export interface PhotoFileDocument extends Documents {
  file: Buffer|string
  mimeType: string
  size: number
}

export interface DocFileDocument extends Documents {
  file: Buffer|string
  mimeType: string
  size: number
}

export interface NotificationDocument extends Documents {
  title: string
  message: string
  href: string
  read?: boolean
  date?: Date|string|null
}

export enum Roles {
  SuperAdmin = 'superadmin',
  Admin = 'admin',
  Faculty = 'faculty',
}

export interface UserDocument extends Documents {
  employeeId: string
  password: string
  role: Roles
  email: string
  prefixName?: string
  suffixName?: string
  firstName: string
  middleName?: string
  lastName: string
  departmentIds: DepartmentDocument[]|string[]
  readMemos: MemoDocument[]|string[]
  readLetters: LetterDocument[]|string[]
  photo: PhotoFileDocument|string|null
  deactivated: boolean
  notification: NotificationDocument[]
}

export interface DepartmentDocument extends Documents {
  name: string
  memoTemplates: TemplateDocument[]|string[]
  letterTemplates: TemplateDocument[]|string[]
  isDissolved: boolean
}

export enum DocumentType {
  Memo = 'memo',
  Letter = 'letter',
}

export interface TemplateDocument extends Documents {
  title: string
  documentType: DocumentType
  content: string
  validity: Date|string
  createdBy: UserDocument|string
}

export interface ESignatureDocument extends Documents {
  adminId: UserDocument|string
  signature: string
}

export interface SignatureApprovals {
  signature_id: ESignatureDocument|string
  approvedDate: Date|null
}

export interface MemoDocument extends Documents {
  content: string
  preparedBy: UserDocument|string
  signatureApprovals: SignatureApprovals[]
}

export interface LetterDocument extends Documents {
  content: string
  preparedBy: UserDocument|string
  signatureApprovals: SignatureApprovals[]
}
