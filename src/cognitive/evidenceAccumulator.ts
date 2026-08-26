/**
 * Evidence Accumulator - Multi-Episode Statistical and Evidential Synthesis.
 *
 * Implements principled evidence accumulation across user-taught experiences and empirical runs:
 * 1. Tracks supporting vs. contradicting observations for entities under specific conditions
 * 2. Calculates proportional Bayesian/weighted belief adjustments without blindly overwriting
 * 3. Quantifies epistemic uncertainty when evidence is mixed or contradictory
 */

import { ExperienceRecord } from './experienceStore';

export interface AccumulatedEvidenceResult {
  targetEntity: string;
  supportingCount: number; // e.g. Count of delay/failure observations
  contradictingCount: number; // e.g. Count of on-time/success observations
  totalSamples: number;
  
  // Numerical Adjustments
  netDelayAdjustment: number;
  netCostAdjustment: number;
  netPenaltyAdjustment: number;
  
  // Statistical Metrics
  effectiveConfidence: number; // 0.0 to 1.0
  evidenceConsistency: 'CONSISTENT_NEGATIVE' | 'CONSISTENT_POSITIVE' | 'CONTRADICTORY_MIXED' | 'NO_EVIDENCE';
  
  // Explanatory breakdown
  evidenceSummary: string;
  retrievedRecordIds: string[];
}

export function accumulateEvidenceForAction(
  actionId: string,
  targetEntityName: string,
  retrievedRecords: ExperienceRecord[],
  currentContext: {
    demandVolatility: number;
    portCongestion: number;
    inventoryDays: number;
    weatherDisruption?: boolean;
  }
): AccumulatedEvidenceResult {
  let supportingCount = 0;
  let contradictingCount = 0;
  let delayAdjustmentSum = 0;
  let costAdjustmentSum = 0;
  const retrievedRecordIds: string[] = [];

  const entityLower = targetEntityName.toLowerCase();
  const actionLower = actionId.toLowerCase();

  for (const record of retrievedRecords) {
    const recordEntity = (record.targetEntity || record.selectedAction?.targetEntity || '').toLowerCase();
    const recordAction = (record.selectedAction?.actionType || '').toLowerCase();

    // Check entity alignment
    const matchesEntity =
      recordEntity.includes(entityLower) ||
      entityLower.includes(recordEntity) ||
      recordAction.includes(actionLower) ||
      actionLower.includes(recordAction) ||
      (entityLower.includes('alpha') && (recordEntity.includes('alpha') || recordAction.includes('alpha'))) ||
      (entityLower.includes('beta') && (recordEntity.includes('beta') || recordAction.includes('beta'))) ||
      (entityLower.includes('maritime') && (recordEntity.includes('maritime') || recordAction.includes('maritime'))) ||
      (entityLower.includes('air') && (recordEntity.includes('air') || recordAction.includes('air')));

    if (!matchesEntity) continue;

    retrievedRecordIds.push(record.experienceId);

    // Calculate context similarity weight
    let contextWeight = 1.0;
    if (record.predictionFeatures) {
      if (record.predictionFeatures.demandVolatility !== undefined) {
        const diff = Math.abs((record.predictionFeatures.demandVolatility as number) - currentContext.demandVolatility);
        contextWeight *= Math.max(0.1, 1.0 - diff * 2.0);
      }
      if (record.predictionFeatures.portCongestion !== undefined) {
        const diff = Math.abs((record.predictionFeatures.portCongestion as number) - currentContext.portCongestion);
        contextWeight *= Math.max(0.1, 1.0 - diff * 2.0);
      }
    }

    const recordConfidence = record.lesson?.confidence || record.confidence || 0.75;
    const effectiveWeight = contextWeight * recordConfidence;

    // Evaluate outcome evidence
    const observedDelay = record.actualOutcome?.delayDays ?? record.predictionError?.delayErrorDelta ?? 0;
    const isSuccess = record.success === true || (observedDelay <= 0 && !record.actualOutcome?.stockoutOccurred);

    if (isSuccess) {
      contradictingCount++;
      // A successful observation reduces expected delay
      delayAdjustmentSum -= 0.5 * effectiveWeight;
    } else {
      supportingCount++;
      const addedDelay = Math.max(1.0, observedDelay > 0 ? observedDelay - 2.0 : 2.0);
      delayAdjustmentSum += addedDelay * effectiveWeight;
    }

    if (record.actualOutcome?.cost && record.expectedOutcome?.cost) {
      costAdjustmentSum += (record.actualOutcome.cost - record.expectedOutcome.cost) * effectiveWeight;
    }
  }

  const totalSamples = supportingCount + contradictingCount;
  let evidenceConsistency: 'CONSISTENT_NEGATIVE' | 'CONSISTENT_POSITIVE' | 'CONTRADICTORY_MIXED' | 'NO_EVIDENCE' = 'NO_EVIDENCE';
  let effectiveConfidence = 0.65;
  let netDelayAdjustment = 0;
  let evidenceSummary = 'No historical experiential evidence retrieved for this candidate.';

  if (totalSamples > 0) {
    if (supportingCount > 0 && contradictingCount > 0) {
      evidenceConsistency = 'CONTRADICTORY_MIXED';
      // When evidence is contradictory, net adjustment reflects weighted evidence ratio
      const netRatio = (supportingCount - contradictingCount) / totalSamples;
      netDelayAdjustment = Math.max(-0.5, Math.min(4.0, (delayAdjustmentSum / totalSamples) * netRatio));
      effectiveConfidence = 0.60; // Lower confidence due to epistemic conflict
      evidenceSummary = `Conflicting evidence: ${supportingCount} delayed episode(s) vs ${contradictingCount} on-time episode(s). Mixed uncertainty applies.`;
    } else if (supportingCount > 0) {
      evidenceConsistency = 'CONSISTENT_NEGATIVE';
      netDelayAdjustment = Math.max(0, Math.min(4.5, delayAdjustmentSum / supportingCount));
      effectiveConfidence = Math.min(0.95, 0.70 + supportingCount * 0.08);
      evidenceSummary = `Supported by ${supportingCount} empirical observation(s) showing fulfillment delay under matching conditions.`;
    } else {
      evidenceConsistency = 'CONSISTENT_POSITIVE';
      netDelayAdjustment = Math.max(-1.0, delayAdjustmentSum / contradictingCount);
      effectiveConfidence = Math.min(0.95, 0.70 + contradictingCount * 0.08);
      evidenceSummary = `Supported by ${contradictingCount} empirical observation(s) confirming reliable on-time fulfillment.`;
    }
  }

  // Calculate stockout penalty adjustment
  let netPenaltyAdjustment = 0;
  const projectedDelay = 2.0 + netDelayAdjustment; // Standard baseline 2.0d
  if (projectedDelay > currentContext.inventoryDays) {
    netPenaltyAdjustment = (projectedDelay - currentContext.inventoryDays) * 1800;
  }

  return {
    targetEntity: targetEntityName,
    supportingCount,
    contradictingCount,
    totalSamples,
    netDelayAdjustment: Math.round(netDelayAdjustment * 10) / 10,
    netCostAdjustment: Math.round(costAdjustmentSum),
    netPenaltyAdjustment: Math.round(netPenaltyAdjustment),
    effectiveConfidence: Math.round(effectiveConfidence * 100) / 100,
    evidenceConsistency,
    evidenceSummary,
    retrievedRecordIds,
  };
}
