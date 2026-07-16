import { GovtScheme } from '../types';

export interface EligibilityResult {
  eligible: boolean;
  reasonKey?: string;
  reasonParams?: Record<string, any>;
  reason?: string;
}

export function checkEligibility(
  cooperativeData: {
    memberCount: number;
    annualProduction: number;
    certifications: string[];
  },
  scheme: GovtScheme
): EligibilityResult {
  const criteria = scheme.eligibilityCriteria;

  // 1. Check minimum member count
  if (criteria.minMembers !== null && cooperativeData.memberCount < criteria.minMembers) {
    return {
      eligible: false,
      reasonKey: 'schemes.reasonMembers',
      reasonParams: { required: criteria.minMembers, current: cooperativeData.memberCount },
      reason: `Requires minimum ${criteria.minMembers} members, you have ${cooperativeData.memberCount}.`
    };
  }

  // 2. Check minimum annual production volume
  if (criteria.minAnnualProduction !== null && cooperativeData.annualProduction < criteria.minAnnualProduction) {
    return {
      eligible: false,
      reasonKey: 'schemes.reasonProduction',
      reasonParams: { required: criteria.minAnnualProduction, current: cooperativeData.annualProduction },
      reason: `Requires minimum annual production of ${criteria.minAnnualProduction} pieces, you have ${cooperativeData.annualProduction}.`
    };
  }

  // 3. Check required certifications
  if (criteria.requiredCertifications && criteria.requiredCertifications.length > 0) {
    const missingCertifications = criteria.requiredCertifications.filter(
      cert => !cooperativeData.certifications.includes(cert)
    );
    if (missingCertifications.length > 0) {
      return {
        eligible: false,
        reasonKey: 'schemes.reasonCertifications',
        reasonParams: { required: missingCertifications.join(', ') },
        reason: `Requires certifications: ${missingCertifications.join(', ')}.`
      };
    }
  }

  // Eligible if all conditions pass
  return { eligible: true };
}
