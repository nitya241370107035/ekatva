import { sha256 } from 'js-sha256';

export interface UnhashedProductionStep {
  step: string;
  timestamp: string;
  details: string;
}

export interface HashedProductionStep extends UnhashedProductionStep {
  hash: string;
}

/**
 * Generates an immutable hash chain for production steps.
 * The first step is hashed individually.
 * Subsequent steps hash the combination of the previous step's hash and the current step's details.
 */
export function generateHashChain(steps: UnhashedProductionStep[]): HashedProductionStep[] {
  const hashedSteps: HashedProductionStep[] = [];
  let previousHash = '';

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    let dataToHash = '';

    if (i === 0) {
      dataToHash = `${step.step}${step.timestamp}${step.details}`;
    } else {
      dataToHash = `${previousHash}${step.step}${step.timestamp}${step.details}`;
    }

    const hash = sha256(dataToHash);
    hashedSteps.push({
      ...step,
      hash,
    });
    previousHash = hash;
  }

  return hashedSteps;
}

/**
 * Verifies if a hash chain is mathematically intact.
 * Recalculates hashes and checks if they match.
 */
export function verifyHashChain(steps: HashedProductionStep[]): boolean {
  if (!steps || steps.length === 0) return true;
  let previousHash = '';

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    let expectedHash = '';

    if (i === 0) {
      expectedHash = sha256(`${step.step}${step.timestamp}${step.details}`);
    } else {
      expectedHash = sha256(`${previousHash}${step.step}${step.timestamp}${step.details}`);
    }

    if (step.hash !== expectedHash) {
      return false;
    }
    previousHash = step.hash;
  }

  return true;
}
