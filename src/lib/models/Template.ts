import { Schema, model, models, type Document } from 'mongoose';
import 'server-only';
import { DocumentType, type TemplateDocument } from '../modelInterfaces';

const TemplateSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Template Title is required'],
  },
  documentType: {
    type: String,
    enum: DocumentType,
    required: [true, 'Document Type is required'],
  },
  content: {
    type: String,
    required: [true, 'Template Content is required'],
  },
  validity: {
    type: Date,
    required: [true, 'Validity is required'],
  }
},
{
  timestamps: true
})

export default models?.Template || model<TemplateDocument & Document>('Template', TemplateSchema)