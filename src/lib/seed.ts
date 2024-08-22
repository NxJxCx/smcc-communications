import 'server-only';
import User from './models/User';
import { Roles } from './models/interfaces';
export async function seed() {
  try {
    const sadmin = await User.findOne({
      role: Roles.SuperAdmin,
    })
    if (!sadmin) {
      await User.create({
        employeeId: 1,
        password: 'password',
        role: Roles.SuperAdmin,
        email: 'superadmin@gmail.com',
        firstName: 'Super',
        lastName: 'Admin',
      })
    }
  } catch (e) {}
  try {
    const admin = await User.findOne({
      role: Roles.Admin,
    })
    if (!admin) {
      await User.create({
        employeeId: 2,
        password: 'password',
        role: Roles.Admin,
        email: 'admin@gmail.com',
        firstName: 'Admin',
        lastName: 'User',
      })
    }
  } catch (e) {}
  try {
    const faculty = await User.findOne({
      role: Roles.Faculty,
    })
    if (!faculty) {
      await User.create({
        employeeId: 3,
        password: 'password',
        role: Roles.Faculty,
        email: 'faculty@gmail.com',
        firstName: 'Faculty',
        lastName: 'Admin',
      })
    }
  } catch (e) {}
}