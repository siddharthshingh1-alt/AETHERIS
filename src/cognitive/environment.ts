import { EnvironmentState, ActionRecord, ActualOutcome } from '../types/cognitive';

export function createInitialEnvironment(): EnvironmentState {
  return {
    cycle: 1,
    cash: 25000,
    inventoryUnits: 120,
    pendingOrders: [],
    customerDemandRate: 40,
    productionCapacity: 40,
    marketVolatility: 'NORMAL',
    weatherDisruption: false,
    supplierStrike: false,
    portCongestionLevel: 0.20
  };
}

export function executeActionInEnvironment(
  action: ActionRecord,
  envState: EnvironmentState
): { updatedEnv: EnvironmentState; outcome: ActualOutcome } {
  const units = action.parameters.units || 100;
  const cost = action.cost;
  const isAlpha = action.targetEntityId === 'supplier_alpha';
  const isBeta = action.targetEntityId === 'supplier_beta';
  const isGamma = action.targetEntityId === 'supplier_gamma';
  const isSplit = action.type === 'DUAL_SOURCE_SPLIT';

  let realDelayDays = 0;
  let status: 'SUCCESS' | 'DELAYED' | 'FAILED' | 'PARTIAL' = 'SUCCESS';
  const notesArr: string[] = [];

  if (isSplit) {
    // 60% Alpha, 40% Beta
    // Beta part arrives in 2.0 days
    // Alpha part may be delayed if volume/congestion exists
    if (units > 100) {
      realDelayDays += 1.2;
      notesArr.push('Alpha portion experienced minor batch queue latency (+1.2d); Beta portion arrived on schedule at 48h.');
      status = 'PARTIAL';
    } else {
      notesArr.push('Dual split succeeded: Beta expedited tranche arrived in 2.0d; Alpha arrived in 3.0d.');
      status = 'SUCCESS';
    }
  } else if (isAlpha) {
    // Alpha has hidden non-linear volume queue delay
    if (units > 80) {
      const volumePenalty = ((units - 80) / 40) * 2.8 + 1.2;
      realDelayDays += volumePenalty;
      notesArr.push(`Alpha production line bottlenecked by high volume (${units} units). Added +${volumePenalty.toFixed(1)}d queue delay.`);
      status = 'DELAYED';
    }
    if (envState.supplierStrike) {
      realDelayDays += 4.5;
      notesArr.push('Alpha facility under regional labor strike (+4.5d delay).');
      status = 'DELAYED';
    }
    if (envState.portCongestionLevel > 0.35) {
      const portDelay = envState.portCongestionLevel * 2.5;
      realDelayDays += portDelay;
      notesArr.push(`Ocean freight held up in port customs queue (+${portDelay.toFixed(1)}d delay).`);
      status = 'DELAYED';
    }
    if (envState.weatherDisruption) {
      realDelayDays += 1.8;
      notesArr.push('Severe maritime storm slowed sea transit (+1.8d delay).');
      status = 'DELAYED';
    }
  } else if (isBeta) {
    // Beta is highly reliable
    realDelayDays = 0;
    notesArr.push('Beta executed rapid delivery SLA precisely in 2.0 days with dedicated express freight.');
    status = 'SUCCESS';
  } else if (isGamma) {
    if (units > 90) {
      realDelayDays += 1.0;
      notesArr.push('Gamma regional shop experienced slight batch backlog (+1.0d delay).');
      status = 'DELAYED';
    } else {
      notesArr.push('Gamma delivered locally in 2.5 days via ground fleet.');
      status = 'SUCCESS';
    }
  }

  // Daily burn
  const burnUnits = envState.productionCapacity;
  const newCash = Math.max(0, envState.cash - cost + (burnUnits * 65)); // revenue from produced goods
  const inventoryConsumed = Math.min(envState.inventoryUnits, burnUnits * (realDelayDays > 0 ? (3 + realDelayDays) : 3));
  const newInventory = Math.max(0, envState.inventoryUnits - inventoryConsumed + units);

  const customerSat = realDelayDays > 2.5 ? 0.65 : (realDelayDays > 1.0 ? 0.84 : 0.98);

  const outcome: ActualOutcome = {
    actionId: action.id,
    actualDelayDays: Math.round(realDelayDays * 10) / 10,
    actualCost: cost,
    actualInventoryDelta: units - inventoryConsumed,
    actualCashDelta: newCash - envState.cash,
    actualCustomerSatisfaction: customerSat,
    status,
    notes: notesArr.length > 0 ? notesArr.join(' ') : 'Delivery fulfilled normally.'
  };

  const updatedEnv: EnvironmentState = {
    ...envState,
    cycle: envState.cycle + 1,
    cash: Math.round(newCash),
    inventoryUnits: Math.round(newInventory),
    pendingOrders: [
      ...envState.pendingOrders.slice(-5),
      {
        id: `ord_${Date.now()}`,
        supplierId: action.targetEntityId,
        units,
        unitCost: action.parameters.unitCost || 50,
        orderCycle: envState.cycle,
        expectedDeliveryCycle: envState.cycle + 3,
        actualDeliveryCycle: envState.cycle + 3 + Math.ceil(realDelayDays),
        status: status === 'DELAYED' ? 'IN_TRANSIT' : 'DELIVERED'
      }
    ]
  };

  return { updatedEnv, outcome };
}
