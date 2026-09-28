import React, { useState, useEffect } from 'react';
import { FileText, Download, FileSpreadsheet, CheckCircle2, Grid } from 'lucide-react';
import api, { API_BASE_URL } from '../services/api';

export default function ReportsPage() {
  const [plots, setPlots] = useState([]);
  const [selectedPlotId, setSelectedPlotId] = useState(1);
  const [selectedPlot, setSelectedPlot] = useState(null);

  const fetchPlots = async () => {
    try {
      const res = await api.get('/plots');
      setPlots(res.data);
      if (res.data.length > 0) {
        setSelectedPlotId(res.data[0].id);
        setSelectedPlot(res.data[0]);
      }
    } catch (err) {
      console.error('Error fetching plots for reports:', err);
    }
  };

  useEffect(() => {
    fetchPlots();
  }, []);

  const handlePlotChange = (e) => {
    const id = parseInt(e.target.value);
    setSelectedPlotId(id);
    const p = plots.find(item => item.id === id);
    setSelectedPlot(p || null);
  };

  const handleDownloadPDF = () => {
    window.open(`${API_BASE_URL}/reports/pdf/${selectedPlotId}`, '_blank');
  };

  const handleDownloadCSV = (type) => {
    window.open(`${API_BASE_URL}/reports/csv/${selectedPlotId}?type=${type}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" /> Reports & Analytics Export Center
          </h1>
          <p className="text-xs text-slate-500">
            Generate comprehensive trial evaluation PDF reports and export observation/harvest datasets in CSV format for statistical tools (R / QGIS / Excel).
          </p>
        </div>

        {/* Dynamic Plot Selector */}
        <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm text-xs">
          <Grid className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold text-slate-700">Target Plot:</span>
          <select
            value={selectedPlotId}
            onChange={handlePlotChange}
            className="font-bold text-emerald-900 bg-transparent focus:outline-none cursor-pointer"
          >
            {plots.map(p => (
              <option key={p.id} value={p.id}>{p.plot_code} - {p.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PDF Evaluation Report Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold text-lg">
              PDF
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">{selectedPlot?.plot_code || 'Plot'} Complete Evaluation Report</h3>
              <p className="text-xs text-slate-500">Full summary of plot dimensions, trial design, varieties, observations, and harvest yield.</p>
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 
              Plot Dimensions (N={selectedPlot?.north_length_m || 36}m, E={selectedPlot?.east_length_m || 30}m, W={selectedPlot?.west_length_m || 31.2}m, S={selectedPlot?.south_length_m || 34.8}m)
            </div>
            <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Trial RBD Design & Varieties</div>
            <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Trait Observations Summary</div>
            <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Harvest Grain Yield & Moisture</div>
          </div>

          <button
            onClick={handleDownloadPDF}
            className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" /> Download PDF Report ({selectedPlot?.plot_code || 'Plot'})
          </button>
        </div>

        {/* CSV Data Export Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg">
              CSV
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Raw Field Dataset Export</h3>
              <p className="text-xs text-slate-500">Export structured CSV files for statistical analysis software or QGIS spatial join.</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => handleDownloadCSV('harvest')}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Export Harvest Yield CSV
            </button>

            <button
              onClick={() => handleDownloadCSV('observations')}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-blue-400" /> Export Observations CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
