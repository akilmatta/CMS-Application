import { CertificationValidityUpdater } from '../src/utils/updateCertificationValidity'

async function runExamples() {
  const updater = new CertificationValidityUpdater()

  try {
    console.log('🚀 Starting certification validity update examples...\n')

    // Example 1: Get current statistics
    console.log('📊 Current Certification Statistics:')
    const stats = await updater.getCertificationStats()
    console.log(JSON.stringify(stats, null, 2))
    console.log('')

    // Example 2: Set all "Safety Training" certifications to lifetime
    console.log('🔒 Setting all "Safety Training" certifications to LIFETIME...')
    const safetyCount = await updater.updateCertificationsByName(
      'Safety Training',
      'LIFETIME' as any
    )
    console.log(`✅ Updated ${safetyCount} Safety Training certifications\n`)

    // Example 3: Set all "First Aid" certifications to 2 years validity
    console.log('⏰ Setting all "First Aid" certifications to 2 years validity...')
    const firstAidCount = await updater.setFixedYearsValidity(2)
    console.log(`✅ Updated ${firstAidCount} First Aid certifications\n`)

    // Example 4: Set specific certifications to custom date
    console.log('📅 Setting specific certifications to custom expiry date...')
    const customDate = new Date('2025-06-30')
    const customCount = await updater.setCustomDateValidity(customDate)
    console.log(`✅ Updated ${customCount} certifications to expire on ${customDate.toDateString()}\n`)

    // Example 5: Update certifications for a specific employee
    console.log('👤 Updating certifications for a specific employee...')
    // Note: Replace 'employee-id-here' with an actual employee ID from your database
    const employeeId = 'employee-id-here' // Replace with actual ID
    const employeeCount = await updater.updateEmployeeCertifications(
      employeeId,
      'FIXED_YEARS' as any,
      3
    )
    console.log(`✅ Updated ${employeeCount} certifications for employee ${employeeId}\n`)

    // Example 6: Bulk update by certification name with custom date
    console.log('📋 Bulk updating "CPR Certification" to custom date...')
    const cprCount = await updater.updateCertificationsByName(
      'CPR Certification',
      'CUSTOM_DATE' as any,
      undefined,
      new Date('2024-12-31')
    )
    console.log(`✅ Updated ${cprCount} CPR certifications\n`)

    // Example 7: Update specific certification IDs
    console.log('🎯 Updating specific certification IDs...')
    const specificIds = ['cert-id-1', 'cert-id-2'] // Replace with actual IDs
    const specificCount = await updater.setLifetimeValidity(specificIds)
    console.log(`✅ Updated ${specificCount} specific certifications\n`)

    // Example 8: Final statistics
    console.log('📊 Final Certification Statistics:')
    const finalStats = await updater.getCertificationStats()
    console.log(JSON.stringify(finalStats, null, 2))

    console.log('\n✅ All examples completed successfully!')

  } catch (error) {
    console.error('❌ Error running examples:', error)
  } finally {
    await updater.disconnect()
  }
}

// Example of how to use the script with command line arguments
async function runWithArgs() {
  const args = process.argv.slice(2)
  
  if (args.length === 0) {
    console.log('Usage: npm run update-certifications [command] [options]')
    console.log('Commands:')
    console.log('  lifetime [certification-name]     - Set certifications to lifetime')
    console.log('  fixed-years [years] [cert-name]   - Set certifications to fixed years')
    console.log('  custom-date [date] [cert-name]    - Set certifications to custom date')
    console.log('  employee [employee-id] [type]     - Update employee certifications')
    console.log('  stats                              - Show statistics')
    console.log('  examples                           - Run all examples')
    return
  }

  const updater = new CertificationValidityUpdater()

  try {
    const command = args[0]

    switch (command) {
      case 'lifetime':
        const certName = args[1] || 'Safety Training'
        console.log(`🔒 Setting all "${certName}" certifications to LIFETIME...`)
        const count = await updater.updateCertificationsByName(certName, 'LIFETIME' as any)
        console.log(`✅ Updated ${count} certifications`)
        break

      case 'fixed-years':
        const years = parseInt(args[1]) || 2
        const certNameForYears = args[2] || 'First Aid'
        console.log(`⏰ Setting all "${certNameForYears}" certifications to ${years} years...`)
        const yearsCount = await updater.setFixedYearsValidity(years)
        console.log(`✅ Updated ${yearsCount} certifications`)
        break

      case 'custom-date':
        const dateStr = args[1] || '2025-12-31'
        const certNameForDate = args[2] || 'CPR Certification'
        const customDate = new Date(dateStr)
        console.log(`📅 Setting all "${certNameForDate}" certifications to expire on ${customDate.toDateString()}...`)
        const dateCount = await updater.setCustomDateValidity(customDate)
        console.log(`✅ Updated ${dateCount} certifications`)
        break

      case 'employee':
        const employeeId = args[1]
        const validityType = args[2] || 'FIXED_YEARS'
        const validYears = parseInt(args[3]) || 3
        if (!employeeId) {
          console.error('❌ Employee ID is required')
          return
        }
        console.log(`👤 Updating certifications for employee ${employeeId}...`)
        const empCount = await updater.updateEmployeeCertifications(
          employeeId,
          validityType as any,
          validYears
        )
        console.log(`✅ Updated ${empCount} certifications`)
        break

      case 'stats':
        console.log('📊 Certification Statistics:')
        const stats = await updater.getCertificationStats()
        console.log(JSON.stringify(stats, null, 2))
        break

      case 'examples':
        await runExamples()
        break

      default:
        console.error(`❌ Unknown command: ${command}`)
        break
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await updater.disconnect()
  }
}

// Run the appropriate function based on command line arguments
if (require.main === module) {
  if (process.argv.length > 2) {
    runWithArgs()
  } else {
    runExamples()
  }
} 