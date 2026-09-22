import React from 'react';
import { FileText, Download, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

export default function ReportsPage() {

  const handleDownloadPDF = () => {
    window.open('http://127.0.0.1:8000/api/v1/reports/pdf/1', '_blank');
  };

  const handleDownloadCSV = (type) => {
    window.open(`http://127.0.0.1:8000/api/v1/reports/csv/1?type=${type}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <FileText className="w-5 h-5 text-emerald-600" /> Reports & Analytics Export Center
        </h1>
        <p className="text-xs text-slate-500">
          Generate comprehensive trial evaluation PDF reports and export observation/harvest datasets in CSV format for statistical tools (R / QGIS / Excel).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PDF Evaluation Report Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-red-100 text-red-700 flex items-center justify-center font-bold text-lg">
              PDF
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">E4A Complete Evaluation Report</h3>
              <p className="text-xs text-slate-500">Full summary of plot dimensions, trial design, varieties, observations, and harvest yield.</p>
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border">
            <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Plot Master Dimensions (N=36m, E=30m, W=31.2m, S=34.8m)</div>
            <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Trial RBD Design & Varieties</div>
            <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Trait Observations Summary</div>
            <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Harvest Grain Yield & Moisture</div>
          </div>

          <button
            onClick={handleDownloadPDF}
            className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition shadow-md flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" /> Download PDF Report
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
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Export Harvest Yield CSV
            </button>

            <button
              onClick={() => handleDownloadCSV('observations')}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4 text-blue-400" /> Export Observations CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
