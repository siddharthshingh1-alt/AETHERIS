import React from 'react';
import { 
  Building2, 
  DollarSign, 
  Package, 
  Truck, 
  AlertTriangle, 
  CloudRain, 
  Ship, 
  Zap, 
  Activity,
  Sliders,
  Flame
} from 'lucide-react';
import { EnvironmentState } from '../types/cognitive';

interface EnvironmentViewProps {
  environment: EnvironmentState;
  onUpdateEnvironment: (updated: Partial<EnvironmentState>) => void;
}

export const EnvironmentView: React.FC<EnvironmentViewProps> = ({
  environment,
  onUpdateEnvironment
}) => {
  const runwayDays = environment.inventoryUnits / (environment.productionCapacity || 40);

  return (
    <div id="environment-view" className="bg-[#060b14]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-[0_4px_24px_rgba(0,0,0,0.5)] space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-emerald-400" />
          <h2 className="text-xs font-bold tracking-widest text-white uppercase font-mono">
            Virtual Business Sandbox Environment (Section 70-71)
          </h2>
        </div>
        <div className="flex items-center gap-2 font-mono">
          <span className="text-[11px] text-slate-400">Market Volatility:</span>
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
            environment.marketVolatility === 'CHAOTIC' ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30 shadow-[0_0_8px_rgba(244,63,94,0.3)]' :
            environment.marketVolatility === 'HIGH' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' :
            'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-[0_0_8px_rgba(52,211,153,0.3)]'
          }`}>
            {environment.marketVolatility}
          </span>
        </div>
      </div>

      {/* Operational Key Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-black/40 border border-white/[0.08] rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-mono">
            <span>Liquid Capital</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-base sm:text-lg font-mono font-bold text-white">
            ${environment.cash.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Operational Reserves</span>
        </div>

        <div className="p-3.5 bg-black/40 border border-white/[0.08] rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-mono">
            <span>Warehouse Buffer</span>
            <Package className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-base sm:text-lg font-mono font-bold text-white">
            {environment.inventoryUnits} <span className="text-xs text-slate-400 font-normal">units</span>
          </div>
          <span className={`text-[10px] font-mono font-medium ${runwayDays < 2.0 ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
            ~{runwayDays.toFixed(1)} days production runway
          </span>
        </div>

        <div className="p-3.5 bg-black/40 border border-white/[0.08] rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-mono">
            <span>Assembly Consumption</span>
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-base sm:text-lg font-mono font-bold text-white">
            {environment.productionCapacity} <span className="text-xs text-slate-400 font-normal">u/day</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Target Throughput</span>
        </div>

        <div className="p-3.5 bg-black/40 border border-white/[0.08] rounded-xl">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 font-mono">
            <span>Active In-Transit</span>
            <Truck className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-base sm:text-lg font-mono font-bold text-white">
            {environment.pendingOrders.length} <span className="text-xs text-slate-400 font-normal">shipments</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Delivery pipeline</span>
        </div>
      </div>

      {/* Interactive Environmental Perturbation & Shock Injector */}
      <div className="p-4 bg-black/40 border border-white/[0.08] rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-mono">
            <Flame className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Environmental Perturbation & Shock Injector
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Inject unexpected conditions to test predictive learning loop</span>
        </div>

        {/* Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Supplier Alpha Strike */}
          <button
            id="toggle-supplier-strike"
            onClick={() => onUpdateEnvironment({ supplierStrike: !environment.supplierStrike })}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              environment.supplierStrike 
                ? 'bg-rose-950/40 border-rose-500/60 text-rose-200 ring-1 ring-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.2)]' 
                : 'bg-white/[0.02] border-white/[0.08] text-slate-300 hover:border-white/20'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold font-mono">Supplier Alpha Strike</span>
              <AlertTriangle className={`w-3.5 h-3.5 ${environment.supplierStrike ? 'text-rose-400 animate-bounce' : 'text-slate-500'}`} />
            </div>
            <span className="text-[10px] text-slate-400 mt-1">
              {environment.supplierStrike ? 'Active labor strike (+4.5d delay)' : 'Nominal factory operations'}
            </span>
          </button>

          {/* Port Congestion Slider */}
          <div className="p-3 bg-white/[0.02] border border-white/[0.08] rounded-xl space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1 font-mono">
                <Ship className="w-3.5 h-3.5 text-cyan-400" /> Port Congestion
              </span>
              <span className="font-mono text-[11px] font-bold text-cyan-300">
                {(environment.portCongestionLevel * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={environment.portCongestionLevel}
              onChange={(e) => onUpdateEnvironment({ portCongestionLevel: Number(e.target.value) })}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>

          {/* Weather Disruption */}
          <button
            id="toggle-weather-disruption"
            onClick={() => onUpdateEnvironment({ weatherDisruption: !environment.weatherDisruption })}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
              environment.weatherDisruption 
                ? 'bg-sky-950/40 border-sky-500/60 text-sky-200 ring-1 ring-sky-500/40 shadow-[0_0_12px_rgba(56,189,248,0.2)]' 
                : 'bg-white/[0.02] border-white/[0.08] text-slate-300 hover:border-white/20'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold font-mono">Maritime Weather Storm</span>
              <CloudRain className={`w-3.5 h-3.5 ${environment.weatherDisruption ? 'text-sky-400' : 'text-slate-500'}`} />
            </div>
            <span className="text-[10px] text-slate-400 mt-1">
              {environment.weatherDisruption ? 'Severe storm active (+1.8d delay)' : 'Calm maritime corridors'}
            </span>
          </button>

          {/* Volatility Setting */}
          <div className="p-3 bg-white/[0.02] border border-white/[0.08] rounded-xl space-y-1">
            <div className="text-xs font-semibold text-slate-300 font-mono">Market Volatility Mode</div>
            <div className="flex gap-1 pt-0.5">
              {(['LOW', 'NORMAL', 'HIGH', 'CHAOTIC'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => onUpdateEnvironment({ marketVolatility: v })}
                  className={`flex-1 py-1 rounded-md text-[10px] font-mono transition-all cursor-pointer ${
                    environment.marketVolatility === v ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold shadow-[0_0_8px_rgba(6,182,212,0.3)]' : 'bg-black/40 text-slate-400 hover:text-slate-200 border border-white/[0.04]'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
