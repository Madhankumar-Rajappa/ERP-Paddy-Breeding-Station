import React, { useState, useEffect } from 'react';
import { Ruler, Play, Save, Info, Grid } from 'lucide-react';
import api from '../services/api';
import PlotGridCanvas from '../components/PlotGridCanvas';

export default function PlotDesignerPage() {
  const [plots, setPlots] = useState([]);
  const [selectedPlotId, setSelectedPlotId] = useState(1);
  const [plot, setPlot] = useState(null);
  const [trials, setTrials] = useState([]);
  const [selectedTrialId, setSelectedTrialId] = useState(1);
  const [generatedLayout, setGeneratedLayout] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [form, setForm] = useState({
    num_rows: 15,
    row_spacing_cm: 20.0,
    plant_spacing_cm: 15.0,
    border_buffer_m: 0.5,
    pathway_width_m: 0.5,
    design_type: 'RBD',
    num_entries: 5,
    num_replications: 3,
    randomization_seed: 42
  });

  const fetchInitialData = async () => {
    try {
      const [plotsRes, trialsRes] = await Promise.all([api.get('/plots'), api.get('/trials')]);
      setPlots(plotsRes.data);
      setTrials(trialsRes.data);
      if (plotsRes.data.length > 0) {
        setSelectedPlotId(plotsRes.data[0].id);
        setPlot(plotsRes.data[0]);
      }
      if (trialsRes.data.length > 0) {
        setSelectedTrialId(trialsRes.data[0].id);
        setForm(prev => ({
          ...prev,
          num_entries: trialsRes.data[0].num_entries,
          num_replications: trialsRes.data[0].num_replications
        }));
      }
    } catch (err) {
      console.error('Error fetching initial data for designer:', err);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handlePlotChange = (e) => {
    const pId = parseInt(e.target.value);
    setSelectedPlotId(pId);
    const found = plots.find(p => p.id === pId);
    if (found) {
      setPlot(found);
    }
    // Filter trials for this plot if available, or keep first
    const plotTrials = trials.filter(t => t.plot_id === pId);
    if (plotTrials.length > 0) {
      setSelectedTrialId(plotTrials[0].id);
      setForm(prev => ({
        ...prev,
        num_entries: plotTrials[0].num_entries,
        num_replications: plotTrials[0].num_replications
      }));
    }
  };

  const handleGenerate = async (e) => {
    if (e) e.preventDefault();
    if (!plot) return;
    setLoading(true);
    setMessage('');
    try {
      const res = await api.post('/layouts/generate', {
        plot_id: selectedPlotId,
        trial_id: selectedTrialId,
        ...form
      });
      setGeneratedLayout(res.data);
      setMessage(`Layout generated successfully for Plot ${plot.plot_code}! Review the spatial grid below.`);
    } catch (err) {
      console.error(err);
      setMessage('Failed to generate layout. Please verify parameters.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVersion = async () => {
    if (!plot) return;
    try {
      const res = await api.post('/layouts', {
        plot_id: selectedPlotId,
        trial_id: selectedTrialId,
        ...form
      });
      setMessage(`Layout saved as Version ${res.data.version_number} for Plot ${plot.plot_code}!`);
    } catch (err) {
      console.error(err);
      setMessage('Failed to save layout version.');
    }
  };

  // Live Calculations Preview
  const avgWidth = plot ? (plot.south_length_m + plot.north_length_m) / 2.0 : 35.4;
  const avgLength = plot ? (plot.west_length_m + plot.east_length_m) / 2.0 : 30.6;
  const usableWidth = Math.max(1, avgWidth - 2 * form.border_buffer_m);
  const usableLength = Math.max(1, avgLength - 2 * form.border_buffer_m);
  
  const estimatedMaxRows = Math.floor(usableLength / (form.row_spacing_cm / 100.0));
  const estimatedPlantsPerRow = Math.floor(usableWidth / (form.plant_spacing_cm / 100.0));

  return (
    <div className="space-y-6">
      {/* Title & Plot Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Ruler className="w-5 h-5 text-emerald-600" /> Dynamic Plot Design Engine ({plot?.plot_code || 'Plot'})
          </h1>
          <p className="text-xs text-slate-500">
            Configure plot dimensions, spacing, and RBD randomization to dynamically generate plant positions clipped inside {plot?.plot_code || 'the plot'}.
          </p>
        </div>

        {/* Dynamic Plot Switcher */}
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

      {/* Form Controls & Real-time Calculations Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <form onSubmit={handleGenerate} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Target Trial</label>
              <select
                value={selectedTrialId}
                onChange={(e) => setSelectedTrialId(parseInt(e.target.value))}
                className="w-full p-2 border rounded-lg bg-slate-50 font-bold text-emerald-900"
              >
                {trials.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.design_type})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Experimental Design</label>
              <select
                value={form.design_type}
                onChange={(e) => setForm({ ...form, design_type: e.target.value })}
                className="w-full p-2 border rounded-lg bg-slate-50 font-bold"
              >
                <option value="RBD">RBD (Randomized Block)</option>
                <option value="Simple Lattice">Simple Lattice (Data Model Support)</option>
                <option value="Replication">Replication</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Row-to-Row Spacing (cm)</label>
              <input
                type="number"
                step="1"
                value={form.row_spacing_cm}
                onChange={(e) => setForm({ ...form, row_spacing_cm: parseFloat(e.target.value) || 20 })}
                required
                className="w-full p-2 border rounded-lg bg-slate-50 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Plant-to-Plant Spacing (cm)</label>
              <input
                type="number"
                step="1"
                value={form.plant_spacing_cm}
                onChange={(e) => setForm({ ...form, plant_spacing_cm: parseFloat(e.target.value) || 15 })}
                required
                className="w-full p-2 border rounded-lg bg-slate-50 font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Requested Number of Rows</label>
              <input
                type="number"
                value={form.num_rows}
                onChange={(e) => setForm({ ...form, num_rows: parseInt(e.target.value) || 15 })}
                required
                className="w-full p-2 border rounded-lg bg-slate-50 font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Border Buffer Distance (m)</label>
              <input
                type="number"
                step="0.1"
                value={form.border_buffer_m}
                onChange={(e) => setForm({ ...form, border_buffer_m: parseFloat(e.target.value) || 0.5 })}
                required
                className="w-full p-2 border rounded-lg bg-slate-50"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Randomization Seed (#)</label>
              <input
                type="number"
                value={form.randomization_seed}
                onChange={(e) => setForm({ ...form, randomization_seed: parseInt(e.target.value) || 42 })}
                required
                className="w-full p-2 border rounded-lg bg-slate-50 font-mono"
              />
            </div>

            <div className="flex items-end space-x-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Play className="w-4 h-4" /> {loading ? 'Calculating...' : 'Generate Layout'}
              </button>
              
              {generatedLayout && (
                <button
                  type="button"
                  onClick={handleSaveVersion}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold shadow-md transition flex items-center gap-1 cursor-pointer"
                  title="Save Layout Version"
                >
                  <Save className="w-4 h-4" /> Save v{generatedLayout.summary ? 'New' : ''}
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Real-time Calculation Summary Card */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
          <div className="font-bold text-slate-800 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-emerald-600" /> Live Design Engine Calculation Summary ({plot?.plot_code || 'Plot'}):
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] text-slate-600 font-mono">
            <div>Avg Available Width (X): <b>{avgWidth.toFixed(1)} m</b></div>
            <div>Avg Available Length (Y): <b>{avgLength.toFixed(1)} m</b></div>
            <div>Row Capacity (across Y): <b>~{estimatedMaxRows} Rows</b></div>
            <div>Plants / Row (across X): <b>~{estimatedPlantsPerRow} Positions</b></div>
          </div>
        </div>

        {message && (
          <div className="p-2.5 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-lg text-xs font-semibold">
            {message}
          </div>
        )}
      </div>

      {/* Graphical Grid Canvas Visualizer */}
      <PlotGridCanvas layoutData={generatedLayout} />
    </div>
  );
}
