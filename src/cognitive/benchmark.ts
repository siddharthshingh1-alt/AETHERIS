/**
 * Benchmark Task Suite for Testing Learning in the Cognitive Architecture.
 *
 * Provides 36 deterministic, objectively evaluated tasks across 3 task families:
 * - RESOURCE_ALLOCATION
 * - SUPPLIER_SELECTION
 * - SEQUENTIAL_DECISION
 *
 * Each task has a deterministic seed, explicit ground-truth evaluation,
 * and belongs to one of three splits:
 * - REPEATED (recurring parameterizations testing convergence)
 * - RELATED (shared causal structure with parameter variations)
 * - HELD_OUT (novel transfer scenarios testing rule generalization)
 */

export type TaskSplit = 'REPEATED' | 'RELATED' | 'HELD_OUT';
export type TaskFamily = 'RESOURCE_ALLOCATION' | 'SUPPLIER_SELECTION' | 'SEQUENTIAL_DECISION';

export interface ActionOption {
  actionId: string;
  label: string;
  parameters: Record<string, any>;
}

export interface TaskOutcome {
  delayDays: number;
  cost: number;
  stockoutOccurred: boolean;
  netUtility: number;
  groundTruthExplanation: string;
}

export interface BenchmarkTask {
  taskId: string;
  taskFamily: TaskFamily;
  split: TaskSplit;
  seed: number;
  title: string;
  description: string;
  context: {
    inventoryDays: number;
    dailyDemand: number;
    orderVolume: number;
    portCongestion: number; // 0.0 to 1.0
    weatherDisruption: boolean;
    budgetLimit: number;
    demandVolatility: number;
    priorHistoryHint?: string;
    [key: string]: any;
  };
  availableActions: ActionOption[];
  evaluateAction: (actionId: string, parameters: Record<string, any>) => TaskOutcome;
  groundTruthOptimalActionId: string;
  optimalNetUtility: number;
}

/**
 * Deterministic pseudo-random number generator using seed.
 */
function pseudoRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Generates the standardized 36-task benchmark suite.
 */
