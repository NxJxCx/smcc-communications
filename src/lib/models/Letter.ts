import { Roles, type LetterDocument } from "@/lib/modelInterfaces";
import { Schema, model, models, type Document } from 'mongoose';
import 'server-only';
import Department from './Department';
import User from './User';

const LetterSchema = new Schema({
  departmentId: {
    type: Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department ID is required'],
  },
  title: {
    type: String,
    required: [true, 'Letter Title is required'],
  },
  content: {
    type: String,
    required: [true, 'Memo Content is required'],
  },
  preparedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    validate: {
      validator: async function (val: any) {
        const user = await User.findById(val);
        if (!!user && user.role === Roles.Admin) {
          const department = await Department.findOne({
            letterTemplates: (this as any).templateId,
            isDissolved: false,
          });
          return !!department;
        }
        return false
      },
      message: 'Prepared by should be prepared by Admin account only and is within their department.'
    },
    required: [true, 'Prepared By is required'],
  },
  signature_approvals: {
    type: [{
      signature_id: {
        type: Schema.Types.ObjectId,
        ref: 'ESignature',
        required: [true, 'E-Signature ID is required'],
      },
      approvedDate: {
        type: Date,
        default: null
      },
      rejectedData: {
        type: Date,
        default: null
      }
    }],
  }
},
  {
    timestamps: true
  })

export default models?.Letter || model<LetterDocument & Document>('Letter', LetterSchema)