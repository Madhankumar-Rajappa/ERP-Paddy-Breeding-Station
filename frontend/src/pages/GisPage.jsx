import React, { useState, useEffect } from 'react';
import { Map, Layers, ChevronRight, Info } from 'lucide-react';
import GisMap from '../components/GisMap';
import api from '../services/api';

export default function GisPage() {
  const [plots, setPlots] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [selectedPlotId, setSelectedPlotId] = useState(1);
  const [selectedPlot, setSelectedPlot] = useState(null);

  const fetchStationData = async () => {
    try {
      const [plotsRes, blocksRes] = await Promise.all([
        api.get('/plots'),
        api.get('/gis/blocks')
      ]);
      const e4aPlots = plotsRes.data.filter(p => p.plot_code?.toUpperCase() === 'E4A');
      const filteredPlots = e4aPlots.length > 0 ? e4aPlots : plotsRes.data.slice(0, 1);
      setPlots(filteredPlots);
      setBlocks(blocksRes.data);
      if (filteredPlots.length > 0) {
        setSelectedPlotId(filteredPlots[0].id);
        setSelectedPlot(filteredPlots[0]);
      }
    } catch (err) {
      console.error('Error fetching station data in GisPage:', err);
    }
  };

  useEffect(() => {
    fetchStationData();
  }, []);

  const handleSelectPlot = (pId) => {
    setSelectedPlotId(pId);
    const p = plots.find(item => item.id === pId);
    if (p) setSelectedPlot(p);
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
            TNAU Paddy Breeding Station, Unnamed Road, Vedapatti, Tamil Nadu 641039 (Plus Code: XWW8+4HP • 10.9953°N, 76.9165°E) • Interactive GIS polygons, QGIS GeoJSON & RBD spatial layout.
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
            <div className="space-y-2">
              <div className="font-bold text-emerald-950 flex items-center gap-1.5 p-1.5 bg-emerald-50 rounded border border-emerald-200">
                <ChevronRight className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <div className="min-w-0">
                  <span className="block truncate font-bold">TNAU Paddy Breeding Station</span>
                  <span className="block text-[10px] text-emerald-700 font-normal truncate">XWW8+4HP, Vedapatti, TN 641039</span>
                </div>
              </div>

              {/* Level 2: Blocks & Plots */}
              <div className="pl-2 space-y-2">
                {blocks
                  .filter((bk) => plots.some((p) => p.block_id === bk.id))
                  .map((bk) => {
                    const blockPlots = plots.filter((p) => p.block_id === bk.id);
                  return (
                    <div key={bk.id} className="space-y-1">
                      <div className="font-semibold text-slate-800 text-[11px] flex items-center gap-1.5 p-1 bg-slate-100 rounded">
                        <ChevronRight className="w-3 h-3 text-slate-500" />
                        <span className="truncate">{bk.name}</span>
                        <span className="text-[10px] ml-auto text-slate-500 font-mono">({blockPlots.length})</span>
                      </div>

                      {/* Level 3: Plots List */}
                      <div className="pl-3 space-y-1">
                        {blockPlots.map((p) => {
                          const isSelected = p.id === selectedPlotId;
                          return (
                            <div
                              key={p.id}
                              onClick={() => handleSelectPlot(p.id)}
                              className={`p-1.5 rounded-lg text-[11px] font-bold flex items-center justify-between cursor-pointer transition ${
                                isSelected
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : 'bg-slate-50 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              <span className="truncate">{p.plot_code} - {p.name}</span>
                              <span className={`text-[9px] px-1 py-0.2 rounded font-mono ml-1 shrink-0 ${
                                isSelected ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-200 text-slate-600'
                              }`}>
                                {p.status || 'Planned'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Plot Quick Measurements Summary Card */}
          {selectedPlot && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="font-bold text-slate-800 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-emerald-600" /> {selectedPlot.plot_code} Field Measurements
              </div>
              <div className="space-y-1 text-slate-600 font-mono text-[11px]">
                <div>North: <b>{selectedPlot.north_length_m} m</b></div>
                <div>South: <b>{selectedPlot.south_length_m} m</b></div>
                <div>East: <b>{selectedPlot.east_length_m} m</b></div>
                <div>West: <b>{selectedPlot.west_length_m} m</b></div>
                <div>Area: <b>{selectedPlot.area_sqm || '-'} m²</b></div>
                <div>Additional: <b>{selectedPlot.additional_measurement_value} {selectedPlot.additional_measurement_unit}</b></div>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: GisMap */}
        <div className="lg:col-span-3">
          <GisMap
            plotId={selectedPlotId}
            onSelectPlot={handleSelectPlot}
            showGridOverlay={true}
          />
        </div>
      </div>
    </div>
  );
}
