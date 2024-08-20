import 'server-only'
import { Schema, models, model, type Document } from 'mongoose'
import { type DocFileDocument } from './interfaces'

const DocFileSchema = new Schema({
  file: {
    type: Buffer,
    required: [true, 'File Buffer is required'],
  },
  mimeType: {
    type: String,
    required: [true, 'Mime Type is required'],
  },
  size: {
    type: Number,
    required: [true, 'Size is required'],
  }
},
{
  timestamps: true
})

export default models?.DocFile || model<DocFileDocument & Document>('DocFile', DocFileSchema)