import React, { useState, useEffect } from 'react';
import { CalendarCheck2, CheckCircle2, Clock, Plus } from 'lucide-react';
import api from '../services/api';

export default function PlantingManagementPage() {
  const [records, setRecords] = useState([]);
  const [formData, setFormData] = useState({
    trial_id: 1,
    plot_id: 1,
    planting_date: new Date().toISOString().split('T')[0],
    status: 'Planted',
    notes: 'Transplanting completed for all experimental rows.'
  });

  useEffect(() => {
    fetchPlantingRecords();
  }, []);

  const fetchPlantingRecords = async () => {
    try {
      const res = await api.get('/planting/trial/1');
      setRecords(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/planting', formData);
      fetchPlantingRecords();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <CalendarCheck2 className="w-5 h-5 text-emerald-600" /> Planting Management & Status Log
        </h1>
        <p className="text-xs text-slate-500">
          Record actual field planting dates, update plot lifecycle status (Planned, Planted, Growing, Harvesting, Harvested), and log field staff updates.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Status Update Form Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4 text-xs">
          <h3 className="font-bold text-slate-800 text-sm border-b pb-2">Record Planting Status Update</h3>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Planting Date</label>
              <input
                type="date"
                value={formData.planting_date}
                onChange={(e) => setFormData({ ...formData, planting_date: e.target.value })}
                required
                className="w-full p-2 border rounded-lg bg-slate-50 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Planting Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full p-2 border rounded-lg bg-slate-50 font-bold"
              >
                <option value="Planned">Planned</option>
                <option value="Prepared">Prepared</option>
                <option value="Planted">Planted</option>
                <option value="Partially Planted">Partially Planted</option>
                <option value="Growing">Growing</option>
                <option value="Failed">Failed</option>
                <option value="Replanted">Replanted</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Notes / Remarks</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows="3"
                className="w-full p-2 border rounded-lg bg-slate-50"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition shadow-md"
            >
              Update Planting Status
            </button>
          </form>
        </div>

        {/* Planting Logs Table */}
        <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <h3 className="font-bold text-slate-800 text-sm border-b pb-2">Planting Activity History</h3>

          <div className="space-y-3 text-xs">
            {records.map((r) => (
              <div key={r.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">{r.status}</div>
                  <p className="text-slate-600">{r.notes}</p>
                  <span className="text-[10px] text-slate-400 font-mono">Date: {r.planting_date} • Updated by: {r.updated_by}</span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
