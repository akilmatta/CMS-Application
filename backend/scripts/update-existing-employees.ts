import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateExistingEmployees() {
  try {
    console.log('Starting to update existing employees...')

    // Get all employees that don't have email, role, or firebaseUid
    const employees = await prisma.employee.findMany({
      where: {
        OR: [
          { email: null },
          { role: null },
          { firebaseUid: null }
        ]
      }
    })

    console.log(`Found ${employees.length} employees to update`)

    for (const employee of employees) {
      const updates: any = {}

      // Generate email if missing
      if (!employee.email) {
        updates.email = `${employee.name.toLowerCase().replace(/\s+/g, '.')}@company.com`
      }

      // Set default role if missing
      if (!employee.role) {
        updates.role = 'FOREMAN'
      }

      // Generate firebaseUid if missing
      if (!employee.firebaseUid) {
        updates.firebaseUid = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }

      if (Object.keys(updates).length > 0) {
        await prisma.employee.update({
          where: { id: employee.id },
          data: updates
        })
        console.log(`Updated employee: ${employee.name}`)
      }
    }

    console.log('Successfully updated all existing employees!')
  } catch (error) {
    console.error('Error updating employees:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
updateExistingEmployees() 