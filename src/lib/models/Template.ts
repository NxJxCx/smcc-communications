import { Schema, model, models, type Document } from 'mongoose';
import 'server-only';
import { type TemplateDocument } from '../modelInterfaces';

const TemplateSchema = new Schema({
  documentType: {
    type: String,
    enum: DocumentType,
    required: [true, 'Document Type is required'],
  },
  header: {
    type: Schema.Types.ObjectId,
    ref: 'Header'
  },
  content: {
    type: String,
    required: [true, 'Template Content is required'],
  },
  signatures: {
    type: [{
      type: Schema.Types.ObjectId,
      ref: 'ESignature'
    }],
    default: [],
  },
  validity: {
    type: Date,
    required: [true, 'Validity is required'],
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  }
},
{
  timestamps: true
})

export default models?.Template || model<TemplateDocument & Document>('Template', TemplateSchema)