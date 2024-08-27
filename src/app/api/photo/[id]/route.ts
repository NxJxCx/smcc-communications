'use server'

import connectDB from "@/lib/database";
import PhotoFile from "@/lib/models/PhotoFile";
import { NextRequest, NextResponse } from "next/server";

type ParamProps = { params: { id: string } }

export async function GET(request: NextRequest, { params: { id } }: ParamProps) {
  await connectDB()
  try {
    const photo = await PhotoFile.findById(id)
    return NextResponse.json({ result: photo })
  } catch (e) {
    console.log(e)
  }
  return NextResponse.json({ result: null })
}