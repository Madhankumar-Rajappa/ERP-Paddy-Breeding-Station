import React, { useState, useEffect } from 'react';
import { TestTube2, Plus, Calendar, CheckSquare, Square } from 'lucide-react';
import api from '../services/api';

export default function TrialManagementPage() {
  const [trials, setTrials] = useState([]);
  const [plots, setPlots] = useState([]);
  const [varieties, setVarieties] = useState([]);
  const [showModal, setShowModal] = useState(false);
  
  const [formData, setFormData] = useState({
    trial_code: '',
    name: '',
    plot_id: 1,
    crop: 'Paddy / Rice',
    season: 'Kharif 2026',
    year: 2026,
    design_type: 'RBD', // RBD, Simple Lattice, Replication, Custom
    num_entries: 5,
    num_replications: 3,
    start_date: '2026-06-15',
    expected_harvest_date: '2026-10-25',
    variety_ids: [],
    notes: ''
  });

  useEffect(() => {
    fetchTrials();
    fetchPlotsAndVarieties();
  }, []);

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
      if (vRes.data.length > 0) {
        setFormData(prev => ({ ...prev, variety_ids: vRes.data.slice(0, 5).map(v => v.id) }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleVariety = (vId) => {
    setFormData(prev => {
      const exists = prev.variety_ids.includes(vId);
      const updated = exists ? prev.variety_ids.filter(id => id !== vId) : [...prev.variety_ids, vId];
      return { ...prev, variety_ids: updated, num_entries: updated.length };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/trials', formData);
      setShowModal(false);
      fetchTrials();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <TestTube2 className="w-5 h-5 text-emerald-600" /> Trial Management
          </h1>
          <p className="text-xs text-slate-500">
            Create breeding trials for plot E4A, select experimental design (RBD, Simple Lattice), and assign paddy varieties.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-md transition flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Create Trial
        </button>
      </div>

      {/* Trial List */}
      <div className="space-y-4">
        {trials.map((t) => (
          <div key={t.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-slate-900 text-base">{t.name}</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 font-bold text-emerald-800">
                  {t.trial_code}
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                {t.status}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div>Design Type: <b className="text-slate-800">{t.design_type}</b></div>
              <div>Entries: <b className="text-slate-800">{t.num_entries} Entries</b></div>
              <div>Replications: <b className="text-slate-800">{t.num_replications} Reps</b></div>
              <div>Season: <b className="text-slate-800">{t.season}</b></div>
            </div>

            <div className="text-[11px] text-slate-500 flex items-center justify-between">
              <span>Start Date: {t.start_date || 'N/A'} | Expected Harvest: {t.expected_harvest_date || 'N/A'}</span>
              <span className="font-semibold text-slate-700">{t.notes}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Create Trial Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-slate-800 text-base">Create Breeding Trial for E4A</h3>

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
                    className="w-full p-2 border rounded-lg bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Target Plot</label>
                  <select
                    value={formData.plot_id}
                    onChange={(e) => setFormData({ ...formData, plot_id: parseInt(e.target.value) })}
                    className="w-full p-2 border rounded-lg bg-slate-50 font-bold text-emerald-900"
                  >
                    {plots.map(p => (
                      <option key={p.id} value={p.id}>Plot {p.plot_code} - {p.name}</option>
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
                  className="w-full p-2 border rounded-lg bg-slate-50"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
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
                    onChange={(e) => setFormData({ ...formData, num_replications: parseInt(e.target.value) })}
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
                        className={`flex items-center justify-between p-1.5 rounded cursor-pointer ${
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
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700"
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
