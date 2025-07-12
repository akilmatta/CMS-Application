import { PrismaClient } from '@prisma/client'

// Define ValidityType enum locally until Prisma client is regenerated
enum ValidityType {
  LIFETIME = 'LIFETIME',
  FIXED_YEARS = 'FIXED_YEARS',
  CUSTOM_DATE = 'CUSTOM_DATE'
}

const prisma = new PrismaClient()

interface CertificationUpdateData {
  id: string
  validityType: ValidityType
  validYears?: number
  expiryDate?: Date
}

interface BulkUpdateOptions {
  certificationName?: string
  employeeId?: string
  validityType: ValidityType
  validYears?: number
  expiryDate?: Date
}

class CertificationValidityUpdater {
  /**
   * Update a single certification's validity information
   */
  async updateSingleCertification(data: CertificationUpdateData): Promise<void> {
    try {
      const updateData: any = {
        validityType: data.validityType,
        updatedAt: new Date()
      }

      // Add optional fields if provided
      if (data.validYears !== undefined) {
        updateData.validYears = data.validYears
      }

      if (data.expiryDate !== undefined) {
        updateData.expiryDate = data.expiryDate
      }

      // Handle LIFETIME validity type
      if (data.validityType === ValidityType.LIFETIME) {
        updateData.expiryDate = new Date('2099-12-31') // Set to far future date
        updateData.validYears = null
      }

      // Handle FIXED_YEARS validity type
      if (data.validityType === ValidityType.FIXED_YEARS && data.validYears) {
        const currentDate = new Date()
        const newExpiryDate = new Date(currentDate)
        newExpiryDate.setFullYear(currentDate.getFullYear() + data.validYears)
        updateData.expiryDate = newExpiryDate
      }

      await prisma.certification.update({
        where: { id: data.id },
        data: updateData
      })

      console.log(`✅ Updated certification ${data.id} with validity type: ${data.validityType}`)
    } catch (error) {
      console.error(`❌ Error updating certification ${data.id}:`, error)
      throw error
    }
  }

  /**
   * Bulk update certifications based on criteria
   */
  async bulkUpdateCertifications(options: BulkUpdateOptions): Promise<number> {
    try {
      const whereClause: any = {}

      if (options.certificationName) {
        whereClause.name = options.certificationName
      }

      if (options.employeeId) {
        whereClause.employeeId = options.employeeId
      }

      const updateData: any = {
        validityType: options.validityType,
        updatedAt: new Date()
      }

      // Add optional fields if provided
      if (options.validYears !== undefined) {
        updateData.validYears = options.validYears
      }

      if (options.expiryDate !== undefined) {
        updateData.expiryDate = options.expiryDate
      }

      // Handle LIFETIME validity type
      if (options.validityType === ValidityType.LIFETIME) {
        updateData.expiryDate = new Date('2099-12-31')
        updateData.validYears = null
      }

      // Handle FIXED_YEARS validity type
      if (options.validityType === ValidityType.FIXED_YEARS && options.validYears) {
        const currentDate = new Date()
        const newExpiryDate = new Date(currentDate)
        newExpiryDate.setFullYear(currentDate.getFullYear() + options.validYears)
        updateData.expiryDate = newExpiryDate
      }

      const result = await prisma.certification.updateMany({
        where: whereClause,
        data: updateData
      })

      console.log(`✅ Bulk updated ${result.count} certifications with validity type: ${options.validityType}`)
      return result.count
    } catch (error) {
      console.error('❌ Error in bulk update:', error)
      throw error
    }
  }

  /**
   * Update certifications for a specific employee
   */
  async updateEmployeeCertifications(
    employeeId: string,
    validityType: ValidityType,
    validYears?: number,
    expiryDate?: Date
  ): Promise<number> {
    return this.bulkUpdateCertifications({
      employeeId,
      validityType,
      validYears,
      expiryDate
    })
  }

  /**
   * Update all certifications with a specific name
   */
  async updateCertificationsByName(
    certificationName: string,
    validityType: ValidityType,
    validYears?: number,
    expiryDate?: Date
  ): Promise<number> {
    return this.bulkUpdateCertifications({
      certificationName,
      validityType,
      validYears,
      expiryDate
    })
  }

