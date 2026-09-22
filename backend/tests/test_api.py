import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["prototype_plot"] == "E4A"

def test_auth_login():
    response = client.post("/api/v1/auth/login", json={
        "username": "researcher",
        "password": "researcher123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "Researcher"

def test_get_e4a_plot():
    response = client.get("/api/v1/plots/1")
    assert response.status_code == 200
    data = response.json()
    assert data["plot_code"] == "E4A"
    assert data["north_length_m"] == 36.0
    assert data["east_length_m"] == 30.0
    assert data["west_length_m"] == 31.2
    assert data["south_length_m"] == 34.8
    assert data["additional_measurement_value"] == 80.0

def test_gis_layers():
    response = client.get("/api/v1/gis/layers")
    assert response.status_code == 200
    data = response.json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) >= 1

def test_variety_list():
    response = client.get("/api/v1/varieties")
    assert response.status_code == 200
    varieties = response.json()
    assert len(varieties) >= 1

def test_layout_generation():
    req = {
        "plot_id": 1,
        "trial_id": 1,
        "design_type": "RBD",
        "num_rows": 15,
        "row_spacing_cm": 20.0,
        "plant_spacing_cm": 15.0,
        "border_buffer_m": 0.5,
        "pathway_width_m": 0.5,
        "num_entries": 5,
        "num_replications": 3,
        "randomization_seed": 42
    }
    response = client.post("/api/v1/layouts/generate", json=req)
    assert response.status_code == 200
    grid = response.json()
    assert "summary" in grid
    assert grid["summary"]["estimated_rows"] == 15
    assert grid["summary"]["total_valid_plants"] > 0

def test_layout_saving():
    req = {
        "plot_id": 1,
        "trial_id": 1,
        "design_type": "RBD",
        "num_rows": 15,
        "row_spacing_cm": 20.0,
        "plant_spacing_cm": 15.0,
        "border_buffer_m": 0.5,
        "pathway_width_m": 0.5,
        "num_entries": 5,
        "num_replications": 3,
        "randomization_seed": 42
    }
    response = client.post("/api/v1/layouts", json=req)
    assert response.status_code == 200
    layout = response.json()
    assert layout["plot_id"] == 1
    assert layout["version_number"] >= 1

def test_dashboard_summary():
    response = client.get("/api/v1/dashboard/plots/1")
    assert response.status_code == 200
    summary = response.json()
    assert summary["plot"]["plot_code"] == "E4A"
    assert summary["trial"]["trial_code"] == "TR-E4A-2026"

def test_pdf_report():
    response = client.get("/api/v1/reports/pdf/1")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
