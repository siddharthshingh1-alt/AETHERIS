/**
 * General Knowledge Teaching Parser for AETHERIS.
 *
 * Extracts structured concepts, relationships, properties, and epistemic states
 * from arbitrary natural language user teaching across any domain:
 * - "A kettle is a heating appliance used for boiling water."
 * - "Python is a programming language that requires instructions."
 * - "An apple is a fruit containing seeds."
 * - "A database is used for storing data."
 * - "Extreme cold causes battery degradation."
 * - "Running a web server requires network bandwidth and memory."
 */

import { Concept, Relationship, StandardPredicate, EpistemicStatus, KnowledgeSource } from '../types/knowledge';
import { parseUserTeaching as parseLegacySupplyTeaching, ParsedTeachingResult, detectTeachingIntent as detectLegacyTeachingIntent } from './teachingParser';

export interface ParsedConceptTeachingResult {
  isConceptTeaching: boolean;
  isTeaching: boolean;
  rawText: string;
  source: KnowledgeSource;
  status: EpistemicStatus;
  confidence: number;

  // Single primary concept (for easy creation)
  concept?: {
    id?: string;
    name: string;
    category: string;
    description?: string;
    source: KnowledgeSource;
    status: EpistemicStatus;
    confidence: number;
    properties?: Record<string, any>;
  };

  // Primary relationship
  relationship?: {
    sourceConceptId: string;
    predicate: StandardPredicate;
    targetConceptId: string;
    targetDescription?: string;
    source: KnowledgeSource;
    status: EpistemicStatus;
    confidence: number;
  };

  // Multiple extracted relationships
  relationships: Array<{
    sourceConceptName: string;
    predicate: StandardPredicate;
    targetConceptName: string;
    targetDescription?: string;
    confidence: number;
  }>;

  // Legacy compatibility
  legacyResult?: ParsedTeachingResult;
}

export function detectGeneralTeachingIntent(text: string): boolean {
  if (detectLegacyTeachingIntent(text)) return true;

  const lower = text.toLowerCase().trim();
  const conceptPatterns = [
    /\b(is|are) (a|an|used for|located in|part of)\b/i,
    /\b(used for|used to|requires|causes|prevents|cannot|can be)\b/i,
    /\b(remember that|note that|teach you|learn that)\b/i,
    /\b(a|an) [a-z0-9_-]+ (is|has|can|requires)\b/i,
  ];

  return conceptPatterns.some((pattern) => pattern.test(lower));
}

