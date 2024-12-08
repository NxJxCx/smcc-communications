import { Roles, type LetterIndividualDocument } from "@/lib/modelInterfaces";
import { Schema, model, models, type Document } from 'mongoose';
import 'server-only';
import User from './User';

const LetterIndividualSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  title: {
    type: String,
    required: [true, 'Memorandum Title is required'],
  },
  content: {
    type: String,
    required: [true, 'Memorandum Content is required'],
  },
  preparedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    validate: {
      validator: async function (val: any) {
        const user = await User.findById(val);
        return !!user && user.role === Roles.Admin;
      },
      message: 'Prepared by should be prepared by Admin account only.'
    },
    required: [true, 'Prepared By is required'],
  },
  isRevoked: {
    type: Boolean,
    default: false,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  cc: {
    type: [Schema.Types.ObjectId],
    ref: 'User',
  },
},
  {
    timestamps: true
  })

export default models?.LetterIndividual || model<LetterIndividualDocument & Document>('LetterIndividual', LetterIndividualSchema)