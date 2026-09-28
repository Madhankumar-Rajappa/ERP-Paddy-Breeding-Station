import React, { useState, useEffect } from 'react';
import { CalendarCheck2, TestTube2 } from 'lucide-react';
import api from '../services/api';

export default function PlantingManagementPage() {
  const [trials, setTrials] = useState([]);
  const [selectedTrialId, setSelectedTrialId] = useState(1);
  const [selectedPlotId, setSelectedPlotId] = useState(1);
  const [records, setRecords] = useState([]);
  const [formData, setFormData] = useState({
    trial_id: 1,
    plot_id: 1,
    planting_date: new Date().toISOString().split('T')[0],
    status: 'Planted',
    notes: 'Transplanting completed for all experimental rows.'
  });

  const fetchPlantingRecords = async (trialId) => {
    try {
      const res = await api.get(`/planting/trial/${trialId}`);
      setRecords(res.data);
    } catch (err) {
      console.error('Error fetching planting records:', err);
    }
  };

  useEffect(() => {
    async function init() {
      try {
        const [trialsRes, plotsRes] = await Promise.all([
          api.get('/trials'),
          api.get('/plots')
        ]);
        setTrials(trialsRes.data);

        const firstTrial = trialsRes.data[0];
        const firstPlot = plotsRes.data[0];
        const tId = firstTrial ? firstTrial.id : 1;
        const pId = firstTrial?.plot_id || (firstPlot ? firstPlot.id : 1);

        setSelectedTrialId(tId);
        setSelectedPlotId(pId);
        setFormData(prev => ({ ...prev, trial_id: tId, plot_id: pId }));
        if (tId) {
          fetchPlantingRecords(tId);
        }
      } catch (err) {
        console.error('Error initializing planting page:', err);
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
    fetchPlantingRecords(tId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/planting', {
        ...formData,
        trial_id: selectedTrialId,
        plot_id: selectedPlotId
      });
      fetchPlantingRecords(selectedTrialId);
    } catch (err) {
      console.error('Error recording planting:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarCheck2 className="w-5 h-5 text-emerald-600" /> Planting Management & Status Log
          </h1>
          <p className="text-xs text-slate-500">
            Record actual field planting dates, update plot lifecycle status (Planned, Planted, Growing, Harvesting, Harvested), and log field staff updates.
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
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition shadow-md cursor-pointer"
            >
              Update Planting Status
            </button>
          </form>
        </div>

        {/* Planting Logs Table */}
        <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <h3 className="font-bold text-slate-800 text-sm border-b pb-2">Planting Activity History ({records.length} Records)</h3>

          <div className="space-y-3 text-xs">
            {records.length === 0 ? (
              <div className="p-4 text-center text-slate-400">
                No planting records found for this trial.
              </div>
            ) : (
              records.map((r) => (
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
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
