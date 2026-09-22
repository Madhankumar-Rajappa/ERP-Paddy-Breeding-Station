import React, { useState, useEffect } from 'react';
import { Sprout, Plus, Search, Trash2 } from 'lucide-react';
import api from '../services/api';

export default function VarietyManagementPage() {
  const [varieties, setVarieties] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    variety_code: '',
    variety_name: '',
    duration_days: 120,
    description: '',
    source: 'CGIAR / National Paddy Station'
  });

  useEffect(() => {
    fetchVarieties();
  }, [search]);

  const fetchVarieties = async () => {
    try {
      const res = await api.get(`/varieties?search=${search}`);
      setVarieties(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/varieties', formData);
      setShowModal(false);
      fetchVarieties();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete variety entry?')) return;
    try {
      await api.delete(`/varieties/${id}`);
      fetchVarieties();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Sprout className="w-5 h-5 text-emerald-600" /> Paddy Variety Master Registry
          </h1>
          <p className="text-xs text-slate-500">
            Catalog of paddy varieties, duration days, breeding source, and treatment assignments.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-md transition flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add Variety
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search variety name or code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
        />
      </div>

      {/* Variety Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
            <tr>
              <th className="p-3">Variety Code</th>
              <th className="p-3">Variety Name</th>
              <th className="p-3">Duration (Days)</th>
              <th className="p-3">Source Station</th>
              <th className="p-3">Description</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
            {varieties.map((v) => (
              <tr key={v.id} className="hover:bg-slate-50">
                <td className="p-3 font-mono font-bold text-emerald-800">{v.variety_code}</td>
                <td className="p-3 font-semibold text-slate-900">{v.variety_name}</td>
                <td className="p-3 font-mono">{v.duration_days} days</td>
                <td className="p-3 text-slate-500">{v.source}</td>
                <td className="p-3 text-slate-500 max-w-xs truncate">{v.description || '-'}</td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => handleDelete(v.id)}
                    className="p-1 text-slate-400 hover:text-red-600 rounded"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Variety Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-slate-800 text-base">Register Paddy Variety</h3>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Variety Code (e.g. CR-310)</label>
                <input
                  type="text"
                  value={formData.variety_code}
                  onChange={(e) => setFormData({ ...formData, variety_code: e.target.value })}
                  required
                  className="w-full p-2 border rounded-lg bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Variety Name</label>
                <input
                  type="text"
                  value={formData.variety_name}
                  onChange={(e) => setFormData({ ...formData, variety_name: e.target.value })}
                  required
                  className="w-full p-2 border rounded-lg bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Duration (Days to Maturity)</label>
                <input
                  type="number"
                  value={formData.duration_days}
                  onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) })}
                  required
                  className="w-full p-2 border rounded-lg bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Breeding Source</label>
                <input
                  type="text"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="w-full p-2 border rounded-lg bg-slate-50"
                />
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
                  Save Variety
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
