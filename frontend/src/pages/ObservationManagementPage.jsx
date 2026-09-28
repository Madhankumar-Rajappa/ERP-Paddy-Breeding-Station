import React, { useState, useEffect } from 'react';
import { ClipboardList, TestTube2 } from 'lucide-react';
import api from '../services/api';

export default function ObservationManagementPage() {
  const [trials, setTrials] = useState([]);
  const [selectedTrialId, setSelectedTrialId] = useState(1);
  const [selectedPlotId, setSelectedPlotId] = useState(1);
  const [traits, setTraits] = useState([]);
  const [observations, setObservations] = useState([]);
  const [varieties, setVarieties] = useState([]);
  
  const [formData, setFormData] = useState({
    trial_id: 1,
    plot_id: 1,
    entry_id: 1,
    trait_id: 1,
    replication: 1,
    row_number: 1,
    plant_position: 1,
    value: 105.5,
    unit: 'cm',
    observation_date: new Date().toISOString().split('T')[0],
    remarks: 'Field evaluation sample'
  });

  const fetchTrialObservations = async (trialId) => {
    try {
      const res = await api.get(`/observations/trial/${trialId}`);
      setObservations(res.data);
    } catch (err) {
      console.error('Error fetching observations:', err);
    }
  };

  useEffect(() => {
    async function init() {
      try {
        const [trRes, varRes, trialsRes, plotsRes] = await Promise.all([
          api.get('/observations/traits'),
          api.get('/varieties'),
          api.get('/trials'),
          api.get('/plots')
        ]);
        setTraits(trRes.data);
        setVarieties(varRes.data);
        setTrials(trialsRes.data);

        const firstTrial = trialsRes.data[0];
        const firstPlot = plotsRes.data[0];
        const tId = firstTrial ? firstTrial.id : 1;
        const pId = firstTrial?.plot_id || (firstPlot ? firstPlot.id : 1);

        setSelectedTrialId(tId);
        setSelectedPlotId(pId);

        if (trRes.data.length > 0 && varRes.data.length > 0) {
          setFormData(prev => ({
            ...prev,
            trial_id: tId,
            plot_id: pId,
            entry_id: varRes.data[0].id,
            trait_id: trRes.data[0].id,
            unit: trRes.data[0].unit || 'cm'
          }));
        }
        if (tId) {
          fetchTrialObservations(tId);
        }
      } catch (err) {
        console.error('Error initializing observations page:', err);
      }
    }
    init();
  }, []);

  const handleTrialChange = (e) => {
    const tId = parseInt(e.target.value);
    setSelectedTrialId(tId);
    const targetTrial = trials.find(t => t.id === tId);
    const pId = targetTrial?.plot_id || selectedPlotId;
    setSelectedPlotId(pId);
    setFormData(prev => ({ ...prev, trial_id: tId, plot_id: pId }));
    fetchTrialObservations(tId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/observations', {
        ...formData,
        trial_id: selectedTrialId,
        plot_id: selectedPlotId
      });
      fetchTrialObservations(selectedTrialId);
    } catch (err) {
      console.error('Error saving observation:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-emerald-600" /> Field Observation Management
          </h1>
          <p className="text-xs text-slate-500">
            Record field trait data (Plant Height, Tillers, Disease Score, Flowering Date) for trial entries & experimental units.
          </p>
        </div>

        {/* Dynamic Trial Selector */}
        <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm text-xs">
          <TestTube2 className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold text-slate-700">Target Trial:</span>
          <select
            value={selectedTrialId}
            onChange={handleTrialChange}
            className="font-bold text-emerald-900 bg-transparent focus:outline-none cursor-pointer"
          >
            {trials.map(t => (
              <option key={t.id} value={t.id}>{t.name} ({t.trial_code})</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Observation Entry Form */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4 text-xs">
          <h3 className="font-bold text-slate-800 text-sm border-b pb-2">Record Field Observation</h3>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Target Variety / Entry</label>
              <select
                value={formData.entry_id}
                onChange={(e) => setFormData({ ...formData, entry_id: parseInt(e.target.value) })}
                className="w-full p-2 border rounded-lg bg-slate-50 font-bold"
              >
                {varieties.map(v => (
                  <option key={v.id} value={v.id}>{v.variety_code} - {v.variety_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Observation Trait</label>
              <select
                value={formData.trait_id}
                onChange={(e) => {
                  const tId = parseInt(e.target.value);
                  const selectedTrait = traits.find(t => t.id === tId);
                  setFormData({ ...formData, trait_id: tId, unit: selectedTrait?.unit || '' });
                }}
                className="w-full p-2 border rounded-lg bg-slate-50 font-bold"
              >
                {traits.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.trait_code})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Recorded Value</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                  required
                  className="w-full p-2 border rounded-lg bg-slate-50 font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Unit</label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full p-2 border rounded-lg bg-slate-50 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Replication</label>
                <input
                  type="number"
                  value={formData.replication}
                  onChange={(e) => setFormData({ ...formData, replication: parseInt(e.target.value) || 1 })}
                  className="w-full p-2 border rounded-lg bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Row Number</label>
                <input
                  type="number"
                  value={formData.row_number}
                  onChange={(e) => setFormData({ ...formData, row_number: parseInt(e.target.value) || 1 })}
                  className="w-full p-2 border rounded-lg bg-slate-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Observation Date</label>
              <input
                type="date"
                value={formData.observation_date}
                onChange={(e) => setFormData({ ...formData, observation_date: e.target.value })}
                required
                className="w-full p-2 border rounded-lg bg-slate-50"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition shadow-md cursor-pointer"
            >
              Save Field Observation
            </button>
          </form>
        </div>

        {/* Observations Table */}
        <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <h3 className="font-bold text-slate-800 text-sm border-b pb-2">Recorded Observation Data ({observations.length} Records)</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase">
                <tr>
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">Variety</th>
                  <th className="p-2.5">Trait Name</th>
                  <th className="p-2.5">Value</th>
                  <th className="p-2.5">Rep</th>
                  <th className="p-2.5">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {observations.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-4 text-center text-slate-400">
                      No observations recorded yet for this trial.
                    </td>
                  </tr>
                ) : (
                  observations.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-mono">{o.observation_date}</td>
                      <td className="p-2.5 font-bold text-slate-900">{o.variety_name}</td>
                      <td className="p-2.5 font-bold text-emerald-800">{o.trait_name}</td>
                      <td className="p-2.5 font-mono font-bold">{o.value} {o.unit}</td>
                      <td className="p-2.5">Rep {o.replication}</td>
                      <td className="p-2.5 text-slate-500">{o.recorded_by}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
