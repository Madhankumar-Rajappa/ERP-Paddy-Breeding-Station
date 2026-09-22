import React, { useState, useEffect } from 'react';
import { Wheat, Plus, TrendingUp } from 'lucide-react';
import api from '../services/api';

export default function HarvestManagementPage() {
  const [harvestRecords, setHarvestRecords] = useState([]);
  const [varieties, setVarieties] = useState([]);
  
  const [formData, setFormData] = useState({
    trial_id: 1,
    plot_id: 1,
    entry_id: 1,
    replication: 1,
    harvest_date: new Date().toISOString().split('T')[0],
    yield_value: 5.10,
    yield_unit: 'kg/plot',
    grain_weight: 25.4,
    moisture_percentage: 13.8,
    notes: 'Kharif main harvest'
  });

  useEffect(() => {
    fetchHarvestData();
  }, []);

  const fetchHarvestData = async () => {
    try {
      const [hRes, vRes] = await Promise.all([
        api.get('/harvest/trial/1'),
        api.get('/varieties')
      ]);
      setHarvestRecords(hRes.data);
      setVarieties(vRes.data);
      if (vRes.data.length > 0) {
        setFormData(prev => ({ ...prev, entry_id: vRes.data[0].id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/harvest', formData);
      fetchHarvestData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Wheat className="w-5 h-5 text-amber-600" /> Harvest & Yield Management
        </h1>
        <p className="text-xs text-slate-500">
          Record harvest yield data, 1000-grain weight, moisture percentage, and analyze variety performance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Harvest Form */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4 text-xs">
          <h3 className="font-bold text-slate-800 text-sm border-b pb-2">Record Harvest Yield</h3>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Harvest Variety</label>
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

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Yield Value</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.yield_value}
                  onChange={(e) => setFormData({ ...formData, yield_value: parseFloat(e.target.value) })}
                  required
                  className="w-full p-2 border rounded-lg bg-slate-50 font-mono font-bold text-amber-900"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Yield Unit</label>
                <input
                  type="text"
                  value={formData.yield_unit}
                  onChange={(e) => setFormData({ ...formData, yield_unit: e.target.value })}
                  className="w-full p-2 border rounded-lg bg-slate-50 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">1000-Grain Wt (g)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.grain_weight}
                  onChange={(e) => setFormData({ ...formData, grain_weight: parseFloat(e.target.value) })}
                  className="w-full p-2 border rounded-lg bg-slate-50 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Moisture (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.moisture_percentage}
                  onChange={(e) => setFormData({ ...formData, moisture_percentage: parseFloat(e.target.value) })}
                  className="w-full p-2 border rounded-lg bg-slate-50 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Harvest Date</label>
              <input
                type="date"
                value={formData.harvest_date}
                onChange={(e) => setFormData({ ...formData, harvest_date: e.target.value })}
                required
                className="w-full p-2 border rounded-lg bg-slate-50"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition shadow-md"
            >
              Record Harvest
            </button>
          </form>
        </div>

        {/* Harvest Table */}
        <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <h3 className="font-bold text-slate-800 text-sm border-b pb-2">Harvest Records Summary</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase">
                <tr>
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">Variety Name</th>
                  <th className="p-2.5">Rep</th>
                  <th className="p-2.5">Yield</th>
                  <th className="p-2.5">Grain Wt</th>
                  <th className="p-2.5">Moisture</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {harvestRecords.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50">
                    <td className="p-2.5 font-mono">{h.harvest_date}</td>
                    <td className="p-2.5 font-bold text-slate-900">{h.variety_name}</td>
                    <td className="p-2.5">Rep {h.replication}</td>
                    <td className="p-2.5 font-mono font-bold text-amber-900">{h.yield_value} {h.yield_unit}</td>
                    <td className="p-2.5 font-mono">{h.grain_weight || '-'} g</td>
                    <td className="p-2.5 font-mono">{h.moisture_percentage || '-'}%</td>
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
