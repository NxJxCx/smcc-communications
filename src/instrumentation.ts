import connectDB from "./lib/database";

export async function register() {
  await connectDB()
}