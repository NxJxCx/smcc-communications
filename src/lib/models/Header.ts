import { Schema, model, models, type Document } from 'mongoose';
import 'server-only';
import { type HeaderDocument } from '../modelInterfaces';

const HeaderSchema = new Schema({
  file: {
    type: Buffer,
    required: [true, 'File Buffer is required']
  },
  mimeType: {
    type: String,
    required: [true, 'Mime Type is required']
  },
  size: {
    type: Number,
    required: [true, 'Size is required']
  },
  departmentId: {
    type: Schema.Types.ObjectId,
    required: [true, 'Department ID is required']
  }
},
{
  timestamps: true
})

export default models?.Header || model<HeaderDocument & Document>('Header', HeaderSchema)