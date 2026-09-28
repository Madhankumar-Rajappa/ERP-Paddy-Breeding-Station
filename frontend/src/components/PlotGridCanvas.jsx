import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Layers } from 'lucide-react';

export default function PlotGridCanvas({ layoutData }) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedPlant, setSelectedPlant] = useState(null);

  if (!layoutData || !layoutData.rows_grid) {
    return (
      <div className="h-64 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-xs">
        No layout grid generated yet. Enter parameters above and click "Generate Layout".
      </div>
    );
  }

  const { summary, rows_grid } = layoutData;

  // Distinct palette for variety treatments
  const varietyColors = [
    { bg: 'bg-emerald-500', text: 'text-emerald-900', border: 'border-emerald-600', dot: '#10b981' },
    { bg: 'bg-blue-500', text: 'text-blue-900', border: 'border-blue-600', dot: '#3b82f6' },
    { bg: 'bg-amber-500', text: 'text-amber-900', border: 'border-amber-600', dot: '#f59e0b' },
    { bg: 'bg-purple-500', text: 'text-purple-900', border: 'border-purple-600', dot: '#a855f7' },
    { bg: 'bg-rose-500', text: 'text-rose-900', border: 'border-rose-600', dot: '#f43f5e' },
  ];

  const getVarietyStyle = (vId) => {
    const idx = (vId - 1) % varietyColors.length;
    return varietyColors[idx];
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
      {/* Grid Canvas Top Header Toolbar */}
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" /> Plot E4A Graphical Planting Grid
          </h3>
          <p className="text-xs text-slate-500">
            {summary.estimated_rows} Rows • {summary.total_valid_plants} Planting Positions • RBD Seed #{summary.randomization_seed}
          </p>
        </div>

        {/* Zoom & Reset Controls */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => setZoomLevel(prev => Math.min(prev + 0.2, 2.0))}
            className="p-1.5 hover:bg-white rounded text-slate-600 shadow-sm"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <span className="px-2 font-mono text-[11px] font-bold text-slate-700">{Math.round(zoomLevel * 100)}%</span>
          <button
            onClick={() => setZoomLevel(prev => Math.max(prev - 0.2, 0.6))}
            className="p-1.5 hover:bg-white rounded text-slate-600 shadow-sm"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoomLevel(1)}
            className="p-1.5 hover:bg-white rounded text-slate-600 shadow-sm ml-1"
            title="Reset View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Grid Scrollable Canvas Container */}
      <div className="overflow-auto max-h-[500px] border border-slate-200 rounded-lg p-4 bg-slate-900/95 relative">
        <div
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}
          className="transition-transform duration-150 space-y-2 inline-block min-w-full"
        >
          {rows_grid.map((row) => {
            const vStyle = getVarietyStyle(row.variety.id);
            return (
              <div key={`row-${row.row_number}`} className="flex items-center space-x-3 text-xs">
                {/* Row Header Badge */}
                <div className="w-24 shrink-0 font-mono text-[10px] font-bold px-2 py-1 bg-slate-800 text-slate-200 rounded border border-slate-700 flex items-center justify-between">
                  <span>Row #{row.row_number}</span>
                  <span className="text-emerald-400">R{row.replication}</span>
                </div>

                {/* Assigned Variety Label */}
                <div className={`w-36 shrink-0 px-2 py-1 rounded text-[11px] font-bold truncate text-white ${vStyle.bg} shadow-sm`}>
                  {row.variety.variety_name}
                </div>

                {/* Plant Position Cells */}
                <div className="flex items-center space-x-1 overflow-x-auto py-1 px-2 bg-slate-950/60 rounded border border-slate-800">
                  {row.plants.map((plant) => (
                    <button
                      key={`plant-${row.row_number}-${plant.position_number}`}
                      onClick={() => setSelectedPlant({ ...plant, row: row.row_number, replication: row.replication, unit_code: row.unit_code })}
                      title={`Row ${row.row_number} Pos ${plant.position_number}: ${plant.variety_name}`}
                      className="w-3.5 h-3.5 rounded-full transition-transform hover:scale-150 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      style={{ backgroundColor: vStyle.dot }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Plant Cell Click Details Modal */}
      {selectedPlant && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs animate-fade-in">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
              P{selectedPlant.position_number}
            </div>
            <div>
              <p className="font-bold text-emerald-950">{selectedPlant.variety_name}</p>
              <p className="text-[11px] text-emerald-800">
                Unit <b>{selectedPlant.unit_code}</b> | Rep {selectedPlant.replication} | Row #{selectedPlant.row} | Pos #{selectedPlant.position_number}
              </p>
              <p className="text-[10px] text-emerald-700 font-mono">
                Local offset: X={selectedPlant.x_m}m, Y={selectedPlant.y_m}m
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedPlant(null)}
            className="px-2.5 py-1 bg-white border border-emerald-300 text-emerald-800 rounded font-semibold text-[11px] hover:bg-emerald-100"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
