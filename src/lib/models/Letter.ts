import { Schema, model, models, type Document } from 'mongoose'
import 'server-only'
import User from './User'
import { Roles, type LetterDocument } from './interfaces';
import Department from './Department';

const LetterSchema = new Schema({
  templateId: {
    type: Schema.Types.ObjectId,
    ref: 'Template'
  },
  preparedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    validate: {
      validator: async function(val: any) {
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
    }],
  }
},
{
  timestamps: true
})

export default models?.Letter || model<LetterDocument & Document>('Letter', LetterSchema)