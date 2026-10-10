import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup, Tooltip, LayersControl, LayerGroup, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { Edit3, Check, X, Download, Upload, Ruler, Search, MapPin, FileText } from 'lucide-react';
import api from '../services/api';

// Fix Leaflet default marker icon bug in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Convert GeoJSON coordinates for Leaflet
export function getLeafletPolygonCoords(geojsonStr) {
  if (!geojsonStr) return [];
  try {
    const geo = typeof geojsonStr === 'string' ? JSON.parse(geojsonStr) : geojsonStr;
    return geo.coordinates[0].map(c => [c[1], c[0]]);
  } catch {
    return [];
  }
}

// Helper component to center map on plot geometry
function MapRecenter({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords.length > 0) {
      map.fitBounds(coords, { padding: [50, 50], maxZoom: 19 });
    }
  }, [coords, map]);
  return null;
}

export default function GisMap({ plotId = 1, onSelectPlot, showGridOverlay = true }) {
  const navigate = useNavigate();
  const [layersData, setLayersData] = useState(null);
  const [e4aPlot, setE4aPlot] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editableCoords, setEditableCoords] = useState([]);
  const [focusCoords, setFocusCoords] = useState(null);
  const [activeLayout, setActiveLayout] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMeasurementTool, setShowMeasurementTool] = useState(false);
  const [sketchModalOpen, setSketchModalOpen] = useState(false);

  // Default center lat/lng for TNAU Paddy Breeding Station (PBS), Vedapatti, Tamil Nadu 641039 (Plus Code: XWW8+4HP)
  const defaultCenter = [10.99534, 76.91645];
  const [stationBounds, setStationBounds] = useState(null);

  const fetchLayers = async () => {
    try {
      const res = await api.get('/gis/layers');
      setLayersData(res.data);
      const st = res.data?.features?.find(f => f.properties?.layer_type === 'station');
      if (st?.geometry) {
        const coords = getLeafletPolygonCoords(st.geometry);
        if (coords.length > 0) setStationBounds(coords);
      }
    } catch (err) {
      console.error('Error fetching GIS layers:', err);
    }
  };

  const fetchPlotDetail = useCallback(async () => {
    try {
      const res = await api.get(`/plots/${plotId}`);
      setE4aPlot(res.data);
      if (res.data.geometry_geojson) {
        const geo = JSON.parse(res.data.geometry_geojson);
        // Leaflet expects [lat, lng] arrays
        const leafletCoords = geo.coordinates[0].map(c => [c[1], c[0]]);
        setEditableCoords(leafletCoords);
        setFocusCoords(leafletCoords);
      }
      
      // Fetch latest layout for grid overlay
      const layoutsRes = await api.get(`/layouts/plots/${plotId}`);
      if (layoutsRes.data && layoutsRes.data.length > 0) {
        const detailRes = await api.get(`/layouts/${layoutsRes.data[0].id}`);
        setActiveLayout(detailRes.data.grid);
      }
    } catch (err) {
      console.error('Error fetching plot detail:', err);
    }
  }, [plotId]);

  useEffect(() => {
    fetchLayers();
  }, []);

  useEffect(() => {
    fetchPlotDetail();
  }, [fetchPlotDetail]);


  const plotPolygonCoords = editMode ? editableCoords : (e4aPlot ? getLeafletPolygonCoords(e4aPlot.geometry_geojson) : []);

  // Update vertex marker during boundary editing
  const handleVertexDrag = (idx, e) => {
    const { lat, lng } = e.target.getLatLng();
    const newCoords = [...editableCoords];
    newCoords[idx] = [lat, lng];
    // Keep polygon closed if first/last
    if (idx === 0) newCoords[newCoords.length - 1] = [lat, lng];
    if (idx === newCoords.length - 1) newCoords[0] = [lat, lng];
    setEditableCoords(newCoords);
  };

  const handleSaveBoundary = async () => {
    try {
      const geojsonCoords = editableCoords.map(c => [c[1], c[0]]);
      const newGeojson = {
        type: 'Polygon',
        coordinates: [geojsonCoords]
      };
      
      await api.put(`/plots/${plotId}/geometry`, {
        geometry_geojson: JSON.stringify(newGeojson),
        notes: 'User edited vertex boundaries via interactive GIS tool'
      });
      
      setMessage('Plot boundary saved successfully!');
      setEditMode(false);
      fetchPlotDetail();
      fetchLayers();
    } catch (err) {
      console.error('Error saving boundary:', err);
      setMessage('Failed to save boundary.');
    }
  };

  const handleExportGeoJSON = async () => {
    try {
      const res = await api.get(`/gis/plots/${plotId}/geojson`);
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `Plot_${e4aPlot?.plot_code || 'E4A'}_boundary.geojson`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error('Error exporting GeoJSON:', err);
    }
  };

  const handleImportGeoJSON = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      await api.post(`/gis/plots/${plotId}/geojson/import`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage('GeoJSON boundary imported successfully!');
      setImportModalOpen(false);
      fetchPlotDetail();
      fetchLayers();
    } catch (err) {
      console.error('Error importing GeoJSON:', err);
      setMessage('Invalid GeoJSON file or import failed.');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const query = searchQuery.trim().toLowerCase();
    if (!query) return;
    const foundPlot = layersData?.features?.find(f => 
      f.properties?.layer_type === 'plot' && 
      (f.properties?.plot_code?.toUpperCase() === 'E4A' || f.properties?.code?.toUpperCase() === 'E4A') &&
      (f.properties?.plot_code?.toLowerCase().includes(query) || f.properties?.name?.toLowerCase().includes(query))
    );
    if (foundPlot) {
      setDrawerOpen(true);
      setMessage(`Found Plot ${foundPlot.properties.plot_code} on GIS map!`);
      if (onSelectPlot && foundPlot.properties.id) {
        onSelectPlot(foundPlot.properties.id);
      }
    } else {
      setMessage(`Plot "${searchQuery}" not found on GIS map.`);
    }
  };

  return (
    <div className="relative w-full h-[620px] rounded-xl overflow-hidden shadow-xl border border-slate-200">
      {/* Top Map Toolbar Container - Leaves top-right corner clear for Leaflet LayersControl */}
      <div className="absolute top-3 left-3 right-16 z-[400] flex flex-col items-start gap-2 pointer-events-none">
        {/* Row 1: Station Location Info Badge & Search Bar */}
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-950/90 text-white backdrop-blur-md rounded-lg shadow-md border border-emerald-700 text-xs font-bold max-w-fit">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate max-w-[240px] sm:max-w-none">PBS • XWW8+4HP, Vedapatti (10.9953°N, 76.9165°E)</span>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex items-center bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg shadow-md border border-slate-200 text-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 mr-1.5 shrink-0" />
            <input
              type="text"
              placeholder="Search GIS plot (e.g. E4A)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-36 sm:w-44 bg-transparent text-slate-800 focus:outline-none"
            />
            <button type="submit" className="px-2 py-0.5 bg-emerald-600 text-white rounded font-bold text-[10px] hover:bg-emerald-700">
              Search
            </button>
          </form>
        </div>

        {/* Row 2: GIS Tool Actions */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-lg shadow-md border border-slate-200 text-xs max-w-fit">
          <button
            onClick={() => {
              if (stationBounds && stationBounds.length > 0) {
                setFocusCoords(stationBounds);
                setMessage('Zoomed to TNAU Paddy Breeding Station (XWW8+4HP, Vedapatti, TN)');
              } else {
                setMessage('Station boundary loading...');
              }
            }}
            className="flex items-center space-x-1 px-2.5 py-1 bg-emerald-800 text-emerald-100 rounded font-bold hover:bg-emerald-900 transition shadow-sm"
            title="Recenter to entire TNAU Station"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-300" />
            <span>Overview</span>
          </button>

          {!editMode ? (
            <button
              onClick={() => setEditMode(true)}
              className="flex items-center space-x-1 px-2.5 py-1 bg-emerald-700 text-white rounded font-bold hover:bg-emerald-800 transition shadow-sm"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Boundary</span>
            </button>
          ) : (
            <div className="flex items-center space-x-1">
              <button
                onClick={handleSaveBoundary}
                className="flex items-center space-x-1 px-2.5 py-1 bg-emerald-600 text-white rounded font-bold hover:bg-emerald-700 shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
              <button
                onClick={() => setEditMode(false)}
                className="flex items-center space-x-1 px-2.5 py-1 bg-slate-500 text-white rounded font-bold hover:bg-slate-600"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            </div>
          )}

          <button
            onClick={() => setSketchModalOpen(true)}
            className="flex items-center space-x-1 px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-300 rounded font-bold hover:bg-amber-100 transition shadow-sm"
            title="View Original Handwritten Field Dimensions (E4a)"
          >
            <FileText className="w-3.5 h-3.5 text-amber-700" />
            <span>Field Note</span>
          </button>

          <button
            onClick={() => setShowMeasurementTool(!showMeasurementTool)}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded font-bold transition ${
              showMeasurementTool ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Ruler className="w-3.5 h-3.5" />
            <span>Measure</span>
          </button>

          <button
            onClick={handleExportGeoJSON}
            className="flex items-center space-x-1 px-2.5 py-1 bg-slate-800 text-slate-200 rounded font-bold hover:bg-slate-900 transition"
            title="Export GeoJSON for QGIS"
          >
            <Download className="w-3.5 h-3.5" />
            <span>GeoJSON</span>
          </button>

          <button
            onClick={() => setImportModalOpen(true)}
            className="flex items-center space-x-1 px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-300 rounded font-bold hover:bg-slate-200"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import</span>
          </button>
        </div>
      </div>

      {/* Measurement Tool Overlay Banner */}
      {showMeasurementTool && (
        <div className="absolute top-28 left-3 z-[400] bg-slate-900/90 backdrop-blur-md text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs w-72 space-y-1">
          <div className="font-bold text-amber-400 flex items-center justify-between border-b border-slate-700 pb-1">
            <span className="flex items-center gap-1.5"><Ruler className="w-4 h-4" /> GIS Spatial Measurement Tool</span>
            <button onClick={() => setShowMeasurementTool(false)} className="text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1 text-[11px] pt-1">
            <div>GIS Area: <b className="text-emerald-400">{e4aPlot?.area_sqm || 1083.6} m²</b></div>
            <div>Perimeter: <b className="text-emerald-400">{e4aPlot?.perimeter_m || 132.0} m</b></div>
            <div>Handwritten North: <b className="text-amber-300">{e4aPlot?.north_length_m || 36.0} m</b></div>
            <div>Handwritten East: <b className="text-amber-300">{e4aPlot?.east_length_m || 30.0} m</b></div>
            <div>Handwritten South: <b className="text-amber-300">{e4aPlot?.south_length_m || 34.8} m</b></div>
            <div>Handwritten West: <b className="text-amber-300">{e4aPlot?.west_length_m || 31.2} m</b></div>
            <div className="col-span-2 pt-1 border-t border-slate-700 text-[10px] text-slate-300">
              Address: <b className="text-white">XWW8+4HP Vedapatti, TN 641039</b>
            </div>
          </div>
        </div>
      )}

      {message && (
        <div className="absolute bottom-4 left-4 z-[400] bg-slate-900/95 text-white px-3.5 py-2 rounded-xl text-xs shadow-xl animate-fade-in border border-slate-700">
          {message}
        </div>
      )}

      {/* Main Leaflet Map */}
      <MapContainer
        center={defaultCenter}
        zoom={18}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="OpenStreetMap (Standard)">
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satellite View (Esri Imagery)">
            <TileLayer
              attribution='&copy; Esri World Imagery'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="CartoDB Light">
            <TileLayer
              attribution='&copy; CartoDB'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
          </LayersControl.BaseLayer>

          {/* Station & Block Boundaries */}
          <LayersControl.Overlay checked name="Station & Block Boundaries">
            <LayerGroup>
              {layersData?.features
                ?.filter(f => f.properties.layer_type === 'station')
                .map((st, idx) => (
                  <Polygon
                    key={`st-${idx}`}
                    positions={getLeafletPolygonCoords(st.geometry)}
                    pathOptions={{ color: '#1b4332', weight: 2, dashArray: '6, 6', fillOpacity: 0.05 }}
                  />
                ))}
              {layersData?.features
                ?.filter(f => f.properties.layer_type === 'block')
                .map((bk, idx) => (
                  <Polygon
                    key={`bk-${idx}`}
                    positions={getLeafletPolygonCoords(bk.geometry)}
                    pathOptions={{ color: '#2d6a4f', weight: 2, fillOpacity: 0.08 }}
                  />
                ))}
            </LayerGroup>
          </LayersControl.Overlay>

          {/* Benchmark Plot E4A Boundary Layer */}
          <LayersControl.Overlay checked name="Plot E4a Boundary">
            <LayerGroup>
              {layersData?.features
                ?.filter(f => f.properties.layer_type === 'plot' && (f.properties.plot_code?.toUpperCase() === 'E4A' || f.properties.code?.toUpperCase() === 'E4A'))
                .map((pt) => {
                  const isSelected = pt.properties.id === plotId;
                  const positions = (isSelected && editMode && editableCoords.length > 0)
                    ? editableCoords
                    : getLeafletPolygonCoords(pt.geometry);

                  if (!positions || positions.length === 0) return null;

                  let strokeColor = '#3b82f6';
                  let fillColor = '#93c5fd';
                  if (isSelected) {
                    strokeColor = editMode ? '#ef4444' : '#10b981';
                    fillColor = '#34d399';
                  } else if (pt.properties.status === 'Planted') {
                    strokeColor = '#059669';
                    fillColor = '#6ee7b7';
                  } else if (pt.properties.status === 'Growing') {
                    strokeColor = '#16a34a';
                    fillColor = '#86efac';
                  } else if (pt.properties.status === 'Prepared') {
                    strokeColor = '#d97706';
                    fillColor = '#fde68a';
                  } else if (pt.properties.status === 'Harvested') {
                    strokeColor = '#475569';
                    fillColor = '#cbd5e1';
                  }

                  return (
                    <Polygon
                      key={`plot-${pt.properties.id}`}
                      positions={positions}
                      pathOptions={{
                        color: strokeColor,
                        weight: isSelected ? 3.5 : 2,
                        fillColor: fillColor,
                        fillOpacity: isSelected ? 0.45 : 0.22,
                        dashArray: isSelected ? undefined : '4, 4'
                      }}
                      eventHandlers={{
                        click: () => {
                          if (onSelectPlot) onSelectPlot(pt.properties.id);
                          setDrawerOpen(true);
                          const c = getLeafletPolygonCoords(pt.geometry);
                          if (c.length > 0) setFocusCoords(c);
                        }
                      }}
                    >
                      <Tooltip permanent={false} direction="center">
                        <span className="font-bold text-xs">{pt.properties.plot_code}</span>
                      </Tooltip>
                      <Popup>
                        <div className="p-1 space-y-2 text-xs">
                          <div className="flex items-center justify-between border-b pb-1">
                            <span className="font-bold text-sm text-emerald-900">{pt.properties.plot_code} - {pt.properties.name}</span>
                            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              {pt.properties.status || 'Planned'}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600 font-mono">
                            <div>North: <b>{pt.properties.north_length_m} m</b></div>
                            <div>South: <b>{pt.properties.south_length_m} m</b></div>
                            <div>East: <b>{pt.properties.east_length_m} m</b></div>
                            <div>West: <b>{pt.properties.west_length_m} m</b></div>
                            <div>Area: <b>{pt.properties.area_sqm || '-'} m²</b></div>
                            <div>Perimeter: <b>{pt.properties.perimeter_m || '-'} m</b></div>
                          </div>

                          {pt.properties.additional_measurement_value && (
                            <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                              <span className="text-[10px] text-slate-500 block">Field Note:</span>
                              <span className="font-semibold text-slate-700">
                                {pt.properties.additional_measurement_value} {pt.properties.additional_measurement_unit}
                              </span>
                            </div>
                          )}

                          {pt.properties.current_trial && (
                            <div className="bg-emerald-50 p-1.5 rounded border border-emerald-200">
                              <span className="text-[10px] text-emerald-700 font-bold block">Active Trial:</span>
                              <span className="text-slate-800 font-semibold">{pt.properties.current_trial.name}</span>
                              <span className="block text-[10px] text-slate-500 font-mono">Design: {pt.properties.current_trial.design} | {pt.properties.current_trial.crop}</span>
                            </div>
                          )}

                          <div className="pt-1 flex gap-1">
                            <button
                              onClick={() => {
                                if (onSelectPlot) onSelectPlot(pt.properties.id);
                                setDrawerOpen(true);
                                const c = getLeafletPolygonCoords(pt.geometry);
                                if (c.length > 0) setFocusCoords(c);
                              }}
                              className="w-full py-1 bg-emerald-600 text-white font-bold rounded text-[11px] hover:bg-emerald-700 transition"
                            >
                              Select Field & Open Drawer
                            </button>
                          </div>
                        </div>
                      </Popup>
                    </Polygon>
                  );
                })}

              {/* Draggable Vertex Markers in Edit Mode */}
              {editMode && editableCoords.map((coord, idx) => (
                <Marker
                  key={`vertex-${idx}`}
                  position={coord}
                  draggable={true}
                  eventHandlers={{
                    drag: (e) => handleVertexDrag(idx, e)
                  }}
                />
              ))}
            </LayerGroup>
          </LayersControl.Overlay>

          {/* Spatial Planting Grid Overlay */}
          {showGridOverlay && activeLayout && (
            <LayersControl.Overlay checked name="Spatial Planting Grid Points">
              <LayerGroup>
                {activeLayout.rows_grid?.flatMap((row, rIdx) =>
                  row.plants?.map((p, pIdx) => (
                    <CircleMarker
                      key={`p-${rIdx}-${pIdx}`}
                      center={[p.lat, p.lng]}
                      radius={3.5}
                      pathOptions={{
                        color: '#059669',
                        fillColor: '#10b981',
                        fillOpacity: 0.9,
                        weight: 1
                      }}
                      eventHandlers={{
                        click: () => setSelectedUnit({ ...p, row: row.row_number, replication: row.replication, unit_code: row.unit_code })
                      }}
                    />
                  ))
                )}
              </LayerGroup>
            </LayersControl.Overlay>
          )}
        </LayersControl>

        {(focusCoords || plotPolygonCoords).length > 0 && <MapRecenter coords={focusCoords || plotPolygonCoords} />}
      </MapContainer>

      {/* Selected Unit Popup Overlay */}
      {selectedUnit && (
        <div className="absolute bottom-4 right-4 z-[400] bg-white p-3 rounded-xl shadow-xl border border-slate-200 w-64 text-xs">
          <div className="flex items-center justify-between border-b pb-1.5 mb-2">
            <span className="font-bold text-slate-800">Planting Unit {selectedUnit.unit_code}</span>
            <button onClick={() => setSelectedUnit(null)} className="text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-1 text-slate-600">
            <div>Variety: <b className="text-emerald-800">{selectedUnit.variety_name}</b></div>
            <div>Replication: <b>Rep {selectedUnit.replication}</b></div>
            <div>Row #{selectedUnit.row} | Position #{selectedUnit.position_number}</div>
            <div>Coordinates: <span className="font-mono text-[10px]">{selectedUnit.lat.toFixed(5)}, {selectedUnit.lng.toFixed(5)}</span></div>
          </div>
        </div>
      )}

      {/* Interactive Plot GIS Side Drawer */}
      {drawerOpen && (
        <div className="absolute top-0 right-0 bottom-0 w-80 bg-white/95 backdrop-blur-xl border-l border-slate-200 shadow-2xl z-[500] p-5 space-y-4 text-xs overflow-y-auto animate-slide-in">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
              <h3 className="font-extrabold text-slate-900 text-base">{e4aPlot?.plot_code || 'Field'} GIS Drawer</h3>
            </div>
            <button onClick={() => setDrawerOpen(false)} className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Measurements */}
          <div className="space-y-2">
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">Field Measurements</span>
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border font-mono text-slate-700">
              <div>North: <b>{e4aPlot?.north_length_m} m</b></div>
              <div>South: <b>{e4aPlot?.south_length_m} m</b></div>
              <div>East: <b>{e4aPlot?.east_length_m} m</b></div>
              <div>West: <b>{e4aPlot?.west_length_m} m</b></div>
            </div>
          </div>

          {/* Additional Field Note */}
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg space-y-1">
            <span className="font-bold text-emerald-950 block">Additional Field Note</span>
            <span className="text-emerald-800 font-mono font-bold text-sm">
              {e4aPlot?.additional_measurement_value} {e4aPlot?.additional_measurement_unit}
            </span>
            <span className="text-[10px] text-emerald-700 block italic">({e4aPlot?.additional_measurement_description})</span>
          </div>

          {/* GIS Geometry Stats */}
          <div className="space-y-2">
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">Calculated GIS Geometry</span>
            <div className="space-y-1 bg-slate-50 p-3 rounded-lg border text-slate-600">
              <div>Calculated Area: <b className="text-slate-900 font-mono">{e4aPlot?.area_sqm} m²</b></div>
              <div>Perimeter: <b className="text-slate-900 font-mono">{e4aPlot?.perimeter_m} m</b></div>
              <div>CRS: <b className="text-slate-900 font-mono">{e4aPlot?.crs}</b></div>
              <div>Geometry Source: <b className="text-emerald-700">{e4aPlot?.geometry_source}</b></div>
            </div>
          </div>

          {/* ERP Quick Action Navigation Buttons */}
          <div className="space-y-2 border-t pt-3">
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">ERP Workflow Actions</span>
            <button
              onClick={() => navigate('/plots')}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs shadow-sm transition"
            >
              Open Plot Master Details
            </button>
            <button
              onClick={() => navigate('/trials')}
              className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs shadow-sm transition"
            >
              Create / View Trial
            </button>
            <button
              onClick={() => navigate('/designer')}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-sm transition"
            >
              Design Layout Grid
            </button>
            <button
              onClick={() => navigate('/layout-history')}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold text-xs transition border"
            >
              View History
            </button>
          </div>
        </div>
      )}

      {/* Import GeoJSON Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 z-[600] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-emerald-600" /> Import Plot GeoJSON Boundary
              </h3>
              <button onClick={() => setImportModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-xs text-slate-500">
              Upload a QGIS or GPS-surveyed <code className="bg-slate-100 px-1 py-0.5 rounded font-bold text-slate-700">.geojson</code> file to replace the polygon for plot E4A.
            </p>

            <form onSubmit={handleImportGeoJSON} className="space-y-3">
              <input
                type="file"
                accept=".geojson,.json"
                onChange={(e) => setSelectedFile(e.target.files[0])}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
              />
              
              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setImportModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedFile}
                  className="px-4 py-1.5 text-xs bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 disabled:opacity-50 shadow-md"
                >
                  Upload & Update Boundary
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Field Note & Sketch Modal */}
      {sketchModalOpen && (
        <div className="fixed inset-0 z-[600] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-600" /> Plot E4a Handwritten Benchmark & Station Map
              </h3>
              <button onClick={() => setSketchModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <div><b>Address:</b> XWW8+4HP TNAU Paddy Breeding Station, Unnamed Road,, Vedapatti, Tamil Nadu 641039</div>
              <div><b>GIS Center:</b> 10.99534° N, 76.91645° E (Google Plus Code: <b>XWW8+4HP</b>)</div>
              <div><b>E4a Dimensions:</b> North 36m | East 30m | West 31.2m | South 34.8m (Bund: 80cm) | Area: ~1,083 m² (0.27 ac)</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-700 block">1. E4a Field Note (Handwritten Dimensions)</span>
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50 p-1">
                  <img src="/e4a_dimensions.png" alt="E4a Plot Dimensions" className="w-full h-64 object-contain rounded" />
                </div>
                <div className="text-[10px] text-slate-500 font-mono text-center">
                  North: 36m | East: 30m | West: 31.2m | South: 34.8m (80cm)
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-700 block">2. Station Master Field Sheet</span>
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50 p-1">
                  <img src="/plots_master_map.jpeg" alt="Master Field Map" className="w-full h-64 object-contain rounded" />
                </div>
                <div className="text-[10px] text-slate-500 font-mono text-center">
                  Plot E4a (0.29 ac) location inside Block E
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t">
              <button
                onClick={() => setSketchModalOpen(false)}
                className="px-4 py-1.5 text-xs bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
