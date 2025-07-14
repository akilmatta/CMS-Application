import { PrismaClient } from '@prisma/client';
import { 
  calculateExpiryDate, 
  getValidityType, 
  getValidYears,
  hasValidityRule,
  getAllValidityRules,
  getAllCertificationNames
} from './certificationValidityMap';

const prisma = new PrismaClient();

export interface CertificationData {
  employeeId: string;
  name: string;
  expiryDate?: Date;
  validityType?: 'LIFETIME' | 'FIXED_YEARS' | 'CUSTOM_DATE';
  validYears?: number;
}

export interface BulkUpdateResult {
  success: boolean;
  message: string;
  updatedCount: number;
  errors: string[];
}

export class CertificationValidityService {
  /**
   * Create a certification with automatic validity calculation
   */
  async createCertification(data: CertificationData) {
    try {
      const trimmedName = data.name.trim();
      
      // Use validity map to determine expiry date and validity type
      const calculatedExpiryDate = calculateExpiryDate(trimmedName, data.expiryDate);
      const calculatedValidityType = getValidityType(trimmedName);
      const calculatedValidYears = getValidYears(trimmedName);

      const certificationData: any = {
        employeeId: data.employeeId,
        name: trimmedName,
        expiryDate: calculatedExpiryDate,
        validityType: data.validityType || calculatedValidityType
      };

      // Add validYears if provided or calculated
      if (data.validityType === 'FIXED_YEARS' && data.validYears) {
        certificationData.validYears = data.validYears;
      } else if (calculatedValidYears) {
        certificationData.validYears = calculatedValidYears;
      }

      const certification = await prisma.certification.create({
        data: certificationData,
        include: {
          employee: true
        }
      });

      return {
        success: true,
        certification,
        validityInfo: {
          type: calculatedValidityType,
          years: calculatedValidYears,
          isLifetime: calculatedValidityType === 'LIFETIME'
        }
      };
    } catch (error) {
      console.error('Error creating certification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update a certification with automatic validity recalculation if name changes
   */
  async updateCertification(id: string, data: Partial<CertificationData>) {
    try {
      // Get current certification to check if name is changing
      const currentCertification = await prisma.certification.findUnique({
        where: { id }
      });

      if (!currentCertification) {
        return {
          success: false,
          error: 'Certification not found'
        };
      }

      const updateData: any = {};
      
      if (data.name) {
        const trimmedName = data.name.trim();
        updateData.name = trimmedName;
        
        // If name is changing, recalculate validity based on new name
        if (trimmedName !== currentCertification.name) {
          const calculatedExpiryDate = calculateExpiryDate(trimmedName, data.expiryDate);
          const calculatedValidityType = getValidityType(trimmedName);
          const calculatedValidYears = getValidYears(trimmedName);
          
          updateData.expiryDate = calculatedExpiryDate;
          updateData.validityType = data.validityType || calculatedValidityType;
          
          if (calculatedValidYears) {
            updateData.validYears = calculatedValidYears;
          }
        }
      }
      
      if (data.expiryDate && !data.name) {
        updateData.expiryDate = data.expiryDate;
      }

      if (data.validityType) {
        updateData.validityType = data.validityType;
      }

      if (data.validYears !== undefined) {
        updateData.validYears = data.validYears;
      }

      const certification = await prisma.certification.update({
        where: { id },
        data: updateData,
        include: {
          employee: true
        }
      });

      return {
        success: true,
        certification
      };
    } catch (error) {
      console.error('Error updating certification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Bulk update certifications for a specific employee
   */
  async bulkUpdateEmployeeCertifications(employeeId: string, validityType: 'LIFETIME' | 'FIXED_YEARS' | 'CUSTOM_DATE', validYears?: number): Promise<BulkUpdateResult> {
    try {
      const certifications = await prisma.certification.findMany({
        where: { employeeId }
      });

      let updatedCount = 0;
      const errors: string[] = [];

      for (const cert of certifications) {
        const result = await this.updateCertification(cert.id, {
          validityType,
          validYears
        });

        if (result.success) {
          updatedCount++;
        } else {
          errors.push(`Failed to update certification ${cert.name}: ${result.error}`);
        }
      }

      return {
        success: updatedCount > 0,
        message: `Updated ${updatedCount} out of ${certifications.length} certifications`,
        updatedCount,
        errors
      };
    } catch (error) {
      console.error('Error in bulk update:', error);
      return {
        success: false,
        message: 'Bulk update failed',
        updatedCount: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Bulk update certifications by name across all employees
   */
  async bulkUpdateCertificationsByName(certificationName: string, validityType: 'LIFETIME' | 'FIXED_YEARS' | 'CUSTOM_DATE', validYears?: number): Promise<BulkUpdateResult> {
    try {
      const certifications = await prisma.certification.findMany({
        where: { name: certificationName }
      });

      let updatedCount = 0;
      const errors: string[] = [];

      for (const cert of certifications) {
        const result = await this.updateCertification(cert.id, {
          validityType,
          validYears
        });

        if (result.success) {
          updatedCount++;
        } else {
          errors.push(`Failed to update certification ${cert.name}: ${result.error}`);
        }
      }

      return {
        success: updatedCount > 0,
        message: `Updated ${updatedCount} out of ${certifications.length} certifications`,
        updatedCount,
        errors
      };
    } catch (error) {
      console.error('Error in bulk update by name:', error);
      return {
        success: false,
        message: 'Bulk update failed',
        updatedCount: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Get validity statistics
   */
  async getValidityStatistics() {
    try {
      const totalCertifications = await prisma.certification.count();
      
      const validityTypeStats = await prisma.certification.groupBy({
        by: ['validityType'],
        _count: true
      });

      const lifetimeCount = validityTypeStats.find((stat: any) => stat.validityType === 'LIFETIME')?._count || 0;
      const fixedYearsCount = validityTypeStats.find((stat: any) => stat.validityType === 'FIXED_YEARS')?._count || 0;
      const customDateCount = validityTypeStats.find((stat: any) => stat.validityType === 'CUSTOM_DATE')?._count || 0;

      const today = new Date();
      const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

      const expiringSoon = await prisma.certification.count({
        where: {
          expiryDate: {
            gte: today,
            lte: thirtyDaysFromNow
          }
        }
      });

      const expired = await prisma.certification.count({
        where: {
          expiryDate: {
            lt: today
          }
        }
      });

      return {
        totalCertifications,
        validityTypeBreakdown: {
          lifetime: lifetimeCount,
          fixedYears: fixedYearsCount,
          customDate: customDateCount
        },
        expiringSoon,
        expired,
        validityMap: {
          totalRules: getAllCertificationNames().length,
          rules: getAllValidityRules()
        }
      };
    } catch (error) {
      console.error('Error getting validity statistics:', error);
      throw error;
    }
  }

  /**
   * Validate certification name against validity map
   */
  validateCertificationName(name: string) {
    const trimmedName = name.trim();
    const hasRule = hasValidityRule(trimmedName);
    const validityType = getValidityType(trimmedName);
    const validYears = getValidYears(trimmedName);
    const calculatedExpiryDate = calculateExpiryDate(trimmedName);

    return {
      name: trimmedName,
      hasValidityRule: hasRule,
      validityType,
      validYears,
      calculatedExpiryDate,
      isLifetime: validityType === 'LIFETIME'
    };
  }
}

export const certificationValidityService = new CertificationValidityService(); 