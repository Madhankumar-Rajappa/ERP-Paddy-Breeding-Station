import React, { useState, useEffect } from 'react';
import { Map, Layers, ChevronRight, CheckSquare, Square, Info } from 'lucide-react';
import GisMap from '../components/GisMap';
import api from '../services/api';

export default function GisPage() {
  const [plot, setPlot] = useState(null);

  useEffect(() => {
    fetchPlotInfo();
  }, []);

  const fetchPlotInfo = async () => {
    try {
      const res = await api.get('/plots/1');
      setPlot(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Map className="w-5 h-5 text-emerald-600" /> GIS Field Mapping & Spatial Boundary Module
          </h1>
          <p className="text-xs text-slate-500">
            Interactive GIS polygon feature representation for plot E4A with vertex boundary editing & QGIS GeoJSON compatibility.
          </p>
        </div>
      </div>

      {/* Main Split Layout: Left Station Tree Panel, Right Interactive GIS Map */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Tree Hierarchy Panel */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center justify-between border-b pb-2">
            <span>Station Hierarchy</span>
            <Layers className="w-4 h-4 text-emerald-600" />
          </h3>

          <div className="space-y-2 text-xs">
            {/* Level 1: Station */}
            <div className="space-y-1">
              <div className="font-bold text-emerald-950 flex items-center gap-1.5 p-1.5 bg-emerald-50 rounded border border-emerald-200">
                <ChevronRight className="w-3.5 h-3.5 text-emerald-600" />
                <span>Central Paddy Station (CGIAR)</span>
              </div>

              {/* Level 2: Block */}
              <div className="pl-4 space-y-1">
                <div className="font-semibold text-slate-800 flex items-center gap-1.5 p-1 bg-slate-50 rounded">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  <span>Block E (Experimental Field)</span>
                </div>

                {/* Level 3: Plot E4A */}
                <div className="pl-4">
                  <div className="p-2 bg-emerald-600 text-white font-bold rounded-lg shadow-sm flex items-center justify-between">
                    <span>Plot E4A</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-800 text-emerald-100 font-mono">
                      {plot?.status || 'Planted'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Plot Quick Measurements Summary Card */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
            <div className="font-bold text-slate-800 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-emerald-600" /> E4A Field Measurements
            </div>
            <div className="space-y-1 text-slate-600 font-mono text-[11px]">
              <div>North: <b>{plot?.north_length_m} m</b></div>
              <div>South: <b>{plot?.south_length_m} m</b></div>
              <div>East: <b>{plot?.east_length_m} m</b></div>
              <div>West: <b>{plot?.west_length_m} m</b></div>
              <div>Additional: <b>{plot?.additional_measurement_value} {plot?.additional_measurement_unit}</b></div>
            </div>
          </div>
        </div>

        {/* Right Panel: GisMap */}
        <div className="lg:col-span-3">
          <GisMap plotId={1} showGridOverlay={true} />
        </div>
      </div>
    </div>
  );
}
