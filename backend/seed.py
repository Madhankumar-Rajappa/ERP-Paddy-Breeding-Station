import json
from datetime import datetime, timezone
from app.db.session import SessionLocal, engine, Base
from app.core.security import hash_password
from app.models.models import (
    User, Station, Block, Plot, PlotGeometryVersion, Variety, Trial, TrialEntry,
    Layout, PlantingRecord, ObservationTrait, Observation, HarvestRecord,
    PlotStatusHistory, AuditLog
)
from app.services.gis_service import generate_prototype_polygon, calculate_area_and_perimeter
from app.services.layout_engine import generate_rbd_layout

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    try:
        # 1. Seed Users (Demo Accounts)
        users = [
            {
                "username": "admin",
                "email": "admin@paddy.station",
                "password": "admin123",
                "full_name": "Dr. System Administrator",
                "role": "Administrator"
            },
            {
                "username": "researcher",
                "email": "researcher@paddy.station",
                "password": "researcher123",
                "full_name": "Dr. Ananya Sharma (Lead Researcher)",
                "role": "Researcher"
            },
            {
                "username": "fieldstaff",
                "email": "field@paddy.station",
                "password": "field123",
                "full_name": "Ramesh Kumar (Field Officer)",
                "role": "Field Staff"
            }
        ]
        
        for u in users:
            existing = db.query(User).filter(User.username == u["username"]).first()
            if not existing:
                user_obj = User(
                    username=u["username"],
                    email=u["email"],
                    hashed_password=hash_password(u["password"]),
                    full_name=u["full_name"],
                    role=u["role"],
                    is_active=True
                )
                db.add(user_obj)
        db.commit()
        print("[SUCCESS] Users seeded successfully.")

        # 2. Seed Station & Block
        station = db.query(Station).filter(Station.station_code == "PBS-HYD").first()
        if not station:
            st_geo = {
                "type": "Polygon",
                "coordinates": [[[78.498, 17.498], [78.502, 17.498], [78.502, 17.502], [78.498, 17.502], [78.498, 17.498]]]
            }
            station = Station(
                station_code="PBS-HYD",
                name="Central Paddy Breeding Station (CGIAR)",
                description="Primary breeding research station for elite paddy lines",
                boundary_geojson=json.dumps(st_geo),
                location_name="Breeding Field Zone A"
            )
            db.add(station)
            db.commit()
            db.refresh(station)
            
        block = db.query(Block).filter(Block.block_code == "BLOCK-E").first()
        if not block:
            bk_geo = {
                "type": "Polygon",
                "coordinates": [[[78.499, 17.499], [78.501, 17.499], [78.501, 17.501], [78.499, 17.501], [78.499, 17.499]]]
            }
            block = Block(
                station_id=station.id,
                block_code="BLOCK-E",
                name="Block E (Experimental Plot Field)",
                description="Dedicated block for yield evaluation trials",
                boundary_geojson=json.dumps(bk_geo)
            )
            db.add(block)
            db.commit()
            db.refresh(block)
            
        print("[SUCCESS] Station and Block E seeded successfully.")

        # 3. Seed Plot E4A (First Prototype Plot)
        e4a = db.query(Plot).filter(Plot.plot_code == "E4A").first()
        if not e4a:
            e4a_poly_dict = generate_prototype_polygon(
                north_m=36.0,
                east_m=30.0,
                west_m=31.2,
                south_m=34.8
            )
            e4a_geo_str = json.dumps(e4a_poly_dict)
            area, perim = calculate_area_and_perimeter(e4a_geo_str)
            
            e4a = Plot(
                block_id=block.id,
                plot_code="E4A",
                name="Plot E4A (Kharif Experimental Unit)",
                description="DEMO: Reference plot for Kharif paddy breeding trial",
                north_length_m=36.0,
                east_length_m=30.0,
                west_length_m=31.2,
                south_length_m=34.8,
                additional_measurement_value=80.0,
                additional_measurement_unit="cm",
                additional_measurement_description="Handwritten 80 cm note (Likely bund width)",
                geometry_geojson=e4a_geo_str,
                area_sqm=area,
                perimeter_m=perim,
                status="Planted",
                geometry_source="Prototype / Local Coordinate Geometry"
            )
            db.add(e4a)
            db.commit()
            db.refresh(e4a)
            
            ver1 = PlotGeometryVersion(
                plot_id=e4a.id,
                version_number=1,
                geometry_geojson=e4a_geo_str,
                source="Prototype Geometry",
                notes="Initial handwritten dimensions N=36m, E=30m, W=31.2m, S=34.8m"
            )
            db.add(ver1)
            
            hist = PlotStatusHistory(
                plot_id=e4a.id,
                status="Planted",
                changed_by="Field Staff",
                notes="DEMO: Seeding planted state for evaluation"
            )
            db.add(hist)
            db.commit()
            
        print("[SUCCESS] Plot E4A seeded successfully.")

        # 4. Seed Paddy Varieties
        demo_varieties = [
            {"code": "CR-310", "name": "CR Dhan 310", "duration": 125, "desc": "High protein rice variety developed by NRRI"},
            {"code": "SW-SUB1", "name": "Swarna Sub1", "duration": 140, "desc": "Submergence tolerant mega variety"},
            {"code": "DRR-45", "name": "DRR Dhan 45", "duration": 130, "desc": "High zinc enriched biofortified rice"},
            {"code": "MTU-1010", "name": "MTU 1010", "duration": 115, "desc": "Popular early maturing short grain variety"},
            {"code": "IR-64", "name": "IR 64", "duration": 120, "desc": "Standard check variety for high yielding trials"}
        ]
        
        variety_objs = []
        for v in demo_varieties:
            existing_v = db.query(Variety).filter(Variety.variety_code == v["code"]).first()
            if not existing_v:
                existing_v = Variety(
                    variety_code=v["code"],
                    variety_name=v["name"],
                    duration_days=v["duration"],
                    description=v["desc"],
                    source="CGIAR / National Rice Station"
                )
                db.add(existing_v)
                db.commit()
                db.refresh(existing_v)
            variety_objs.append(existing_v)
            
        print("[SUCCESS] Demo Varieties seeded successfully.")

        # 5. Seed Demo Trial for E4A
        trial = db.query(Trial).filter(Trial.trial_code == "TR-E4A-2026").first()
        if not trial:
            trial = Trial(
                trial_code="TR-E4A-2026",
                name="E4A Yield Evaluation & Agronomic Performance Trial 2026",
                plot_id=e4a.id,
                crop="Paddy / Rice",
                season="Kharif 2026",
                year=2026,
                design_type="RBD",
                num_entries=len(variety_objs),
                num_replications=3,
                start_date="2026-06-15",
                expected_harvest_date="2026-10-25",
                status="Growing",
                notes="DEMO: Randomized Complete Block Design trial on plot E4A"
            )
            db.add(trial)
            db.commit()
            db.refresh(trial)
            
            for idx, v in enumerate(variety_objs):
                entry = TrialEntry(
                    trial_id=trial.id,
                    variety_id=v.id,
                    entry_number=idx + 1,
                    treatment_code=f"T{idx+1}"
                )
                db.add(entry)
            db.commit()
            
        print("[SUCCESS] Demo Trial seeded successfully.")

        # 6. Seed Demo Layout v1
        layout = db.query(Layout).filter(Layout.trial_id == trial.id).first()
        if not layout:
            layout_data = generate_rbd_layout(
                plot_geometry_geojson=e4a.geometry_geojson,
                north_m=36.0,
                east_m=30.0,
                west_m=31.2,
                south_m=34.8,
                num_rows=15,
                row_spacing_cm=20.0,
                plant_spacing_cm=15.0,
                border_buffer_m=0.5,
                pathway_width_m=0.5,
                num_entries=5,
                num_replications=3,
                varieties=[{"id": v.id, "variety_code": v.variety_code, "variety_name": v.variety_name} for v in variety_objs],
                randomization_seed=42
            )
            
            params = {
                "plot_id": e4a.id,
                "trial_id": trial.id,
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
            
            layout = Layout(
                plot_id=e4a.id,
                trial_id=trial.id,
                version_number=1,
                design_type="RBD",
                num_rows=15,
                row_spacing_cm=20.0,
                plant_spacing_cm=15.0,
                border_buffer_m=0.5,
                pathway_width_m=0.5,
                randomization_seed=42,
                parameters_json=json.dumps(params),
                generated_grid_json=json.dumps(layout_data),
                status="Active",
                created_by="Researcher"
            )
            db.add(layout)
            db.commit()
            db.refresh(layout)
            
        print("[SUCCESS] Demo Layout v1 seeded successfully.")

        # 7. Seed Planting Record
        planting = db.query(PlantingRecord).filter(PlantingRecord.trial_id == trial.id).first()
        if not planting:
            planting = PlantingRecord(
                trial_id=trial.id,
                plot_id=e4a.id,
                layout_id=layout.id,
                planting_date="2026-06-20",
                status="Planted",
                updated_by="Ramesh Kumar (Field Officer)",
                notes="DEMO: All 15 rows transplanted into flooded paddy soil."
            )
            db.add(planting)
            db.commit()

        # 8. Seed Observation Traits & Field Observations
        traits = [
            {"code": "PH", "name": "Plant Height", "cat": "Morphological", "unit": "cm", "min": 50, "max": 160, "desc": "Height from ground to panicle tip"},
            {"code": "TC", "name": "Tiller Count", "cat": "Morphological", "unit": "tillers/plant", "min": 5, "max": 40, "desc": "Number of productive tillers"},
            {"code": "DS", "name": "Bacterial Blight Disease Score", "cat": "Disease", "unit": "1-9 Scale", "min": 1, "max": 9, "desc": "Standard evaluation scale for rice disease"},
            {"code": "DF", "name": "Days to 50% Flowering", "cat": "Physiological", "unit": "days", "min": 60, "max": 120, "desc": "Days elapsed from sowing to 50% flowering"}
        ]
        
        trait_objs = []
        for t in traits:
            existing_t = db.query(ObservationTrait).filter(ObservationTrait.trait_code == t["code"]).first()
            if not existing_t:
                existing_t = ObservationTrait(
                    trait_code=t["code"],
                    name=t["name"],
                    category=t["cat"],
                    unit=t["unit"],
                    min_val=t["min"],
                    max_val=t["max"],
                    description=t["desc"]
                )
                db.add(existing_t)
                db.commit()
                db.refresh(existing_t)
            trait_objs.append(existing_t)
            
        # Seed observations
        obs_check = db.query(Observation).filter(Observation.trial_id == trial.id).first()
        if not obs_check:
            obs_sample = [
                {"trait": trait_objs[0], "var": variety_objs[0], "rep": 1, "val": 105.4, "date": "2026-08-15", "remarks": "DEMO: Uniform height"},
                {"trait": trait_objs[0], "var": variety_objs[1], "rep": 1, "val": 112.0, "date": "2026-08-15", "remarks": "DEMO: Tall lush leaves"},
                {"trait": trait_objs[1], "var": variety_objs[0], "rep": 1, "val": 22.0, "date": "2026-08-20", "remarks": "DEMO: Vigorous tillering"},
                {"trait": trait_objs[2], "var": variety_objs[2], "rep": 1, "val": 2.0, "date": "2026-08-25", "remarks": "DEMO: Highly resistant"}
            ]
            for o in obs_sample:
                obs_obj = Observation(
                    trial_id=trial.id,
                    plot_id=e4a.id,
                    entry_id=o["var"].id,
                    trait_id=o["trait"].id,
                    replication=o["rep"],
                    row_number=1,
                    value=o["val"],
                    unit=o["trait"].unit,
                    observation_date=o["date"],
                    recorded_by="Dr. Ananya Sharma",
                    remarks=o["remarks"]
                )
                db.add(obs_obj)
            db.commit()
            
        print("[SUCCESS] Demo Traits & Observations seeded successfully.")

        # 9. Seed Harvest Records
        harvest_check = db.query(HarvestRecord).filter(HarvestRecord.trial_id == trial.id).first()
        if not harvest_check:
            h_sample = [
                {"var": variety_objs[0], "rep": 1, "yield": 4.85, "gw": 24.5, "m": 13.5, "date": "2026-09-18"},
                {"var": variety_objs[1], "rep": 1, "yield": 5.20, "gw": 26.1, "m": 14.0, "date": "2026-09-18"},
                {"var": variety_objs[2], "rep": 1, "yield": 4.95, "gw": 25.0, "m": 13.8, "date": "2026-09-18"}
            ]
            for h in h_sample:
                h_obj = HarvestRecord(
                    trial_id=trial.id,
                    plot_id=e4a.id,
                    entry_id=h["var"].id,
                    replication=h["rep"],
                    harvest_date=h["date"],
                    yield_value=h["yield"],
                    yield_unit="kg/plot",
                    grain_weight=h["gw"],
                    moisture_percentage=h["m"],
                    recorded_by="Ramesh Kumar (Field Officer)",
                    notes="DEMO: Early sample harvest batch"
                )
                db.add(h_obj)
            db.commit()
            
        print("[SUCCESS] Demo Harvest records seeded successfully.")
        
        # 10. Audit Log
        audit_count = db.query(AuditLog).count()
        if audit_count == 0:
            db.add(AuditLog(user_name="System", action="SEED_DATABASE", entity="System", new_value_json="Seeded E4A prototype database with demo entries"))
            db.commit()

        print("Database seeding complete! E4A prototype ready.")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
