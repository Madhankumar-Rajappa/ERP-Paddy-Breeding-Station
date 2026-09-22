import React, { useState, useEffect } from 'react';
import { Grid, Plus, Edit2, Info, MapPin } from 'lucide-react';
import api from '../services/api';

export default function PlotManagementPage() {
  const [plots, setPlots] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    plot_code: '',
    name: '',
    north_length_m: 36,
    east_length_m: 30,
    west_length_m: 31.2,
    south_length_m: 34.8,
    additional_measurement_value: 80,
    additional_measurement_unit: 'cm',
    additional_measurement_description: 'Handwritten 80 cm note'
  });

  useEffect(() => {
    fetchPlots();
  }, []);

  const fetchPlots = async () => {
    try {
      const res = await api.get('/plots');
      setPlots(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/plots', formData);
      setShowModal(false);
      fetchPlots();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Grid className="w-5 h-5 text-emerald-600" /> Plot Master Management
          </h1>
          <p className="text-xs text-slate-500">
            Database entity plot master registry. Generic extensible architecture allows adding E4B, E4C, D43 without app code changes.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-md transition flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add New Plot
        </button>
      </div>

      {/* Plot List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plots.map((p) => (
          <div key={p.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 relative">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="font-extrabold text-slate-800 text-lg">{p.plot_code}</span>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-bold">
                {p.status}
              </span>
            </div>

            <p className="text-xs font-semibold text-slate-700">{p.name}</p>

            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-mono text-slate-600">
              <div>North: <b>{p.north_length_m} m</b></div>
              <div>South: <b>{p.south_length_m} m</b></div>
              <div>East: <b>{p.east_length_m} m</b></div>
              <div>West: <b>{p.west_length_m} m</b></div>
            </div>

            <div className="text-[11px] text-slate-500 bg-emerald-50/50 p-2 rounded border border-emerald-100">
              Field Note: <b>{p.additional_measurement_value} {p.additional_measurement_unit}</b> ({p.additional_measurement_description})
            </div>
          </div>
        ))}
      </div>

      {/* Create Plot Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <h3 className="font-bold text-slate-800 text-base">Register New Plot</h3>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Plot Code (e.g. E4B)</label>
                  <input
                    type="text"
                    value={formData.plot_code}
                    onChange={(e) => setFormData({ ...formData, plot_code: e.target.value })}
                    required
                    className="w-full p-2 border rounded-lg bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Plot Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full p-2 border rounded-lg bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">North Boundary (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.north_length_m}
                    onChange={(e) => setFormData({ ...formData, north_length_m: parseFloat(e.target.value) })}
                    required
                    className="w-full p-2 border rounded-lg bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">East Boundary (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.east_length_m}
                    onChange={(e) => setFormData({ ...formData, east_length_m: parseFloat(e.target.value) })}
                    required
                    className="w-full p-2 border rounded-lg bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">West Boundary (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.west_length_m}
                    onChange={(e) => setFormData({ ...formData, west_length_m: parseFloat(e.target.value) })}
                    required
                    className="w-full p-2 border rounded-lg bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">South Boundary (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.south_length_m}
                    onChange={(e) => setFormData({ ...formData, south_length_m: parseFloat(e.target.value) })}
                    required
                    className="w-full p-2 border rounded-lg bg-slate-50"
                  />
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
                  Save Plot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
