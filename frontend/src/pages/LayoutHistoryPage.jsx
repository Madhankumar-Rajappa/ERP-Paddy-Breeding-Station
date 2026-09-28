import React, { useState, useEffect } from 'react';
import { History, Grid } from 'lucide-react';
import api from '../services/api';

export default function LayoutHistoryPage() {
  const [plots, setPlots] = useState([]);
  const [selectedPlotId, setSelectedPlotId] = useState(1);
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [layouts, setLayouts] = useState([]);
  const [selectedLayout, setSelectedLayout] = useState(null);

  const fetchLayouts = async (plotId) => {
    try {
      const res = await api.get(`/layouts/plots/${plotId}`);
      setLayouts(res.data);
      if (res.data.length > 0) {
        setSelectedLayout(res.data[0]);
      } else {
        setSelectedLayout(null);
      }
    } catch (err) {
      console.error('Error fetching layouts:', err);
    }
  };

  const fetchPlots = async () => {
    try {
      const res = await api.get('/plots');
      setPlots(res.data);
      if (res.data.length > 0) {
        setSelectedPlotId(res.data[0].id);
        setSelectedPlot(res.data[0]);
        fetchLayouts(res.data[0].id);
      }
    } catch (err) {
      console.error('Error fetching plots for layout history:', err);
    }
  };

  useEffect(() => {
    fetchPlots();
  }, []);

  const handlePlotChange = (e) => {
    const id = parseInt(e.target.value);
    setSelectedPlotId(id);
    const p = plots.find(item => item.id === id);
    setSelectedPlot(p || null);
    fetchLayouts(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-600" /> Layout Version History ({selectedPlot?.plot_code || 'Plot'})
          </h1>
          <p className="text-xs text-slate-500">
            Saved version history of planting grids. Parameters & randomization seeds are persisted to guarantee reproducibility.
          </p>
        </div>

        {/* Dynamic Plot Selector */}
        <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm text-xs">
          <Grid className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold text-slate-700">Select Plot:</span>
          <select
            value={selectedPlotId}
            onChange={handlePlotChange}
            className="font-bold text-emerald-900 bg-transparent focus:outline-none cursor-pointer"
          >
            {plots.map(p => (
              <option key={p.id} value={p.id}>{p.plot_code} - {p.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Version List Sidebar */}
        <div className="space-y-2">
          {layouts.length === 0 ? (
            <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs text-slate-400 text-center">
              No saved layout versions found for this plot.
            </div>
          ) : (
            layouts.map((l) => (
              <div
                key={l.id}
                onClick={() => setSelectedLayout(l)}
                className={`p-4 rounded-xl border cursor-pointer transition ${
                  selectedLayout?.id === l.id
                    ? 'bg-emerald-950 text-white border-emerald-600 shadow-md'
                    : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">Layout Version {l.version_number}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${l.status === 'Active' ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                    {l.status}
                  </span>
                </div>
                <p className="text-xs mt-1 text-slate-400">
                  Created: {new Date(l.created_at).toLocaleDateString()} by {l.created_by || 'Researcher'}
                </p>
                <div className="mt-2 text-[11px] font-mono opacity-80">
                  Design: {l.design_type} | Spacing: {l.row_spacing_cm}cm x {l.plant_spacing_cm}cm
                </div>
              </div>
            ))
          )}
        </div>

        {/* Selected Version Detail View */}
        {selectedLayout && (
          <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">Layout Version {selectedLayout.version_number} Specifications</h3>
              <span className="font-mono text-xs bg-slate-100 px-2.5 py-1 rounded text-slate-700 font-bold">
                RBD Seed #{selectedLayout.randomization_seed}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 font-mono text-slate-700">
              <div>Design Type: <b>{selectedLayout.design_type}</b></div>
              <div>Number of Rows: <b>{selectedLayout.num_rows}</b></div>
              <div>Row Spacing: <b>{selectedLayout.row_spacing_cm} cm</b></div>
              <div>Plant Spacing: <b>{selectedLayout.plant_spacing_cm} cm</b></div>
              <div>Border Buffer: <b>{selectedLayout.border_buffer_m} m</b></div>
              <div>Pathway Width: <b>{selectedLayout.pathway_width_m} m</b></div>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-950 font-medium">
              This layout configuration is saved in the database. Opening it reproduces the exact same randomization grid.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
