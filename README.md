# GIS + ERP Based Paddy Breeding Plot Planning & Trial Management System

A runnable full-stack GIS + ERP software prototype developed for Paddy Breeding Stations. Built around the **E4A** plot (North: 36m, East: 30m, West: 31.2m, South: 34.8m, Additional measurement: 80cm optional bund width), with a generic, extensible database architecture that scales seamlessly to E4B, E4C, D43, and other station plots without application code modifications.

---

## Architecture Overview

```
User (Browser)
   ↓
React 18 Web Application (Vite + Tailwind CSS + Leaflet + Recharts)
   ↓ (REST API / JWT)
FastAPI Backend (Python 3.12 + SQLAlchemy 2.0 + Pydantic v2)
   ↓ (Spatial Operations)
Shapely Geometry Engine (Polygon Clipping & Point-in-Polygon)
   ↓
PostgreSQL / PostGIS (or SQLite + GeoJSON JSON fallback)
```

---

## Major Modules

1. **GIS & Field Mapping (`/gis`)**:
   - Interactive Leaflet map with Station Boundary, Block E Boundary, and Plot E4A polygon.
   - Interactive Boundary Vertex Editor (drag/add/delete vertices, recalculate area/perimeter).
   - QGIS-compatible GeoJSON Export and Import.
   - Spatial overlay of dynamic plant grid points.

2. **Dynamic Plot Design Engine (`/designer`)**:
   - Spacing calculations based on available length & width.
   - Polygon clipping via Shapely ensuring no planting points fall outside plot bunds.
   - Randomized Complete Block Design (RBD) generator with seed reproducibility.
   - Layout Versioning (`v1`, `v2`, `v3...`).
   - Interactive Graphical Canvas/SVG Grid Visualizer with cell popup details.

3. **ERP & Trial Management (`/trials`, `/varieties`, `/planting`, `/observations`, `/harvest`)**:
   - Paddy Variety Master CRUD & search.
   - Trial management & entry assignment.
   - Planting status execution tracking (`Planned` -> `Planted` -> `Growing` -> `Harvesting` -> `Harvested`).
   - Configurable Trait Master & field observation recorder.
   - Harvest yield logging (`kg/plot`, 1000-grain weight, moisture percentage).

4. **Analytics & Reporting (`/dashboard`, `/reports`)**:
   - Master E4A dashboard with KPI cards, Recharts variety pie chart, and lifecycle history.
   - Automated PDF evaluation report generator via ReportLab & CSV export.

---

## Demo Credentials

| Role | Username | Password |
| :--- | :--- | :--- |
| **Administrator** | `admin` | `admin123` |
| **Researcher** | `researcher` | `researcher123` |
| **Field Staff** | `fieldstaff` | `field123` |

---

## Quick Start Guide (One-Click Windows Batch File)

Simply **double-click** `run_project.bat` in the project root directory!

It will automatically:
1. Seed the database with plot E4A & demo varieties
2. Start the FastAPI backend server on port 8000
3. Start the React Vite web application on port 4173
4. Automatically open your web browser to `http://127.0.0.1:4173`

---

## Manual Startup Commands

### 1. Backend Setup
```bash
cd backend
python seed.py
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```
- Interactive Swagger API Docs: `http://127.0.0.1:8000/docs`

### 2. Frontend Setup
```bash
cd frontend
npm run preview -- --host 127.0.0.1 --port 4173
```
- Web Application URL: `http://127.0.0.1:4173` (or dev server `npm run dev` at `http://127.0.0.1:5173`)

---

## Test Suite Execution
```bash
cd backend
python -m pytest tests/test_api.py
```
