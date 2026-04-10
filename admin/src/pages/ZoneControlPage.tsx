import { useState, useEffect } from 'react';
import { MapPin, Users, TrendingUp, Clock, Zap, Send, Target, RefreshCw, AlertTriangle, ArrowUpRight, Settings } from 'lucide-react';
import { adminAPI } from '../services/api';

interface Zone {
  id: string;
  name: string;
  city: string;
  supply: number;
  demand: number;
  ratio: number;
  avgETA: number;
  conversion: number;
  surgeMultiplier: number;
  isActive: boolean;
  onlineProviders: number;
  pendingQuotes: number;
}

const getRatioColor = (ratio: number) => {
  if (ratio > 3) return 'text-red-400 bg-red-500/20';
  if (ratio > 2) return 'text-orange-400 bg-orange-500/20';
  if (ratio > 1.5) return 'text-yellow-400 bg-yellow-500/20';
  return 'text-green-400 bg-green-500/20';
};

const getRatioStatus = (ratio: number) => {
  if (ratio > 3) return 'CRITICAL';
  if (ratio > 2) return 'HIGH';
  if (ratio > 1.5) return 'MODERATE';
  return 'NORMAL';
};

export default function ZoneControlPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);

  const loadZones = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getZonesControl();
      setZones(res.data.zones || []);
    } catch (err) {
      console.error('Failed to load zones:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadZones();
    const interval = setInterval(loadZones, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleZoneAction = async (zoneId: string, action: string) => {
    setActionLoading(`${zoneId}-${action}`);
    try {
      await adminAPI.executeZoneAction(zoneId, action);      loadZones();
    } catch (err) {
      console.error('Zone action failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Summary stats
  const totalSupply = zones.reduce((sum, z) => sum + z.supply, 0);
  const totalDemand = zones.reduce((sum, z) => sum + z.demand, 0);
  const avgRatio = zones.length > 0 ? zones.reduce((sum, z) => sum + z.ratio, 0) / zones.length : 0;
  const criticalZones = zones.filter(z => z.ratio > 3).length;

  return (
    <div className="p-6 bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/20 rounded-lg">
            <MapPin className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Zone Control</h1>
            <p className="text-sm text-slate-400">Город как RTS — управление в реальном времени</p>
          </div>
        </div>
        
        <button
          onClick={loadZones}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Обновить
        </button>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <Users className="w-4 h-4" />
            <span className="text-sm">Total Supply</span>
          </div>
          <span className="text-2xl font-bold text-white">{totalSupply}</span>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <Target className="w-4 h-4" />
            <span className="text-sm">Total Demand</span>
          </div>
          <span className="text-2xl font-bold text-white">{totalDemand}</span>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">Avg Ratio</span>
          </div>
          <span className={`text-2xl font-bold ${avgRatio > 2 ? 'text-orange-400' : 'text-green-400'}`}>
            {avgRatio.toFixed(1)}
          </span>
        </div>
        <div className={`rounded-xl p-4 border ${criticalZones > 0 ? 'bg-red-500/10 border-red-500/30' : 'bg-slate-800 border-slate-700'}`}>
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <AlertTriangle className={`w-4 h-4 ${criticalZones > 0 ? 'text-red-400' : ''}`} />
            <span className="text-sm">Critical Zones</span>
          </div>
          <span className={`text-2xl font-bold ${criticalZones > 0 ? 'text-red-400' : 'text-white'}`}>
            {criticalZones}
          </span>
        </div>
      </div>

      {/* Zones Grid */}
      <div className="grid grid-cols-3 gap-4">
        {loading && zones.length === 0 ? (
          <div className="col-span-3 bg-slate-800 border border-slate-700 rounded-xl p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto"></div>
            <p className="text-slate-400 mt-2">Загрузка зон...</p>
          </div>
        ) : zones.length === 0 ? (
          <div className="col-span-3 bg-slate-800 border border-slate-700 rounded-xl p-8 text-center">
            <MapPin className="w-12 h-12 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400">Нет активных зон</p>
          </div>
        ) : (
          zones.map((zone) => {
            const ratioColor = getRatioColor(zone.ratio);
            const ratioStatus = getRatioStatus(zone.ratio);
            
            return (
              <div
                key={zone.id}
                className={`bg-slate-800 border rounded-xl p-4 transition-colors ${
                  zone.ratio > 3 ? 'border-red-500/50' : 
                  zone.ratio > 2 ? 'border-orange-500/50' : 'border-slate-700'
                }`}
              >
                {/* Zone Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-semibold">{zone.name}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${ratioColor}`}>
                        {ratioStatus}
                      </span>
                    </div>
                    <p className="text-slate-500 text-sm">{zone.city}</p>
                  </div>
                  {zone.surgeMultiplier > 1 && (
                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-sm font-medium">
                      {zone.surgeMultiplier}x Surge
                    </span>
                  )}
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-slate-700/50 rounded-lg p-2">
                    <p className="text-xs text-slate-400">Demand</p>
                    <p className="text-xl font-bold text-white">{zone.demand}</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-2">
                    <p className="text-xs text-slate-400">Supply</p>
                    <p className="text-xl font-bold text-white">{zone.supply}</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-2">
                    <p className="text-xs text-slate-400">Ratio</p>
                    <p className={`text-xl font-bold ${zone.ratio > 2 ? 'text-orange-400' : 'text-green-400'}`}>
                      {zone.ratio.toFixed(1)}
                    </p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-2">
                    <p className="text-xs text-slate-400">Avg ETA</p>
                    <p className={`text-xl font-bold ${zone.avgETA > 30 ? 'text-orange-400' : 'text-white'}`}>
                      {zone.avgETA}m
                    </p>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="flex items-center justify-between text-sm mb-4">
                  <span className="text-slate-400">
                    <span className="text-green-400">{zone.onlineProviders}</span> online
                  </span>
                  <span className="text-slate-400">
                    <span className="text-cyan-400">{zone.pendingQuotes}</span> pending
                  </span>
                  <span className="text-slate-400">
                    Conv: <span className={zone.conversion > 60 ? 'text-green-400' : 'text-orange-400'}>{zone.conversion}%</span>
                  </span>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleZoneAction(zone.id, 'boost_supply')}
                    disabled={actionLoading !== null}
                    className="flex items-center justify-center gap-1 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Zap className="w-4 h-4" />
                    Boost Supply
                  </button>
                  <button
                    onClick={() => handleZoneAction(zone.id, 'send_push')}
                    disabled={actionLoading !== null}
                    className="flex items-center justify-center gap-1 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    Send Push
                  </button>
                  <button
                    onClick={() => handleZoneAction(zone.id, 'increase_surge')}
                    disabled={actionLoading !== null}
                    className="flex items-center justify-center gap-1 px-3 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg text-sm font-medium transition-colors"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    +Surge
                  </button>
                  <button
                    onClick={() => handleZoneAction(zone.id, 'expand_radius')}
                    disabled={actionLoading !== null}
                    className="flex items-center justify-center gap-1 px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-sm font-medium transition-colors"
                  >
                    <Target className="w-4 h-4" />
                    Expand
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
