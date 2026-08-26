import { WorldEntity, CausalEdge, EpistemicStatement, EpistemicStatus } from '../types/cognitive';

export interface WorldModelState {
  entities: Record<string, WorldEntity>;
  causalEdges: CausalEdge[];
  epistemicRegistry: EpistemicStatement[];
  version: number;
  lastUpdatedCycle: number;
}

export function createInitialWorldModel(): WorldModelState {
  const entities: Record<string, WorldEntity> = {
    'supplier_alpha': {
      id: 'supplier_alpha',
      name: 'Supplier Alpha (Bulk Low-Cost)',
      type: 'SUPPLIER',
      status: 'OPERATIONAL',
      properties: {
        'unit_cost': { key: 'unit_cost', value: 45, confidence: 0.98, source: 'contract_v1', lastUpdatedCycle: 0 },
        'base_lead_time_days': { key: 'base_lead_time_days', value: 3.0, confidence: 0.85, source: 'supplier_spec', lastUpdatedCycle: 0 },
        'reliability_rating': { key: 'reliability_rating', value: 0.88, confidence: 0.75, source: 'initial_benchmark', lastUpdatedCycle: 0 },
        'capacity_threshold': { key: 'capacity_threshold', value: 120, confidence: 0.60, source: 'inferred', lastUpdatedCycle: 0 },
        'delay_sensitivity_to_volume': { key: 'delay_sensitivity_to_volume', value: 0.65, confidence: 0.50, source: 'hypothesis', lastUpdatedCycle: 0 },
      },
      reliabilityScore: 0.88,
      historicalEventsCount: 0,
      tags: ['bulk', 'low_cost', 'sensitive_to_surges']
    },
    'supplier_beta': {
      id: 'supplier_beta',
      name: 'Supplier Beta (Agile Premium)',
      type: 'SUPPLIER',
      status: 'OPERATIONAL',
      properties: {
        'unit_cost': { key: 'unit_cost', value: 72, confidence: 0.99, source: 'contract_v1', lastUpdatedCycle: 0 },
        'base_lead_time_days': { key: 'base_lead_time_days', value: 2.0, confidence: 0.95, source: 'supplier_spec', lastUpdatedCycle: 0 },
        'reliability_rating': { key: 'reliability_rating', value: 0.96, confidence: 0.90, source: 'initial_benchmark', lastUpdatedCycle: 0 },
        'capacity_threshold': { key: 'capacity_threshold', value: 250, confidence: 0.85, source: 'verified', lastUpdatedCycle: 0 },
        'delay_sensitivity_to_volume': { key: 'delay_sensitivity_to_volume', value: 0.15, confidence: 0.80, source: 'historical_audit', lastUpdatedCycle: 0 },
      },
      reliabilityScore: 0.96,
      historicalEventsCount: 0,
      tags: ['agile', 'rapid', 'high_reliability']
    },
    'supplier_gamma': {
      id: 'supplier_gamma',
      name: 'Supplier Gamma (Local Specialized)',
      type: 'SUPPLIER',
      status: 'OPERATIONAL',
      properties: {
        'unit_cost': { key: 'unit_cost', value: 60, confidence: 0.92, source: 'contract_v1', lastUpdatedCycle: 0 },
        'base_lead_time_days': { key: 'base_lead_time_days', value: 2.5, confidence: 0.80, source: 'supplier_spec', lastUpdatedCycle: 0 },
        'reliability_rating': { key: 'reliability_rating', value: 0.91, confidence: 0.70, source: 'initial_benchmark', lastUpdatedCycle: 0 },
        'capacity_threshold': { key: 'capacity_threshold', value: 80, confidence: 0.65, source: 'inferred', lastUpdatedCycle: 0 },
        'delay_sensitivity_to_volume': { key: 'delay_sensitivity_to_volume', value: 0.45, confidence: 0.55, source: 'hypothesis', lastUpdatedCycle: 0 },
      },
      reliabilityScore: 0.91,
      historicalEventsCount: 0,
      tags: ['local', 'medium_cost', 'flexible']
    },
    'logistics_network': {
      id: 'logistics_network',
      name: 'Global Freight & Port Corridor',
      type: 'LOGISTICS',
      status: 'MODERATE_TRAFFIC',
      properties: {
        'port_congestion_index': { key: 'port_congestion_index', value: 0.20, confidence: 0.90, source: 'sensor_feed', lastUpdatedCycle: 0 },
        'weather_friction_coefficient': { key: 'weather_friction_coefficient', value: 1.0, confidence: 0.95, source: 'weather_service', lastUpdatedCycle: 0 },
        'customs_clearance_delay_days': { key: 'customs_clearance_delay_days', value: 0.5, confidence: 0.85, source: 'port_telemetry', lastUpdatedCycle: 0 }
      },
      reliabilityScore: 0.90,
      historicalEventsCount: 0,
      tags: ['transport', 'intermodal', 'external_dependency']
    },
    'production_hub': {
      id: 'production_hub',
      name: 'Central Assembly Facility',
      type: 'PRODUCTION',
      status: 'ACTIVE',
      properties: {
        'daily_burn_rate_units': { key: 'daily_burn_rate_units', value: 40, confidence: 0.95, source: 'erp_system', lastUpdatedCycle: 0 },
        'stockout_cost_per_day': { key: 'stockout_cost_per_day', value: 1200, confidence: 0.99, source: 'finance_model', lastUpdatedCycle: 0 },
        'minimum_buffer_stock': { key: 'minimum_buffer_stock', value: 50, confidence: 0.90, source: 'policy_v2', lastUpdatedCycle: 0 }
      },
      reliabilityScore: 0.95,
      historicalEventsCount: 0,
      tags: ['internal', 'assembly', 'throughput']
    },
    'liquid_capital': {
      id: 'liquid_capital',
      name: 'Operational Cash Reserves',
      type: 'RESOURCE',
      status: 'SOLVENT',
      properties: {
        'available_balance': { key: 'available_balance', value: 25000, confidence: 1.0, source: 'ledger', lastUpdatedCycle: 0 },
        'credit_line_available': { key: 'credit_line_available', value: 15000, confidence: 1.0, source: 'bank_api', lastUpdatedCycle: 0 }
      },
      reliabilityScore: 1.0,
      historicalEventsCount: 0,
      tags: ['finance', 'liquidity', 'constraints']
    }
  };

  const causalEdges: CausalEdge[] = [
    {
      id: 'edge_1',
      sourceEntityId: 'supplier_alpha',
      sourceProperty: 'order_volume',
      targetEntityId: 'supplier_alpha',
      targetProperty: 'delivery_delay_days',
      relationship: 'High order volume (>100 units) induces non-linear factory queuing latency',
      influenceWeight: 0.72,
      confidence: 0.65,
      empiricalSupportCount: 1,
      falsificationCount: 0,
      lastUpdatedCycle: 0
    },
    {
      id: 'edge_2',
      sourceEntityId: 'logistics_network',
      sourceProperty: 'port_congestion_index',
      targetEntityId: 'logistics_network',
      targetProperty: 'transit_lead_time',
      relationship: 'Port congestion directly delays customs handoff and freight discharge',
      influenceWeight: 0.85,
      confidence: 0.90,
      empiricalSupportCount: 4,
      falsificationCount: 0,
      lastUpdatedCycle: 0
    },
    {
      id: 'edge_3',
      sourceEntityId: 'supplier_alpha',
      sourceProperty: 'delivery_delay_days',
      targetEntityId: 'production_hub',
      targetProperty: 'stockout_risk',
      relationship: 'Supplier delivery delay when buffer is low causes assembly line stoppage',
      influenceWeight: 0.92,
      confidence: 0.95,
      empiricalSupportCount: 2,
      falsificationCount: 0,
      lastUpdatedCycle: 0
    },
    {
      id: 'edge_4',
      sourceEntityId: 'supplier_beta',
      sourceProperty: 'order_volume',
      targetEntityId: 'supplier_beta',
      targetProperty: 'delivery_delay_days',
      relationship: 'Supplier Beta maintains parallel modular lines, minimal sensitivity to volume',
      influenceWeight: 0.12,
      confidence: 0.82,
      empiricalSupportCount: 3,
      falsificationCount: 0,
      lastUpdatedCycle: 0
    }
  ];

  const epistemicRegistry: EpistemicStatement[] = [
    {
      id: 'ep_1',
      statement: 'Supplier Beta charges $72/unit and offers guaranteed 2-day SLA with SLA breach penalty.',
      status: 'FACT',
      confidence: 1.0,
      evidenceIds: ['contract_doc_beta_2026'],
      counterEvidenceIds: [],
      createdCycle: 0,
      lastValidatedCycle: 0
    },
    {
      id: 'ep_2',
      statement: 'Supplier Alpha is currently capable of sustaining bulk orders without delivery friction.',
      status: 'ASSUMPTION',
      confidence: 0.60,
      evidenceIds: ['supplier_alpha_catalog'],
      counterEvidenceIds: [],
      createdCycle: 0,
      lastValidatedCycle: 0
    },
    {
      id: 'ep_3',
      statement: 'Orders exceeding 100 units from Supplier Alpha experience an average +3.5 days delivery delay.',
      status: 'HYPOTHESIS',
      confidence: 0.55,
      evidenceIds: ['initial_prior'],
      counterEvidenceIds: [],
      createdCycle: 0,
      lastValidatedCycle: 0
    },
    {
      id: 'ep_4',
      statement: 'Current warehouse buffer stock is sufficient for 3 days of standard production without replenishment.',
      status: 'BELIEF',
      confidence: 0.88,
      evidenceIds: ['warehouse_count_c0'],
      counterEvidenceIds: [],
      createdCycle: 0,
      lastValidatedCycle: 0
    },
    {
      id: 'ep_5',
      statement: 'Supplier Gamma is resistant to regional weather disturbances due to inland ground logistics.',
      status: 'INFERENCE',
      confidence: 0.70,
      evidenceIds: ['geo_location_registry'],
      counterEvidenceIds: [],
      createdCycle: 0,
      lastValidatedCycle: 0
    }
  ];

  return {
    entities,
    causalEdges,
    epistemicRegistry,
    version: 1,
    lastUpdatedCycle: 0
  };
}