export function generateBenchmarkSuite(): BenchmarkTask[] {
  const tasks: BenchmarkTask[] = [];

  // =========================================================================
  // FAMILY A: SUPPLIER SELECTION (12 Tasks: 5 Repeated, 3 Related, 4 Held-Out)
  // Causal Rule:
  // - Supplier Alpha has low base price ($1200) and base lead time (2.0d), BUT when order volume > 1000 or port congestion > 0.4, lead time spikes by +2.5d.
  // - Supplier Beta has higher price ($1600), fixed air lead time (1.0d), unaffected by port congestion.
  // - Dual Sourcing (Alpha 50% + Beta 50%) costs $1450, guarantees 1.2d lead time under congestion.
  // =========================================================================

  // Repeated Tasks A1 to A5
  const supplierRepeatedSeeds = [101, 102, 103, 104, 105];
  supplierRepeatedSeeds.forEach((seed, idx) => {
    const prng = pseudoRandom(seed);
    const orderVol = 1200 + Math.floor(prng() * 100);
    const portCongestion = 0.55 + (prng() * 0.1);
    const invDays = 2.0;

    tasks.push({
      taskId: `SUP_REP_${idx + 1}`,
      taskFamily: 'SUPPLIER_SELECTION',
      split: 'REPEATED',
      seed,
      title: `Supplier Selection: Port Congestion Surge (Trial ${idx + 1})`,
      description: `High-volume order of ${orderVol} units with port congestion at ${(portCongestion * 100).toFixed(0)}%. Current inventory is ${invDays} days.`,
      context: {
        inventoryDays: invDays,
        dailyDemand: 500,
        orderVolume: orderVol,
        portCongestion,
        weatherDisruption: false,
        budgetLimit: 3000,
        demandVolatility: 0.2,
      },
      availableActions: [
        { actionId: 'SUPPLIER_ALPHA', label: 'Order 100% via Supplier Alpha (Maritime Low Cost)', parameters: { supplier: 'alpha', allocation: 1.0 } },
        { actionId: 'SUPPLIER_BETA', label: 'Order 100% via Supplier Beta (Air Express)', parameters: { supplier: 'beta', allocation: 1.0 } },
        { actionId: 'DUAL_SOURCE', label: 'Dual Source (50% Alpha, 50% Beta)', parameters: { supplier: 'dual', allocation: 0.5 } },
      ],
      evaluateAction: (actionId) => {
        if (actionId === 'SUPPLIER_ALPHA') {
          // Alpha suffers delay spike: 2.0 base + 2.5 congestion = 4.5 days. Inventory runs out at day 2.0 -> Stockout for 2.5 days.
          const delay = 4.5;
          const cost = 1200;
          const penalty = (delay - invDays) * 1800; // $4500 stockout penalty
          const net = 10000 - cost - penalty;
          return {
            delayDays: delay,
            cost,
            stockoutOccurred: true,
            netUtility: net,
            groundTruthExplanation: 'Alpha experienced maritime port choke point causing 4.5d delay and catastrophic stockout.',
          };
        } else if (actionId === 'SUPPLIER_BETA') {
          const delay = 1.0;
          const cost = 1600;
          const net = 10000 - cost; // No stockout
          return {
            delayDays: delay,
            cost,
            stockoutOccurred: false,
            netUtility: net,
            groundTruthExplanation: 'Beta delivered via air express in 1.0d, avoiding stockout with higher direct cost.',
          };
        } else {
          // Dual source
          const delay = 1.2;
          const cost = 1420;
          const net = 10000 - cost;
          return {
            delayDays: delay,
            cost,
            stockoutOccurred: false,
            netUtility: net,
            groundTruthExplanation: 'Dual sourcing shielded against stockout while saving $180 over pure Beta.',
          };
        }
      },
      groundTruthOptimalActionId: 'DUAL_SOURCE',
      optimalNetUtility: 8580,
    });
  });

  // Related Tasks A6 to A8
  const supplierRelatedSeeds = [201, 202, 203];
  supplierRelatedSeeds.forEach((seed, idx) => {
    const prng = pseudoRandom(seed);
    const orderVol = 800 + Math.floor(prng() * 100);
    const portCongestion = 0.15; // Low congestion
    const invDays = 3.5;

    tasks.push({
      taskId: `SUP_REL_${idx + 1}`,
      taskFamily: 'SUPPLIER_SELECTION',
      split: 'RELATED',
      seed,
      title: `Supplier Selection: Low Congestion Normal Run (Trial ${idx + 1})`,
      description: `Normal order of ${orderVol} units with minimal port congestion ${(portCongestion * 100).toFixed(0)}% and healthy ${invDays}d buffer.`,
      context: {
        inventoryDays: invDays,
        dailyDemand: 400,
        orderVolume: orderVol,
        portCongestion,
        weatherDisruption: false,
        budgetLimit: 3000,
        demandVolatility: 0.1,
      },
      availableActions: [
        { actionId: 'SUPPLIER_ALPHA', label: 'Order 100% via Supplier Alpha (Maritime Low Cost)', parameters: { supplier: 'alpha', allocation: 1.0 } },
        { actionId: 'SUPPLIER_BETA', label: 'Order 100% via Supplier Beta (Air Express)', parameters: { supplier: 'beta', allocation: 1.0 } },
        { actionId: 'DUAL_SOURCE', label: 'Dual Source (50% Alpha, 50% Beta)', parameters: { supplier: 'dual', allocation: 0.5 } },
      ],
      evaluateAction: (actionId) => {
        if (actionId === 'SUPPLIER_ALPHA') {
          const delay = 2.0;
          const cost = 1100;
          return {
            delayDays: delay,
            cost,
            stockoutOccurred: false,
            netUtility: 10000 - cost,
            groundTruthExplanation: 'Alpha delivered on time without congestion; lowest total cost.',
          };
        } else if (actionId === 'SUPPLIER_BETA') {
          const delay = 1.0;
          const cost = 1600;
          return {
            delayDays: delay,
            cost,
            stockoutOccurred: false,
            netUtility: 10000 - cost,
            groundTruthExplanation: 'Beta delivered fast but incurred unnecessary air freight premium.',
          };
        } else {
          const delay = 1.5;
          const cost = 1350;
          return {
            delayDays: delay,
            cost,
            stockoutOccurred: false,
            netUtility: 10000 - cost,
            groundTruthExplanation: 'Dual sourcing incurred moderate cost premium without needed risk benefit.',
          };
        }
      },
      groundTruthOptimalActionId: 'SUPPLIER_ALPHA',
      optimalNetUtility: 8900,
    });
  });

  // Held-Out Tasks A9 to A12 (Novel Supplier Names, Novel Ranges)
  const supplierHeldOutSeeds = [301, 302, 303, 304];
  supplierHeldOutSeeds.forEach((seed, idx) => {
    const isChoked = idx % 2 === 0;
    const congestion = isChoked ? 0.72 : 0.08;
    const invDays = isChoked ? 1.8 : 4.0;

    tasks.push({
      taskId: `SUP_HELD_${idx + 1}`,
      taskFamily: 'SUPPLIER_SELECTION',
      split: 'HELD_OUT',
      seed,
      title: `Supplier Transfer Scenario: Novel Freight Corridor (Scenario ${idx + 1})`,
      description: `Testing freight strategy across Pacific corridor: Congestion=${(congestion * 100).toFixed(0)}%, Buffer=${invDays}d.`,
      context: {
        inventoryDays: invDays,
        dailyDemand: 600,
        orderVolume: 1500,
        portCongestion: congestion,
        weatherDisruption: isChoked,
        budgetLimit: 4000,
        demandVolatility: 0.3,
        priorHistoryHint: 'Novel corridor with uncalibrated Pacific lines.',
      },
      availableActions: [
        { actionId: 'SUPPLIER_PACIFIC_SEA', label: 'Route 100% via Pacific Sea (Standard)', parameters: { mode: 'sea' } },
        { actionId: 'SUPPLIER_AIR_GLOBAL', label: 'Route 100% via Air Global Express', parameters: { mode: 'air' } },
        { actionId: 'HYBRID_CORRIDOR', label: 'Route 50/50 Hybrid Multi-Modal', parameters: { mode: 'hybrid' } },
      ],
      evaluateAction: (actionId) => {
        if (actionId === 'SUPPLIER_PACIFIC_SEA') {
          const delay = isChoked ? 5.2 : 2.1;
          const cost = 1300;
          const stockout = delay > invDays;
          const penalty = stockout ? (delay - invDays) * 2000 : 0;
          return {
            delayDays: delay,
            cost,
            stockoutOccurred: stockout,
            netUtility: 10000 - cost - penalty,
            groundTruthExplanation: isChoked ? 'Pacific Sea line choked under weather & congestion.' : 'Pacific Sea delivered smoothly on time.',
          };
        } else if (actionId === 'SUPPLIER_AIR_GLOBAL') {
          const delay = 1.0;
          const cost = 2100;
          return {
            delayDays: delay,
            cost,
            stockoutOccurred: false,
            netUtility: 10000 - cost,
            groundTruthExplanation: 'Air Global express delivered next day reliably.',
          };
        } else {
          const delay = 1.3;
          const cost = 1700;
          return {
            delayDays: delay,
            cost,
            stockoutOccurred: false,
            netUtility: 10000 - cost,
            groundTruthExplanation: 'Hybrid corridor mitigated sea choke point while saving $400 over pure air.',
          };
        }
      },
      groundTruthOptimalActionId: isChoked ? 'HYBRID_CORRIDOR' : 'SUPPLIER_PACIFIC_SEA',
      optimalNetUtility: isChoked ? 8300 : 8700,
    });
  });

  // =========================================================================
  // FAMILY B: RESOURCE ALLOCATION (12 Tasks: 6 Repeated, 3 Related, 3 Held-Out)
  // Causal Rule:
  // - Allocating emergency buffer stock when demand volatility > 0.35 yields higher net utility than pure cash holding, because stockout penalty ($2000/day) dominates holding cost ($250/day).
  // - When volatility < 0.2, holding inventory incurs unnecessary carrying cost.
  // =========================================================================

  // Repeated Tasks B1 to B6
  const resourceRepeatedSeeds = [401, 402, 403, 404, 405, 406];
  resourceRepeatedSeeds.forEach((seed, idx) => {
    const volatility = 0.45;
    tasks.push({
      taskId: `RES_REP_${idx + 1}`,
      taskFamily: 'RESOURCE_ALLOCATION',
      split: 'REPEATED',
      seed,
      title: `Resource Allocation: High Demand Volatility Buffer (Trial ${idx + 1})`,
      description: `Demand volatility is high at ${(volatility * 100).toFixed(0)}%. Allocate capital between Cash Reserve and Safety Stock Buffer.`,
      context: {
        inventoryDays: 1.5,
        dailyDemand: 450,
        orderVolume: 1000,
        portCongestion: 0.3,
        weatherDisruption: false,
        budgetLimit: 5000,
        demandVolatility: volatility,
      },
      availableActions: [
        { actionId: 'HOLD_MAX_CASH', label: 'Allocate 90% Cash, 10% Safety Buffer', parameters: { cashPct: 0.9, bufferPct: 0.1 } },
        { actionId: 'BALANCED_BUFFER', label: 'Allocate 50% Cash, 50% Safety Buffer', parameters: { cashPct: 0.5, bufferPct: 0.5 } },
        { actionId: 'MAX_SAFETY_BUFFER', label: 'Allocate 15% Cash, 85% Safety Buffer', parameters: { cashPct: 0.15, bufferPct: 0.85 } },
      ],
      evaluateAction: (actionId) => {
        if (actionId === 'HOLD_MAX_CASH') {
          // Demand spike hits with 1.5d inventory -> stockout occurs for 1.8 days
          const penalty = 3600;
          const cost = 200;
          return {
            delayDays: 2.8,
            cost,
            stockoutOccurred: true,
            netUtility: 10000 - cost - penalty,
            groundTruthExplanation: 'High volatility caused unbuffered demand spike, triggering $3600 stockout penalty.',
          };
        } else if (actionId === 'BALANCED_BUFFER') {
          const cost = 650;
          return {
            delayDays: 0.5,
            cost,
            stockoutOccurred: false,
            netUtility: 10000 - cost,
            groundTruthExplanation: 'Balanced safety buffer absorbed the demand spike with optimal capital efficiency.',
          };
        } else {
          const cost = 1200;
          return {
            delayDays: 0.0,
            cost,
            stockoutOccurred: false,
            netUtility: 10000 - cost,
            groundTruthExplanation: 'Excessive buffer absorbed spike but tied up capital with higher holding fees.',
          };
        }
      },
      groundTruthOptimalActionId: 'BALANCED_BUFFER',
      optimalNetUtility: 9350,
    });
  });

  // Related Tasks B7 to B9
  const resourceRelatedSeeds = [501, 502, 503];
  resourceRelatedSeeds.forEach((seed, idx) => {
    const volatility = 0.12; // Stable market
    tasks.push({
      taskId: `RES_REL_${idx + 1}`,
      taskFamily: 'RESOURCE_ALLOCATION',
      split: 'RELATED',
      seed,
      title: `Resource Allocation: Low Volatility Steady State (Trial ${idx + 1})`,
      description: `Market conditions are calm: Volatility=${(volatility * 100).toFixed(0)}%, steady consumption.`,
      context: {
        inventoryDays: 3.0,
        dailyDemand: 300,
        orderVolume: 800,
        portCongestion: 0.1,
        weatherDisruption: false,
        budgetLimit: 5000,
        demandVolatility: volatility,
      },
      availableActions: [
        { actionId: 'HOLD_MAX_CASH', label: 'Allocate 90% Cash, 10% Safety Buffer', parameters: { cashPct: 0.9, bufferPct: 0.1 } },
        { actionId: 'BALANCED_BUFFER', label: 'Allocate 50% Cash, 50% Safety Buffer', parameters: { cashPct: 0.5, bufferPct: 0.5 } },
        { actionId: 'MAX_SAFETY_BUFFER', label: 'Allocate 15% Cash, 85% Safety Buffer', parameters: { cashPct: 0.15, bufferPct: 0.85 } },
      ],
      evaluateAction: (actionId) => {
        if (actionId === 'HOLD_MAX_CASH') {
          const cost = 150;
          return {
            delayDays: 0.0,
            cost,
            stockoutOccurred: false,
            netUtility: 10000 - cost,
            groundTruthExplanation: 'Steady demand allowed lean inventory with minimal carrying costs.',
          };
        } else if (actionId === 'BALANCED_BUFFER') {
          const cost = 600;
          return {
            delayDays: 0.0,
            cost,
            stockoutOccurred: false,
            netUtility: 10000 - cost,
            groundTruthExplanation: 'Unnecessary buffer in calm market increased carrying cost by $450.',
          };
        } else {
          const cost = 1100;
          return {
            delayDays: 0.0,
            cost,
            stockoutOccurred: false,
            netUtility: 10000 - cost,
            groundTruthExplanation: 'Heavy buffer incurred significant idle capital holding penalty.',
          };
        }
      },
      groundTruthOptimalActionId: 'HOLD_MAX_CASH',
      optimalNetUtility: 9850,
    });
  });

  // Held-Out Tasks B10 to B12
  const resourceHeldOutSeeds = [601, 602, 603];
  resourceHeldOutSeeds.forEach((seed, idx) => {
    const isVolatile = idx !== 1;
    const volatility = isVolatile ? 0.52 : 0.08;
    tasks.push({
      taskId: `RES_HELD_${idx + 1}`,
      taskFamily: 'RESOURCE_ALLOCATION',
      split: 'HELD_OUT',
      seed,
      title: `Resource Allocation: Novel Market Liquidity Shock (Scenario ${idx + 1})`,
      description: `Macro environment test: Volatility=${(volatility * 100).toFixed(0)}%, Initial stock=${isVolatile ? 1.2 : 4.5}d.`,
      context: {
        inventoryDays: isVolatile ? 1.2 : 4.5,
        dailyDemand: 700,
        orderVolume: 1400,
        portCongestion: 0.25,
        weatherDisruption: false,
        budgetLimit: 6000,
        demandVolatility: volatility,
      },
      availableActions: [
        { actionId: 'LIQUIDITY_MAX_LEAN', label: 'Maximum Liquidity (Minimal Inventory)', parameters: { mode: 'lean' } },
        { actionId: 'ADAPTIVE_DYNAMIC_HEDGE', label: 'Adaptive Dynamic Volatility Hedge', parameters: { mode: 'adaptive' } },
        { actionId: 'HEAVY_STOCKPILE', label: 'Maximum Stockpile Accumulation', parameters: { mode: 'stockpile' } },
      ],
      evaluateAction: (actionId) => {
        if (actionId === 'LIQUIDITY_MAX_LEAN') {
          if (isVolatile) {
            const cost = 250;
            const penalty = 4200;
            return {
              delayDays: 3.1,
              cost,
              stockoutOccurred: true,
              netUtility: 10000 - cost - penalty,
              groundTruthExplanation: 'Lean setup failed under high volatility shock.',
            };
          } else {
            return {
              delayDays: 0.0,
              cost: 200,
              stockoutOccurred: false,
              netUtility: 9800,
              groundTruthExplanation: 'Lean setup maximized utility in stable environment.',
            };
          }
        } else if (actionId === 'ADAPTIVE_DYNAMIC_HEDGE') {
          return {
            delayDays: 0.0,
            cost: isVolatile ? 750 : 500,
            stockoutOccurred: false,
            netUtility: 10000 - (isVolatile ? 750 : 500),
            groundTruthExplanation: 'Adaptive hedge protected against volatility while avoiding overstocking.',
          };
        } else {
          return {
            delayDays: 0.0,
            cost: 1400,
            stockoutOccurred: false,
            netUtility: 8600,
            groundTruthExplanation: 'Over-stockpiling incurred excessive holding fees.',
          };
        }
      },
      groundTruthOptimalActionId: isVolatile ? 'ADAPTIVE_DYNAMIC_HEDGE' : 'LIQUIDITY_MAX_LEAN',
      optimalNetUtility: isVolatile ? 9250 : 9800,
    });
  });

  // =========================================================================
  // FAMILY C: SEQUENTIAL DECISION MAKING (12 Tasks: 5 Repeated, 4 Related, 3 Held-Out)
  // Causal Rule:
  // - Step 1: Pre-booking logistics capacity in Advance (cost $400) provides 100% guarantee against spot rate surges.
  // - If Storm/Disruption warning is present, Spot market rates surge 4.0x ($2400) or suffer 3-day backlog.
  // - If no disruption, Spot market rate is cheap ($300).
  // =========================================================================

  // Repeated Tasks C1 to C5
  const seqRepeatedSeeds = [701, 702, 703, 704, 705];
  seqRepeatedSeeds.forEach((seed, idx) => {
    const stormWarning = true;
    tasks.push({
      taskId: `SEQ_REP_${idx + 1}`,
      taskFamily: 'SEQUENTIAL_DECISION',
      split: 'REPEATED',
      seed,
      title: `Sequential Decision: Storm Alert Freight Booking (Trial ${idx + 1})`,
      description: `Meteorological alert: Storm disruption warning active. Decide Step 1 freight pre-booking vs Step 2 Spot procurement.`,
      context: {
        inventoryDays: 2.0,
        dailyDemand: 500,
        orderVolume: 1000,
        portCongestion: 0.4,
        weatherDisruption: stormWarning,
        budgetLimit: 4000,
        demandVolatility: 0.2,
      },
      availableActions: [
        { actionId: 'PREBOOK_CAPACITY', label: 'Step 1: Lock Advance Freight Reservation ($450)', parameters: { stage: 'advance' } },
        { actionId: 'DEFER_TO_SPOT', label: 'Step 2: Wait & Buy on Spot Market', parameters: { stage: 'spot' } },
        { actionId: 'CANCEL_SHIPMENT', label: 'Cancel & Forfeit Order', parameters: { stage: 'cancel' } },
      ],
      evaluateAction: (actionId) => {
        if (actionId === 'PREBOOK_CAPACITY') {
          const cost = 450 + 1200; // Freight reservation + standard base order
          return {
            delayDays: 1.0,
            cost,
            stockoutOccurred: false,
            netUtility: 10000 - cost,
            groundTruthExplanation: 'Advance reservation bypassed storm bottlenecks and locked low freight rate.',
          };
        } else if (actionId === 'DEFER_TO_SPOT') {
          const cost = 2400 + 1200; // Spot surge
          const delay = 3.5;
          const penalty = (delay - 2.0) * 1500;
          return {
            delayDays: delay,
            cost,
            stockoutOccurred: true,
            netUtility: 10000 - cost - penalty,
            groundTruthExplanation: 'Spot market was overwhelmed by storm backlog, causing massive cost surge & delay.',
          };
        } else {
          return {
            delayDays: 0.0,
            cost: 0,
            stockoutOccurred: true,
            netUtility: 4000, // Lost business
            groundTruthExplanation: 'Order cancellation lost customer goodwill and demand revenue.',
          };
        }
      },
      groundTruthOptimalActionId: 'PREBOOK_CAPACITY',
      optimalNetUtility: 8350,
    });
  });

  // Related Tasks C6 to C9
  const seqRelatedSeeds = [801, 802, 803, 804];
  seqRelatedSeeds.forEach((seed, idx) => {
    const stormWarning = false; // Clear skies
    tasks.push({
      taskId: `SEQ_REL_${idx + 1}`,
      taskFamily: 'SEQUENTIAL_DECISION',
      split: 'RELATED',
      seed,
      title: `Sequential Decision: Clear Weather Spot Opportunity (Trial ${idx + 1})`,
      description: `Skies are clear with zero meteorological disruption. Evaluate pre-booking fee vs Spot market.`,
      context: {
        inventoryDays: 3.5,
        dailyDemand: 400,
        orderVolume: 900,
        portCongestion: 0.15,
        weatherDisruption: stormWarning,
        budgetLimit: 4000,
        demandVolatility: 0.1,
      },
      availableActions: [
        { actionId: 'PREBOOK_CAPACITY', label: 'Step 1: Lock Advance Freight Reservation ($450)', parameters: { stage: 'advance' } },
        { actionId: 'DEFER_TO_SPOT', label: 'Step 2: Wait & Buy on Spot Market', parameters: { stage: 'spot' } },
        { actionId: 'CANCEL_SHIPMENT', label: 'Cancel & Forfeit Order', parameters: { stage: 'cancel' } },
      ],
      evaluateAction: (actionId) => {
        if (actionId === 'DEFER_TO_SPOT') {
          const cost = 280 + 1100; // Cheap spot rate on clear days
          return {
            delayDays: 1.0,
            cost,
            stockoutOccurred: false,
            netUtility: 10000 - cost,
            groundTruthExplanation: 'Clear weather allowed snagging low spot rates ($280) without pre-booking fee.',
          };
        } else if (actionId === 'PREBOOK_CAPACITY') {
          const cost = 450 + 1100;
          return {
            delayDays: 1.0,
            cost,
            stockoutOccurred: false,
            netUtility: 10000 - cost,
            groundTruthExplanation: 'Pre-booking was reliable but paid $170 insurance premium on a clear day.',
          };
        } else {
          return {
            delayDays: 0.0,
            cost: 0,
            stockoutOccurred: true,
            netUtility: 4000,
            groundTruthExplanation: 'Cancellation lost legitimate business.',
          };
        }
      },
      groundTruthOptimalActionId: 'DEFER_TO_SPOT',
      optimalNetUtility: 8620,
    });
  });

  // Held-Out Tasks C10 to C12
  const seqHeldOutSeeds = [901, 902, 903];
  seqHeldOutSeeds.forEach((seed, idx) => {
    const isDisrupted = idx !== 1;
    tasks.push({
      taskId: `SEQ_HELD_${idx + 1}`,
      taskFamily: 'SEQUENTIAL_DECISION',
      split: 'HELD_OUT',
      seed,
      title: `Sequential Decision: Novel Transit Corridor Weather Hedge (Scenario ${idx + 1})`,
      description: `Novel transatlantic corridor. Early warning signal: Disruption Risk=${isDisrupted ? 'HIGH (80%)' : 'LOW (5%)'}.`,
      context: {
        inventoryDays: isDisrupted ? 1.8 : 4.0,
        dailyDemand: 550,
        orderVolume: 1100,
        portCongestion: isDisrupted ? 0.6 : 0.1,
        weatherDisruption: isDisrupted,
        budgetLimit: 5000,
        demandVolatility: 0.25,
      },
      availableActions: [
        { actionId: 'STRUCTURED_FORWARD_CONTRACT', label: 'Execute Forward Capacity Lock ($500)', parameters: { hedge: true } },
        { actionId: 'FLEX_SPOT_DISPATCH', label: 'Execute Flexible On-Demand Spot Dispatch', parameters: { hedge: false } },
      ],
      evaluateAction: (actionId) => {
        if (actionId === 'STRUCTURED_FORWARD_CONTRACT') {
          const cost = 500 + 1300;
          return {
            delayDays: 1.1,
            cost,
            stockoutOccurred: false,
            netUtility: 10000 - cost,
            groundTruthExplanation: 'Forward contract insulated business from high transit volatility.',
          };
        } else {
          if (isDisrupted) {
            const cost = 2800 + 1300;
            const delay = 4.0;
            const penalty = (delay - 1.8) * 1600;
            return {
              delayDays: delay,
              cost,
              stockoutOccurred: true,
              netUtility: 10000 - cost - penalty,
              groundTruthExplanation: 'Spot dispatch was stranded in storm disruption, incurring massive penalty.',
            };
          } else {
            const cost = 300 + 1200;
            return {
              delayDays: 1.0,
              cost,
              stockoutOccurred: false,
              netUtility: 10000 - cost,
              groundTruthExplanation: 'Calm conditions allowed cheap spot dispatch.',
            };
          }
        }
      },
      groundTruthOptimalActionId: isDisrupted ? 'STRUCTURED_FORWARD_CONTRACT' : 'FLEX_SPOT_DISPATCH',
      optimalNetUtility: isDisrupted ? 8200 : 8500,
    });
  });

  return tasks;
}