  /**
   * Set certifications to lifetime validity
   */
  async setLifetimeValidity(certificationIds?: string[]): Promise<number> {
    if (certificationIds && certificationIds.length > 0) {
      let count = 0
      for (const id of certificationIds) {
        await this.updateSingleCertification({
          id,
          validityType: ValidityType.LIFETIME
        })
        count++
      }
      return count
    } else {
      return this.bulkUpdateCertifications({
        validityType: ValidityType.LIFETIME
      })
    }
  }

  /**
   * Set certifications to fixed years validity
   */
  async setFixedYearsValidity(years: number, certificationIds?: string[]): Promise<number> {
    if (certificationIds && certificationIds.length > 0) {
      let count = 0
      for (const id of certificationIds) {
        await this.updateSingleCertification({
          id,
          validityType: ValidityType.FIXED_YEARS,
          validYears: years
        })
        count++
      }
      return count
    } else {
      return this.bulkUpdateCertifications({
        validityType: ValidityType.FIXED_YEARS,
        validYears: years
      })
    }
  }

  /**
   * Set certifications to custom date validity
   */
  async setCustomDateValidity(expiryDate: Date, certificationIds?: string[]): Promise<number> {
    if (certificationIds && certificationIds.length > 0) {
      let count = 0
      for (const id of certificationIds) {
        await this.updateSingleCertification({
          id,
          validityType: ValidityType.CUSTOM_DATE,
          expiryDate
        })
        count++
      }
      return count
    } else {
      return this.bulkUpdateCertifications({
        validityType: ValidityType.CUSTOM_DATE,
        expiryDate
      })
    }
  }

  /**
   * Get certification statistics
   */
  async getCertificationStats(): Promise<{
    total: number
    byValidityType: Record<ValidityType, number>
    expiringSoon: number
    expired: number
  }> {
    const total = await prisma.certification.count()

    const byValidityType = await prisma.certification.groupBy({
      by: ['validityType'],
      _count: true
    })

    const today = new Date()
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)

    const expiringSoon = await prisma.certification.count({
      where: {
        expiryDate: {
          gte: today,
          lte: thirtyDaysFromNow
        }
      }
    })

    const expired = await prisma.certification.count({
      where: {
        expiryDate: {
          lt: today
        }
      }
    })

    const validityTypeStats: Record<ValidityType, number> = {
      [ValidityType.LIFETIME]: 0,
      [ValidityType.FIXED_YEARS]: 0,
      [ValidityType.CUSTOM_DATE]: 0
    }

    byValidityType.forEach((stat: { validityType: string; _count: number }) => {
      validityTypeStats[stat.validityType as ValidityType] = stat._count
    })

    return {
      total,
      byValidityType: validityTypeStats,
      expiringSoon,
      expired
    }
  }

  /**
   * Close the Prisma client connection
   */
  async disconnect(): Promise<void> {
    await prisma.$disconnect()
  }
}

// Example usage functions
async function exampleUsage() {
  const updater = new CertificationValidityUpdater()

  try {
    // Example 1: Update a single certification
    await updater.updateSingleCertification({
      id: 'certification-id-here',
      validityType: ValidityType.FIXED_YEARS,
      validYears: 3
    })

    // Example 2: Set all "Safety Training" certifications to lifetime
    await updater.updateCertificationsByName(
      'Safety Training',
      ValidityType.LIFETIME
    )

    // Example 3: Update all certifications for a specific employee
    await updater.updateEmployeeCertifications(
      'employee-id-here',
      ValidityType.CUSTOM_DATE,
      undefined,
      new Date('2025-12-31')
    )

    // Example 4: Set multiple certifications to fixed years
    await updater.setFixedYearsValidity(2, [
      'cert-id-1',
      'cert-id-2',
      'cert-id-3'
    ])

    // Example 5: Get statistics
    const stats = await updater.getCertificationStats()
    console.log('Certification Statistics:', stats)

  } catch (error) {
    console.error('Error in example usage:', error)
  } finally {
    await updater.disconnect()
  }
}

// Export the class and example function
export { CertificationValidityUpdater, exampleUsage }

// If running this file directly
if (require.main === module) {
  exampleUsage()
    .then(() => {
      console.log('✅ Script completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Script failed:', error)
      process.exit(1)
    })
} 