export function parseGeneralTeaching(text: string): ParsedConceptTeachingResult {
  const rawText = text.trim();
  const isTeaching = detectGeneralTeachingIntent(rawText);

  // First check if this is a legacy supply-chain specific observation/heuristic
  const legacyResult = parseLegacySupplyTeaching(rawText);
  const relationships: ParsedConceptTeachingResult['relationships'] = [];
  let isConceptTeaching = false;

  let conceptName = '';
  let conceptCategory = 'GENERAL_ENTITY';
  let primaryPredicate: StandardPredicate = 'IS_A';
  let targetName = '';
  let targetDescription = '';

  // -------------------------------------------------------------
  // Pattern 1: "A <Subject> is a/an <Category> used for <Target>"
  // Example: "A kettle is a heating appliance used for boiling water"
  // -------------------------------------------------------------
  const patternIsAUsedFor = /^(?:a\s+|an\s+|the\s+)?([a-z0-9_\s-]+?)\s+is\s+(?:an?|the)\s+([a-z0-9_\s-]+?)\s+(?:used\s+for|used\s+to)\s+(.+)/i;
  const match1 = rawText.match(patternIsAUsedFor);

  // -------------------------------------------------------------
  // Pattern 2: "<Subject> requires <Target>"
  // Example: "Running a web server requires network bandwidth and memory", "A Kettle requires electricity or flame to heat liquid"
  // -------------------------------------------------------------
  const patternRequiresDirect = /^(?:a\s+|an\s+|the\s+)?([a-z0-9_\s-]+?)\s+(?:requires|needs)\s+(.+)/i;
  const matchRequiresDirect = !match1 ? rawText.match(patternRequiresDirect) : null;

  // -------------------------------------------------------------
  // Pattern 3: "<Subject> causes <Target>"
  // Example: "Extreme cold causes battery degradation"
  // -------------------------------------------------------------
  const patternCauses = /^(?:remember that\s+|note that\s+)?(?:a\s+|an\s+|the\s+)?([a-z0-9_\s-]+?)\s+(?:causes|leads to|results in)\s+(.+)/i;
  const matchCauses = !match1 && !matchRequiresDirect ? rawText.match(patternCauses) : null;

  // -------------------------------------------------------------
  // Pattern 4: "<Subject> is a/an <Category>" or complex descriptions
  // Example: "An Apple is a fruit containing seeds", "An Invoice is a commercial document requesting payment"
  // -------------------------------------------------------------
  const patternIsA = /^(?:a\s+|an\s+|the\s+)?([a-z0-9_\s-]+?)\s+is\s+(?:an?|the)\s+(.+)$/i;
  const matchIsA = !match1 && !matchRequiresDirect && !matchCauses ? rawText.match(patternIsA) : null;

  if (match1) {
    isConceptTeaching = true;
    conceptName = cleanName(match1[1]);
    conceptCategory = mapCategory(match1[2]);
    targetName = cleanName(match1[2]);
    targetDescription = match1[3].trim().replace(/\.$/, '');

    relationships.push({
      sourceConceptName: conceptName,
      predicate: 'IS_A',
      targetConceptName: targetName,
      confidence: 0.90,
    });

    relationships.push({
      sourceConceptName: conceptName,
      predicate: 'USED_FOR',
      targetConceptName: capitalize(targetDescription),
      targetDescription,
      confidence: 0.90,
    });
  } else if (matchRequiresDirect) {
    isConceptTeaching = true;
    conceptName = cleanName(matchRequiresDirect[1]);
    conceptCategory = mapCategory(conceptName);
    primaryPredicate = 'REQUIRES';
    targetName = cleanName(matchRequiresDirect[2]);
    targetDescription = matchRequiresDirect[2].trim().replace(/\.$/, '');

    relationships.push({
      sourceConceptName: conceptName,
      predicate: 'REQUIRES',
      targetConceptName: targetName,
      targetDescription,
      confidence: 0.90,
    });
  } else if (matchCauses) {
    isConceptTeaching = true;
    conceptName = cleanName(matchCauses[1]);
    conceptCategory = 'CAUSE_EFFECT';
    primaryPredicate = 'CAUSES';
    targetName = cleanName(matchCauses[2]);
    targetDescription = matchCauses[2].trim().replace(/\.$/, '');

    relationships.push({
      sourceConceptName: conceptName,
      predicate: 'CAUSES',
      targetConceptName: targetName,
      targetDescription,
      confidence: 0.90,
    });
  } else if (matchIsA) {
    isConceptTeaching = true;
    conceptName = cleanName(matchIsA[1]);
    conceptCategory = mapCategory(matchIsA[2]);
    primaryPredicate = 'IS_A';
    targetName = cleanName(matchIsA[2]);
    targetDescription = matchIsA[2].trim().replace(/\.$/, '');

    relationships.push({
      sourceConceptName: conceptName,
      predicate: 'IS_A',
      targetConceptName: targetName,
      confidence: 0.90,
    });
  }

  const concept = conceptName
    ? {
        id: `concept_${conceptName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        name: conceptName,
        category: conceptCategory,
        description: rawText,
        source: 'USER' as KnowledgeSource,
        status: 'USER_TAUGHT' as EpistemicStatus,
        confidence: 0.85,
        properties: {},
      }
    : undefined;

  const relationship =
    conceptName && targetName
      ? {
          sourceConceptId: `concept_${conceptName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          predicate: primaryPredicate,
          targetConceptId: `concept_${targetName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          targetDescription: targetDescription || targetName,
          source: 'USER' as KnowledgeSource,
          status: 'USER_TAUGHT' as EpistemicStatus,
          confidence: 0.85,
        }
      : undefined;

  return {
    isConceptTeaching,
    isTeaching: isTeaching || isConceptTeaching,
    rawText,
    source: 'USER',
    status: 'USER_TAUGHT',
    confidence: 0.85,
    concept,
    relationship,
    relationships,
    legacyResult,
  };
}

function cleanName(str: string): string {
  if (!str) return '';
  let cleaned = str.trim();
  // Strip leading articles and punctuation
  cleaned = cleaned.replace(/^(?:a\s+|an\s+|the\s+|remember that\s+|note that\s+)+/i, '').trim();
  cleaned = cleaned.replace(/\.$/, '');
  return cleaned
    .split(' ')
    .map((w) => capitalize(w))
    .join(' ');
}

function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function mapCategory(str: string): string {
  const s = str.toLowerCase();
  if (s.includes('database') || s.includes('server') || s.includes('programming') || s.includes('software') || s.includes('language') || s.includes('code')) {
    return 'COMPUTING';
  }
  if (s.includes('fruit') || s.includes('plant') || s.includes('animal') || s.includes('organism')) {
    return 'BIOLOGY';
  }
  if (s.includes('appliance') || s.includes('device') || s.includes('machine') || s.includes('object') || s.includes('physics')) {
    return 'PHYSICS';
  }
  if (s.includes('document') || s.includes('payment') || s.includes('finance') || s.includes('revenue') || s.includes('commercial') || s.includes('invoice')) {
    return 'FINANCIAL';
  }
  if (s.includes('time') || s.includes('timeline') || s.includes('milestone') || s.includes('deadline')) {
    return 'TEMPORAL';
  }
  if (s.includes('warehouse') || s.includes('building') || s.includes('facility')) {
    return 'ORGANIZATION';
  }
  return 'GENERAL_ENTITY';
}
