'use server';
import connectDB from "@/lib/database";
import Assignation from "@/lib/models/Assignation";
import { UserRoles } from "@/lib/models/interfaces";
import { getSession } from "@/lib/session";
import { AssignFormSchema, ResponseFormState } from "@/lib/types";

export async function assignPermit(_: ResponseFormState, formData: FormData) {
  const validatedFields = AssignFormSchema.safeParse({
    recommendingApproval: formData.get('recommendingApproval'),
    permitIssuedBy: formData.get('permitIssuedBy'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Error'
    }
  }

  await connectDB();
  const data = {
    $set: {
      recommendingApproval: validatedFields.data.recommendingApproval,
      permitIssuedBy: validatedFields.data.permitIssuedBy,
    }
  }
  try {
    const session = await getSession(UserRoles.Admin);
    if (!session) {
      return {
        errors: {
          session: ['Invalid Session']
        },
        message: 'Error'
      }
    }
    const updated = await Assignation.updateOne({}, data, { upsert: true, new: true, runValidators: true });
    const success = updated.acknowledged && updated.modifiedCount > 0;
    return { success, message: success ? 'Successfully Saved' : 'Failed to Save' }
  } catch (error: any) {
    return {
      message: 'Error',
      errors: {
        email: [error.message]
      }
    }
  }
}