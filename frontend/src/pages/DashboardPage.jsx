import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sprout, TestTube2, Ruler, Wheat, Clock, FileText, CheckCircle2, ChevronRight, Grid
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import api from '../services/api';
import GisMap from '../components/GisMap';
import PlotGridCanvas from '../components/PlotGridCanvas';

export default function DashboardPage() {
  const [plots, setPlots] = useState([]);
  const [selectedPlotId, setSelectedPlotId] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('map');
  const navigate = useNavigate();

  const fetchDashboardData = async (plotId) => {
    setLoading(true);
    try {
      const res = await api.get(`/dashboard/plots/${plotId}`);
      setData(res.data);
    } catch (err) {
      console.error('Error fetching dashboard summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchPlots = async () => {
      try {
        const res = await api.get('/plots');
        setPlots(res.data);
        if (res.data.length > 0) {
          const e4a = res.data.find(p => p.plot_code?.toUpperCase() === 'E4A');
          const defaultPlot = e4a || res.data[0];
          setSelectedPlotId(defaultPlot.id);
          fetchDashboardData(defaultPlot.id);
        }
      } catch (err) {
        console.error('Error fetching plots:', err);
        fetchDashboardData(1);
      }
    };
    fetchPlots();
  }, []);

  const handlePlotChange = (e) => {
    const id = parseInt(e.target.value);
    setSelectedPlotId(id);
    fetchDashboardData(id);
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64 text-xs text-slate-500">
        Loading Plot Dashboard...
      </div>
    );
  }

  const { plot, trial, layout, harvest, varieties, timeline } = data || {};

  // Color palette for Recharts
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#f43f5e'];

  // Formatted data for variety distribution chart
  const varietyChartData = varieties?.map(v => ({
    name: v.code,
    fullName: v.name,
    value: 1
  })) || [];

  return (
    <div className="space-y-6">
      {/* Top Banner Header with Plot Switcher */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center relative overflow-hidden">
        <div className="space-y-1 z-10">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 uppercase">
              Paddy Breeding Station
            </span>
            <span className="text-slate-400 text-xs">• Block E</span>
          </div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            Plot {plot?.plot_code || 'Plot'} Master Dashboard
          </h1>
          <p className="text-xs text-slate-300">
            Field Dimensions: North: {plot?.north_length_m}m | East: {plot?.east_length_m}m | West: {plot?.west_length_m}m | South: {plot?.south_length_m}m
          </p>
        </div>

        <div className="mt-4 md:mt-0 flex flex-wrap items-center gap-2 z-10">
          {/* Plot Switcher Dropdown */}
          <div className="flex items-center space-x-1.5 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-xs">
            <Grid className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400 font-semibold">Plot:</span>
            <select
              value={selectedPlotId}
              onChange={handlePlotChange}
              className="bg-transparent font-bold text-white focus:outline-none cursor-pointer"
            >
              {plots.map(p => (
                <option key={p.id} value={p.id} className="bg-slate-800 text-white">
                  {p.plot_code} - {p.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => navigate('/designer')}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-lg transition flex items-center gap-1.5 cursor-pointer"
          >
            <Ruler className="w-3.5 h-3.5" /> Design Layout
          </button>
          <button
            onClick={() => navigate('/reports')}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" /> Export Report
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Plot Status */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Plot Status</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-extrabold text-slate-800">{plot?.status || 'Planned'}</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
              {plot?.geometry_source || 'Prototype'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Field Note: {plot?.additional_measurement_value} {plot?.additional_measurement_unit}
          </p>
        </div>

        {/* Card 2: Active Trial */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Active Breeding Trial</span>
            <TestTube2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-sm font-bold text-slate-800 truncate">
            {trial?.name || 'No Active Trial'}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Design: <b className="text-slate-700">{trial?.design_type || 'RBD'}</b></span>
            <span>Season: <b className="text-slate-700">{trial?.season || 'Kharif'}</b></span>
          </div>
        </div>

        {/* Card 3: Layout Version */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Layout Version</span>
            <Ruler className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-extrabold text-slate-800">
              Version {layout?.version_number || 1}
            </span>
            <span className="text-xs text-slate-500">{layout?.num_rows || 15} Rows</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Spacing: {layout?.row_spacing_cm || 20}cm x {layout?.plant_spacing_cm || 15}cm
          </p>
        </div>

        {/* Card 4: Harvest Total */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Recorded Yield</span>
            <Wheat className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-extrabold text-slate-800">
              {harvest?.total_yield_kg || 0} <span className="text-xs font-normal">kg</span>
            </span>
            <span className="text-xs text-amber-700 font-bold">{harvest?.records_count || 0} batches</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Avg Moisture: {harvest?.avg_moisture_pct || 0}%
          </p>
        </div>
      </div>

      {/* Main Content Split (Map / Grid Visualizer + Variety Breakdown) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: GIS Map / Grid Visualizer Tabbed Panel */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setActiveTab('map')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeTab === 'map'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Interactive GIS Field Map
              </button>
              <button
                onClick={() => setActiveTab('grid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeTab === 'grid'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Dynamic Planting Grid
              </button>
            </div>
            
            <button
              onClick={() => navigate(activeTab === 'map' ? '/gis' : '/designer')}
              className="text-xs text-emerald-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              Open Full View <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {activeTab === 'map' ? (
            <GisMap plotId={selectedPlotId} showGridOverlay={true} />
          ) : (
            <PlotGridCanvas layoutData={layout?.grid_summary ? { summary: layout.grid_summary, rows_grid: [] } : null} />
          )}
        </div>

        {/* Right Column: Variety Distribution & Lifecycle History */}
        <div className="space-y-6">
          {/* Variety Distribution Pie Chart */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center justify-between">
              <span>Trial Variety Entries ({varieties?.length || 0})</span>
              <Sprout className="w-4 h-4 text-emerald-600" />
            </h3>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={varietyChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {varietyChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-1.5 border-t pt-2">
              {varieties?.map((v, i) => (
                <div key={v.code} className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 truncate">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                    <span className="font-bold text-slate-800">{v.code}</span>
                    <span className="text-slate-500 truncate">({v.name})</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{v.duration} days</span>
                </div>
              ))}
            </div>
          </div>

          {/* Plot Status Lifecycle Timeline */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center justify-between">
              <span>Status History</span>
              <Clock className="w-4 h-4 text-slate-400" />
            </h3>

            <div className="space-y-3 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {timeline?.map((item, idx) => (
                <div key={idx} className="flex items-start space-x-3 text-xs relative pl-6">
                  <span className="absolute left-0 top-1 w-4 h-4 rounded-full bg-emerald-600 border-2 border-white shadow-sm flex items-center justify-center text-white">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                  </span>
                  <div>
                    <div className="font-bold text-slate-800">{item.status}</div>
                    <p className="text-[11px] text-slate-500">{item.notes}</p>
                    <span className="text-[10px] text-slate-400 font-mono">{item.date} • {item.changed_by}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
