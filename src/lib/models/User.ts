import { Schema, model, models, type Document } from 'mongoose'
import 'server-only'
import { hashPassword } from '../hash'
import { Roles, type UserDocument } from './interfaces'

const UserSchema = new Schema({
  employeeId: {
    type: String,
    unique: [true, 'Employee ID is already registered'],
    required: [true, 'Employee ID is required'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
  },
  role: {
    type: String,
    enum: Roles,
    required: [true, 'Role is required'],
  },
  email: {
    type: String,
    required: [true, 'Email address is required'],
    validate: {
      validator: function(val: any) {
        if (val && val.includes('@') && val.includes('.') && !val.startsWith('@') && !val.endsWith('@') && !val.endsWith('.')) {
          return true
        }
        return false
      },
      message: 'Not a valid Email Address'
    }
  },
  prefixName: {
    type: String,
    default: '',
  },
  suffixName: {
    type: String,
    default: '',
  },
  firstName: {
    type: String,
    required: [true, 'First Name is required'],
  },
  middleName: {
    type: String,
    default: ''
  },
  lastName: {
    type: String,
    required: [true, 'Last Name is required'],
  },
  departmentIds: {
    type: [{
      type: Schema.Types.ObjectId,
      ref: 'Department',
    }],
  },
  readMemos: {
    type: [{
      type: Schema.Types.ObjectId,
      ref: 'Memos',
    }],
    default: []
  },
  readLetters: {
    type: [{
      type: Schema.Types.ObjectId,
      ref: 'Letters',
    }],
    default: []
  },
  deactivated: {
    type: Boolean,
    default: false
  },
  notification: {
    type: [
      {
        title: String,
        message: String,
        href: String,
        read: {
          type: Boolean,
          default: false
        },
        date: {
          type: Date,
          default: new Date(),
        }
      }
    ],
    default: []
  },
},
{
  timestamps: true
})

UserSchema.pre('save', function (next: any) {
  const user = this;
  if (this.isModified('password') || this.isNew) {
    hashPassword(user.password, (hashErr, hash) => {
      if (hashErr) {
        return next(hashErr)
      }
      user.password = hash
      next()
    })
  } else {
    return next()
  }
})

export default models?.User || model<UserDocument & Document>('User', UserSchema)