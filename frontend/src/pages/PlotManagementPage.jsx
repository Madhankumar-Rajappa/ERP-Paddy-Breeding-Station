import React, { useState, useEffect } from 'react';
import { Grid, Plus, Search, Edit3, Trash2, X, Check, MapPin, Layers } from 'lucide-react';
import api from '../services/api';

export default function PlotManagementPage() {
  const [plots, setPlots] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [search, setSearch] = useState('');
  const [filterBlockId, setFilterBlockId] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editPlot, setEditPlot] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const initialForm = {
    plot_code: '',
    name: '',
    block_id: 1,
    status: 'Planned',
    description: '',
    north_length_m: 35.0,
    east_length_m: 30.0,
    west_length_m: 30.0,
    south_length_m: 35.0,
    additional_measurement_value: 80.0,
    additional_measurement_unit: 'cm',
    additional_measurement_description: 'Handwritten 80 cm note (bund width)'
  };

  const [formData, setFormData] = useState(initialForm);

  const fetchPlotsAndBlocks = async () => {
    try {
      const [plotsRes, blocksRes] = await Promise.all([
        api.get('/plots'),
        api.get('/gis/blocks')
      ]);
      setPlots(plotsRes.data);
      setBlocks(blocksRes.data);
      if (blocksRes.data.length > 0 && !formData.block_id) {
        setFormData(prev => ({ ...prev, block_id: blocksRes.data[0].id }));
      }
    } catch (err) {
      console.error('Error fetching plots and blocks:', err);
    }
  };

  useEffect(() => {
    fetchPlotsAndBlocks();
  }, []);

  const openCreateModal = () => {
    setEditPlot(null);
    setFormData({
      ...initialForm,
      block_id: blocks[0]?.id || 1
    });
    setErrorMessage('');
    setShowModal(true);
  };

  const openEditModal = (plot) => {
    setEditPlot(plot);
    setFormData({
      plot_code: plot.plot_code,
      name: plot.name,
      block_id: plot.block_id || blocks[0]?.id || 1,
      status: plot.status || 'Planned',
      description: plot.description || '',
      north_length_m: plot.north_length_m,
      east_length_m: plot.east_length_m,
      west_length_m: plot.west_length_m,
      south_length_m: plot.south_length_m,
      additional_measurement_value: plot.additional_measurement_value || 80,
      additional_measurement_unit: plot.additional_measurement_unit || 'cm',
      additional_measurement_description: plot.additional_measurement_description || ''
    });
    setErrorMessage('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      if (editPlot) {
        await api.put(`/plots/${editPlot.id}`, formData);
        setSuccessMessage(`Plot ${formData.plot_code} updated successfully!`);
      } else {
        await api.post('/plots', formData);
        setSuccessMessage(`Plot ${formData.plot_code} registered successfully!`);
      }
      setShowModal(false);
      fetchPlotsAndBlocks();
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error(err);
      setErrorMessage(err.response?.data?.detail || 'Failed to save plot. Please check inputs.');
    }
  };

  const handleDelete = async (plotId, plotCode) => {
    if (!window.confirm(`Are you sure you want to delete plot '${plotCode}'?`)) return;
    try {
      await api.delete(`/plots/${plotId}`);
      setSuccessMessage(`Plot '${plotCode}' deleted successfully.`);
      fetchPlotsAndBlocks();
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed to delete plot.');
    }
  };

  const filteredPlots = plots.filter(p => {
    const matchesSearch = p.plot_code.toLowerCase().includes(search.toLowerCase()) ||
                          p.name.toLowerCase().includes(search.toLowerCase());
    const matchesBlock = filterBlockId === 'ALL' || p.block_id === parseInt(filterBlockId);
    return matchesSearch && matchesBlock;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Planted':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Growing':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Prepared':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Harvested':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Grid className="w-5 h-5 text-emerald-600" /> Station Fields & Plot Registry
          </h1>
          <p className="text-xs text-slate-500">
            Field parcel master database: manages all station experimental plots across Block E, B, and C with geometric survey boundaries.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-md transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Field / Plot
        </button>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" /> {successMessage}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between text-xs">
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search plot code or name (e.g. E4A, Nursery)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-slate-500 font-semibold whitespace-nowrap">Filter Block:</span>
          <select
            value={filterBlockId}
            onChange={(e) => setFilterBlockId(e.target.value)}
            className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none"
          >
            <option value="ALL">All Station Blocks</option>
            {blocks.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <span className="text-slate-400 text-xs font-mono">({filteredPlots.length} fields)</span>
        </div>
      </div>

      {/* Plot List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPlots.map((p) => {
          const blockObj = blocks.find(b => b.id === p.block_id);
          return (
            <div key={p.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 relative hover:border-emerald-300 transition">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-900 text-lg">{p.plot_code}</span>
                  {blockObj && (
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200 flex items-center gap-1">
                      <Layers className="w-2.5 h-2.5 text-slate-400" /> {blockObj.block_code}
                    </span>
                  )}
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(p.status)}`}>
                  {p.status || 'Planned'}
                </span>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-800">{p.name}</p>
                <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{p.description || 'Station experimental field unit.'}</p>
              </div>

              {/* Boundary Dimensions */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-mono text-slate-700">
                <div>North: <b>{p.north_length_m} m</b></div>
                <div>South: <b>{p.south_length_m} m</b></div>
                <div>East: <b>{p.east_length_m} m</b></div>
                <div>West: <b>{p.west_length_m} m</b></div>
              </div>

              {/* Area & Perimeter Measurements */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-emerald-50/60 p-2 rounded-lg border border-emerald-100 text-emerald-950 font-mono">
                <div>Area: <b>{p.area_sqm || '-'} m²</b></div>
                <div>Perimeter: <b>{p.perimeter_m || '-'} m</b></div>
              </div>

              {/* Field Note / Bund */}
              {p.additional_measurement_value && (
                <div className="text-[11px] text-slate-600 bg-amber-50/60 p-2 rounded border border-amber-200 flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-900">Field Note: </span>
                    <b>{p.additional_measurement_value} {p.additional_measurement_unit}</b>
                    <span className="text-slate-500 block text-[10px]">({p.additional_measurement_description})</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => openEditModal(p)}
                  className="px-2.5 py-1 text-xs text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded font-semibold flex items-center gap-1 transition"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => handleDelete(p.id, p.plot_code)}
                  className="px-2.5 py-1 text-xs text-slate-400 hover:text-red-600 hover:bg-red-50 rounded font-semibold flex items-center gap-1 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create / Edit Plot Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-slate-900 text-base">
                {editPlot ? `Edit Plot: ${editPlot.plot_code}` : 'Register New Station Field / Plot'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-semibold">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Plot Code (e.g. E4A, B1)</label>
                  <input
                    type="text"
                    value={formData.plot_code}
                    onChange={(e) => setFormData({ ...formData, plot_code: e.target.value })}
                    required
                    disabled={!!editPlot}
                    className="w-full p-2 border rounded-lg bg-slate-50 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Station Block</label>
                  <select
                    value={formData.block_id}
                    onChange={(e) => setFormData({ ...formData, block_id: parseInt(e.target.value) })}
                    className="w-full p-2 border rounded-lg bg-slate-50 font-semibold"
                  >
                    {blocks.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Field / Plot Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g. Kharif Experimental Performance Unit"
                  className="w-full p-2 border rounded-lg bg-slate-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Current Field Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-slate-50 font-bold"
                  >
                    <option value="Planned">Planned</option>
                    <option value="Prepared">Prepared</option>
                    <option value="Planted">Planted</option>
                    <option value="Growing">Growing</option>
                    <option value="Harvesting">Harvesting</option>
                    <option value="Harvested">Harvested</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Description / Notes</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="e.g. Reference plot with 80cm bund"
                    className="w-full p-2 border rounded-lg bg-slate-50"
                  />
                </div>
              </div>

              {/* 4 Boundary Lengths */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <div className="font-bold text-slate-700">Survey Boundary Lengths (Meters):</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">North Boundary (m)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.north_length_m}
                      onChange={(e) => setFormData({ ...formData, north_length_m: parseFloat(e.target.value) || 0 })}
                      required
                      className="w-full p-2 border rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">East Boundary (m)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.east_length_m}
                      onChange={(e) => setFormData({ ...formData, east_length_m: parseFloat(e.target.value) || 0 })}
                      required
                      className="w-full p-2 border rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">West Boundary (m)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.west_length_m}
                      onChange={(e) => setFormData({ ...formData, west_length_m: parseFloat(e.target.value) || 0 })}
                      required
                      className="w-full p-2 border rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-medium mb-1">South Boundary (m)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.south_length_m}
                      onChange={(e) => setFormData({ ...formData, south_length_m: parseFloat(e.target.value) || 0 })}
                      required
                      className="w-full p-2 border rounded-lg bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Field Note Measurements */}
              <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200 space-y-2">
                <div className="font-bold text-amber-900">Additional Field Note / Bund Width:</div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block text-slate-600 font-medium mb-1">Measurement Value</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.additional_measurement_value}
                      onChange={(e) => setFormData({ ...formData, additional_measurement_value: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2 border rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Unit</label>
                    <select
                      value={formData.additional_measurement_unit}
                      onChange={(e) => setFormData({ ...formData, additional_measurement_unit: e.target.value })}
                      className="w-full p-2 border rounded-lg bg-white font-bold"
                    >
                      <option value="cm">cm</option>
                      <option value="m">m</option>
                      <option value="in">in</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Field Note Note / Context</label>
                  <input
                    type="text"
                    value={formData.additional_measurement_description}
                    onChange={(e) => setFormData({ ...formData, additional_measurement_description: e.target.value })}
                    placeholder="e.g. Handwritten 80 cm note (bund width)"
                    className="w-full p-2 border rounded-lg bg-white"
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
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 shadow-md"
                >
                  {editPlot ? 'Update Plot' : 'Save Plot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
