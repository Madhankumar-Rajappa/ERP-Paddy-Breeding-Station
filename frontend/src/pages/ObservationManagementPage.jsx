import React, { useState, useEffect } from 'react';
import { ClipboardList, Plus, Check } from 'lucide-react';
import api from '../services/api';

export default function ObservationManagementPage() {
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

  useEffect(() => {
    fetchTraitsAndObservations();
  }, []);

  const fetchTraitsAndObservations = async () => {
    try {
      const [trRes, obsRes, varRes] = await Promise.all([
        api.get('/observations/traits'),
        api.get('/observations/trial/1'),
        api.get('/varieties')
      ]);
      setTraits(trRes.data);
      setObservations(obsRes.data);
      setVarieties(varRes.data);
      if (trRes.data.length > 0) {
        setFormData(prev => ({ ...prev, trait_id: trRes.data[0].id, unit: trRes.data[0].unit || 'cm' }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/observations', formData);
      fetchTraitsAndObservations();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-emerald-600" /> Field Observation Management
        </h1>
        <p className="text-xs text-slate-500">
          Record field trait data (Plant Height, Tillers, Disease Score, Flowering Date) for trial entries & experimental units.
        </p>
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
                  onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) })}
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
                  onChange={(e) => setFormData({ ...formData, replication: parseInt(e.target.value) })}
                  className="w-full p-2 border rounded-lg bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Row Number</label>
                <input
                  type="number"
                  value={formData.row_number}
                  onChange={(e) => setFormData({ ...formData, row_number: parseInt(e.target.value) })}
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
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition shadow-md"
            >
              Save Field Observation
            </button>
          </form>
        </div>

        {/* Observations Table */}
        <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <h3 className="font-bold text-slate-800 text-sm border-b pb-2">Recorded Observation Data</h3>

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
                {observations.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50">
                    <td className="p-2.5 font-mono">{o.observation_date}</td>
                    <td className="p-2.5 font-bold text-slate-900">{o.variety_name}</td>
                    <td className="p-2.5 font-bold text-emerald-800">{o.trait_name}</td>
                    <td className="p-2.5 font-mono font-bold">{o.value} {o.unit}</td>
                    <td className="p-2.5">Rep {o.replication}</td>
                    <td className="p-2.5 text-slate-500">{o.recorded_by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
