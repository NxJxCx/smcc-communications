import connectDB from "./lib/database";
import seedAdmin from "./lib/models/seed/admin";

export async function register() {
  await connectDB()
  await seedAdmin()
}