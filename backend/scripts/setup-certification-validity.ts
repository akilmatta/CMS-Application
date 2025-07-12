import { execSync } from 'child_process'
import { PrismaClient } from '@prisma/client'

async function setupCertificationValidity() {
  console.log('🔄 Setting up certification validity fields...')

  try {
    // Generate Prisma client with new schema
    console.log('📦 Generating Prisma client...')
    execSync('npx prisma generate', { stdio: 'inherit' })

    // Run database migration
    console.log('🗄️ Running database migration...')
    execSync('npx prisma migrate dev --name add-certification-validity', { stdio: 'inherit' })

    // Test the connection
    console.log('🔍 Testing database connection...')
    const prisma = new PrismaClient()
    await prisma.$connect()
    console.log('✅ Database connection successful')

    // Check if the new fields exist
    const sampleCertification = await prisma.certification.findFirst()
    if (sampleCertification) {
      console.log('📋 Sample certification data structure:')
      console.log(JSON.stringify(sampleCertification, null, 2))
    }

    await prisma.$disconnect()
    console.log('✅ Setup completed successfully!')
    console.log('\n📝 Next steps:')
    console.log('1. Update your import statement in updateCertificationValidity.ts to:')
    console.log('   import { PrismaClient, ValidityType } from \'@prisma/client\'')
    console.log('2. Remove the local ValidityType enum definition')
    console.log('3. Run the update script: npm run update-certifications')

  } catch (error) {
    console.error('❌ Setup failed:', error)
    process.exit(1)
  }
}

// Run the setup
setupCertificationValidity()
  .then(() => {
    console.log('✅ Setup script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Setup script failed:', error)
    process.exit(1)
  }) 