import React, { useState, useEffect } from 'react';
import { TestTube2, Plus, CheckSquare, Square, Trash2, Search, Calendar } from 'lucide-react';
import api from '../services/api';

export default function TrialManagementPage() {
  const [trials, setTrials] = useState([]);
  const [plots, setPlots] = useState([]);
  const [varieties, setVarieties] = useState([]);
  const [search, setSearch] = useState('');
  const [filterPlotId, setFilterPlotId] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const initialForm = {
    trial_code: '',
    name: '',
    plot_id: 1,
    crop: 'Paddy / Rice',
    season: 'Kharif 2026',
    year: 2026,
    design_type: 'RBD',
    num_entries: 5,
    num_replications: 3,
    start_date: '2026-06-15',
    expected_harvest_date: '2026-10-25',
    variety_ids: [],
    notes: ''
  };

  const [formData, setFormData] = useState(initialForm);

  const fetchTrials = async () => {
    try {
      const res = await api.get('/trials');
      setTrials(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPlotsAndVarieties = async () => {
    try {
      const [pRes, vRes] = await Promise.all([api.get('/plots'), api.get('/varieties')]);
      setPlots(pRes.data);
      setVarieties(vRes.data);
      if (pRes.data.length > 0) {
        setFormData(prev => ({ ...prev, plot_id: pRes.data[0].id }));
      }
      if (vRes.data.length > 0) {
        setFormData(prev => ({ ...prev, variety_ids: vRes.data.slice(0, 5).map(v => v.id) }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTrials();
    fetchPlotsAndVarieties();
  }, []);

  const toggleVariety = (vId) => {
    setFormData(prev => {
      const exists = prev.variety_ids.includes(vId);
      const updated = exists ? prev.variety_ids.filter(id => id !== vId) : [...prev.variety_ids, vId];
      return { ...prev, variety_ids: updated, num_entries: updated.length };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      await api.post('/trials', formData);
      setShowModal(false);
      setFormData(initialForm);
      fetchTrials();
    } catch (err) {
      console.error(err);
      setErrorMessage(err.response?.data?.detail || 'Failed to create trial.');
    }
  };

  const handleDelete = async (trialId, trialCode) => {
    if (!window.confirm(`Are you sure you want to delete trial '${trialCode}'?`)) return;
    try {
      await api.delete(`/trials/${trialId}`);
      fetchTrials();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed to delete trial.');
    }
  };

  const filteredTrials = trials.filter(t => {
    const matchesSearch = t.trial_code.toLowerCase().includes(search.toLowerCase()) ||
                          t.name.toLowerCase().includes(search.toLowerCase());
    const matchesPlot = filterPlotId === 'ALL' || t.plot_id === parseInt(filterPlotId);
    return matchesSearch && matchesPlot;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <TestTube2 className="w-5 h-5 text-emerald-600" /> Breeding Trial Management
          </h1>
          <p className="text-xs text-slate-500">
            Define agronomic breeding trials across all station fields, select experimental designs (RBD, Simple Lattice), and assign entries.
          </p>
        </div>

        <button
          onClick={() => {
            setErrorMessage('');
            setShowModal(true);
          }}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-md transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Create Trial
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between text-xs">
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search trial code or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-slate-500 font-semibold whitespace-nowrap">Filter Plot:</span>
          <select
            value={filterPlotId}
            onChange={(e) => setFilterPlotId(e.target.value)}
            className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none"
          >
            <option value="ALL">All Station Plots</option>
            {plots.map(p => (
              <option key={p.id} value={p.id}>{p.plot_code} - {p.name}</option>
            ))}
          </select>
          <span className="text-slate-400 text-xs font-mono">({filteredTrials.length} trials)</span>
        </div>
      </div>

      {/* Trial List */}
      <div className="space-y-4">
        {filteredTrials.map((t) => {
          const targetPlot = plots.find(p => p.id === t.plot_id);
          return (
            <div key={t.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 hover:border-emerald-300 transition">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-slate-900 text-base">{t.trial_code}</span>
                  <span className="font-semibold text-slate-700 text-sm">{t.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                    {t.status}
                  </span>
                  <button
                    onClick={() => handleDelete(t.id, t.trial_code)}
                    className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                    title="Delete Trial"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Plot</span>
                  <span className="font-bold text-slate-800">{targetPlot?.plot_code || `Plot ${t.plot_id}`}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Design</span>
                  <span className="font-bold text-slate-800">{t.design_type}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Entries / Reps</span>
                  <span className="font-bold text-slate-800">{t.num_entries} Entries × {t.num_replications} Reps</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Season / Year</span>
                  <span className="font-bold text-slate-800">{t.season} ({t.year})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Crop</span>
                  <span className="font-bold text-slate-800">{t.crop}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-500 gap-2 pt-1 border-t border-slate-100">
                <span className="flex items-center gap-1 font-mono text-[11px]">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> Start: <b>{t.start_date || 'N/A'}</b> | Expected Harvest: <b>{t.expected_harvest_date || 'N/A'}</b>
                </span>
                {t.notes && (
                  <span className="text-slate-600 italic text-[11px] truncate max-w-md">
                    Note: {t.notes}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Trial Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            <h3 className="font-bold text-slate-900 text-base">Create Breeding Trial</h3>

            {errorMessage && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-semibold">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Trial Code</label>
                  <input
                    type="text"
                    value={formData.trial_code}
                    onChange={(e) => setFormData({ ...formData, trial_code: e.target.value })}
                    required
                    placeholder="e.g. TR-E4A-2026-02"
                    className="w-full p-2 border rounded-lg bg-slate-50 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Target Field / Plot</label>
                  <select
                    value={formData.plot_id}
                    onChange={(e) => setFormData({ ...formData, plot_id: parseInt(e.target.value) })}
                    className="w-full p-2 border rounded-lg bg-slate-50 font-bold text-emerald-900"
                  >
                    {plots.map(p => (
                      <option key={p.id} value={p.id}>{p.plot_code} - {p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Trial Title / Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g. Kharif High Yield Evaluation Trial"
                  className="w-full p-2 border rounded-lg bg-slate-50 font-semibold"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Crop</label>
                  <input
                    type="text"
                    value={formData.crop}
                    onChange={(e) => setFormData({ ...formData, crop: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Season</label>
                  <input
                    type="text"
                    value={formData.season}
                    onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Year</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || 2026 })}
                    className="w-full p-2 border rounded-lg bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Experimental Design</label>
                  <select
                    value={formData.design_type}
                    onChange={(e) => setFormData({ ...formData, design_type: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-slate-50 font-bold"
                  >
                    <option value="RBD">RBD (Randomized Block)</option>
                    <option value="Simple Lattice">Simple Lattice</option>
                    <option value="Replication">Replication</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Replications</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.num_replications}
                    onChange={(e) => setFormData({ ...formData, num_replications: parseInt(e.target.value) || 1 })}
                    className="w-full p-2 border rounded-lg bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-slate-50 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Expected Harvest Date</label>
                  <input
                    type="date"
                    value={formData.expected_harvest_date}
                    onChange={(e) => setFormData({ ...formData, expected_harvest_date: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-slate-50 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Trial Protocol Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows="2"
                  placeholder="e.g. Standard agronomic inputs (120:60:40 NPK), flood irrigation protocol"
                  className="w-full p-2 border rounded-lg bg-slate-50"
                />
              </div>

              {/* Variety Entry Selector Checkboxes */}
              <div className="space-y-1.5 border-t pt-2">
                <label className="block text-slate-700 font-bold">Select Variety Entries ({formData.variety_ids.length} Selected):</label>
                <div className="max-h-36 overflow-y-auto border rounded-lg p-2 bg-slate-50 space-y-1">
                  {varieties.map((v) => {
                    const selected = formData.variety_ids.includes(v.id);
                    return (
                      <div
                        key={v.id}
                        onClick={() => toggleVariety(v.id)}
                        className={`flex items-center justify-between p-1.5 rounded cursor-pointer transition ${
                          selected ? 'bg-emerald-100 text-emerald-950 font-bold' : 'hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          {selected ? <CheckSquare className="w-4 h-4 text-emerald-700" /> : <Square className="w-4 h-4 text-slate-400" />}
                          <span>{v.variety_code} - {v.variety_name}</span>
                        </div>
                        <span className="text-[10px] opacity-70">{v.duration_days} days</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 shadow-md"
                >
                  Create Trial
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
