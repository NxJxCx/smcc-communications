import { Schema, model, models, type Document } from 'mongoose'
import 'server-only'
import { Roles, type ESignatureDocument } from './interfaces';
import User from './User';


const ESignatureSchema = new Schema({
  adminId: {
    type: Schema.Types.ObjectId,
    required: [true, 'Admin ID is required'],
    validate: {
      validator: async function(val: any) {
        const user = await User.findById(val);
        if (!!user && user.role === Roles.Admin) {
          return true;
        }
        return false;
      },
      message: 'Prepared by should be prepared by Admin account only and is within their department.'
    }
  },
  signature: {
    type: Buffer,
    required: [true, 'Signature is required']
  }
},
{
  timestamps: true
})

export default models?.ESignature || model<ESignatureDocument & Document>('ESignature', ESignatureSchema)