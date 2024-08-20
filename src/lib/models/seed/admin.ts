import connectDB from '@/lib/database'
import 'server-only'
import User from '../User'
import { UserRoles } from '../interfaces'

export default async function seedAdmin() {
  try {
    await connectDB()
    const admin = {
      email: 'admin@gmail.com',
      password: 'password',
      role: UserRoles.Admin,
      position: 'Administrator',
      emailVerified: {
        status: 'approved',
      },
      contactNo: '+639999999999',
      contactVerified: {
        status: 'approved',
      },
      firstName: 'Sandie Erden',
      middleName: 'Del Rosario',
      lastName: 'Galo',
      address: {
        street: 'Ipil-ipil',
        barangay: 'Talisay',
        cityMunicipality: 'Nasipit',
        province: 'Agusan del Norte',
        zipCode: '8602',
      },
      tin: '123456789',
      ctc: {
        no: '123456789',
        dateIssued: '2022-10-20',
        placeIssued: 'Butuan City',
      }
    }
    const result = await User.create(admin);
    console.log("created admin: ", result.email);
  } catch (e) {
    const acc = await User.findOne({ role: UserRoles.Admin }).exec();
    console.log("Registered Admin account: ")
    console.log("Emai: ", acc.email)
    console.log("Phone: ", acc.contactNo)
  }
}