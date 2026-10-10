import json
from datetime import datetime, timezone
from app.db.session import SessionLocal, engine, Base
from app.core.security import hash_password
from app.models.models import (
    User, Station, Block, Plot, PlotGeometryVersion, Variety, Trial, TrialEntry,
    Layout, PlantingRecord, ObservationTrait, Observation, HarvestRecord,
    PlotStatusHistory, AuditLog
)
from app.services.gis_service import generate_prototype_polygon, calculate_area_and_perimeter, meters_to_lat_lng
from app.services.layout_engine import generate_rbd_layout

def make_box_geojson(min_x: float, min_y: float, max_x: float, max_y: float) -> str:
    """Helper to generate a rectangular GeoJSON polygon from Cartesian meter bounds."""
    corners = [
        (min_x, min_y),
        (max_x, min_y),
        (max_x, max_y),
        (min_x, max_y),
        (min_x, min_y)
    ]
    geo_coords = []
    for x, y in corners:
        lat, lng = meters_to_lat_lng(x, y)
        geo_coords.append([lng, lat])
    return json.dumps({
        "type": "Polygon",
        "coordinates": [geo_coords]
    })

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

        # 2. Seed Station & Blocks
        station = db.query(Station).filter((Station.station_code == "PBS-CBE") | (Station.station_code == "PBS-HYD")).first()
        st_geo_str = make_box_geojson(-50.0, -45.0, 50.0, 45.0)
        if not station:
            station = Station(
                station_code="PBS-CBE",
                name="TNAU Paddy Breeding Station",
                description="Historic Rice Research Station established in 1912, Centre for Plant Breeding and Genetics, Tamil Nadu Agricultural University",
                boundary_geojson=st_geo_str,
                location_name="XWW8+4HP TNAU Paddy Breeding Station, Unnamed Road,, Vedapatti, Tamil Nadu 641039"
            )
            db.add(station)
            db.commit()
            db.refresh(station)
        else:
            station.station_code = "PBS-CBE"
            station.name = "TNAU Paddy Breeding Station"
            station.description = "Historic Rice Research Station established in 1912, Centre for Plant Breeding and Genetics, Tamil Nadu Agricultural University"
            station.location_name = "XWW8+4HP TNAU Paddy Breeding Station, Unnamed Road,, Vedapatti, Tamil Nadu 641039"
            station.boundary_geojson = st_geo_str
            db.commit()
            
        blocks_data = [
            {
                "code": "BLOCK-E",
                "name": "Block E (East Experimental Block)",
                "desc": "Dedicated block for yield evaluation and agronomic trials (Rows E1-E5, Cols a & b)",
                "geo": make_box_geojson(-30.0, -25.0, 30.0, 25.0)
            },
            {
                "code": "BLOCK-C",
                "name": "Block C (North Screening Block)",
                "desc": "Controlled irrigation plots for submergence and drought screening (Rows C1-C4)",
                "geo": make_box_geojson(5.0, 175.0, 100.0, 305.0)
            },
            {
                "code": "BLOCK-G",
                "name": "Block G (South Evaluation Block)",
                "desc": "Water regime and multi-location preliminary trials (Rows G1-G4)",
                "geo": make_box_geojson(5.0, -180.0, 100.0, -35.0)
            },
            {
                "code": "BLOCK-B",
                "name": "Block B (Parental Crossing Nursery)",
                "desc": "Dedicated block for crossing nurseries and breeder seed maintenance (Rows B1-B4)",
                "geo": make_box_geojson(-70.0, -35.0, 5.0, 175.0)
            },
            {
                "code": "BLOCK-A",
                "name": "Block A (West Multiplication Block)",
                "desc": "Breeder seed multiplication and hybrid rice nursery (Rows A1-A7)",
                "geo": make_box_geojson(-135.0, -35.0, -70.0, 175.0)
            }
        ]

        block_map = {}
        for b_info in blocks_data:
            b_obj = db.query(Block).filter(Block.block_code == b_info["code"]).first()
            if not b_obj:
                b_obj = Block(
                    station_id=station.id,
                    block_code=b_info["code"],
                    name=b_info["name"],
                    description=b_info["desc"],
                    boundary_geojson=b_info["geo"]
                )
                db.add(b_obj)
                db.commit()
                db.refresh(b_obj)
            else:
                b_obj.boundary_geojson = b_info["geo"]
                b_obj.name = b_info["name"]
                b_obj.description = b_info["desc"]
                db.commit()
            block_map[b_info["code"]] = b_obj

        print(f"[SUCCESS] Station PBS-CBE and {len(blocks_data)} Blocks seeded successfully.")

        # 3. Seed Station Plots / Fields matching Master Station Map (Plot's Image.jpeg)
        plots_seed_data = [
            # Plot 1: Benchmark E4A (Kharif Experimental Unit - 0.29 ac, N=36m, E=30m, W=31.2m, S=34.8m, 80cm bund)
            {
                "code": "E4A", "name": "Plot E4a (Kharif Experimental Unit)", "block": "BLOCK-E",
                "north": 36.0, "east": 30.0, "west": 31.2, "south": 34.8, "ox": 15.0, "oy": 20.0,
                "add_val": 80.0, "add_unit": "cm", "add_desc": "Handwritten 80 cm note (bund width)",
                "status": "Planted", "desc": "Reference experimental unit with handwritten field note measurements (0.29 ac)"
            },
            # Block E: Row 4 East Unit
            {
                "code": "E4B", "name": "Plot E4b (Rabi Secondary Unit)", "block": "BLOCK-E",
                "north": 35.0, "east": 34.0, "west": 34.0, "south": 35.0, "ox": 55.0, "oy": 20.0,
                "add_val": 80.0, "add_unit": "cm", "add_desc": "Handwritten 80 cm note (bund width)",
                "status": "Prepared", "desc": "Secondary experimental unit for season-crossing trials (0.35 ac)"
            },
            # Block E: Row 1 (Northmost of Block E)
            {
                "code": "E1a", "name": "Plot E1a (Nursery Bed)", "block": "BLOCK-E",
                "north": 32.4, "east": 30.0, "west": 30.0, "south": 32.4, "ox": 15.0, "oy": 140.0,
                "add_val": 50.0, "add_unit": "cm", "add_desc": "Nursery water channel width",
                "status": "Harvested", "desc": "Wet nursery bed for seedling raising and transplanting (0.24 ac)"
            },
            {
                "code": "E1b", "name": "Plot E1b (Observation Bed)", "block": "BLOCK-E",
                "north": 39.1, "east": 30.0, "west": 30.0, "south": 39.1, "ox": 55.0, "oy": 140.0,
                "add_val": 50.0, "add_unit": "cm", "add_desc": "Perimeter irrigation channel",
                "status": "Harvested", "desc": "Observation bed for germplasm screening (0.29 ac)"
            },
            # Block E: Row 2
            {
                "code": "E2a", "name": "Plot E2a (Early Generation Unit)", "block": "BLOCK-E",
                "north": 35.7, "east": 34.0, "west": 34.0, "south": 35.7, "ox": 15.0, "oy": 100.0,
                "add_val": 60.0, "add_unit": "cm", "add_desc": "Inter-plot bund pathway",
                "status": "Planted", "desc": "F2/F3 pedigree population screening and single plant selection (0.30 ac)"
            },
            {
                "code": "E2b", "name": "Plot E2b (IVT-DM Trial Unit)", "block": "BLOCK-E",
                "north": 46.4, "east": 34.0, "west": 34.0, "south": 46.4, "ox": 55.0, "oy": 100.0,
                "add_val": 60.0, "add_unit": "cm", "add_desc": "Bund path between E2a and E2b",
                "status": "Planted", "desc": "IVT-DM (Initial Variety Trial - Direct Seeded) evaluation field (0.39 ac)"
            },
            # Block E: Row 3
            {
                "code": "E3a", "name": "Plot E3a (Preliminary Yield Unit)", "block": "BLOCK-E",
                "north": 38.1, "east": 34.0, "west": 34.0, "south": 38.1, "ox": 15.0, "oy": 60.0,
                "add_val": 60.0, "add_unit": "cm", "add_desc": "Drainage boundary margin",
                "status": "Growing", "desc": "Preliminary yield trials with standard check varieties (0.32 ac)"
            },
            {
                "code": "E3b", "name": "Plot E3b (Advanced Yield Unit)", "block": "BLOCK-E",
                "north": 47.6, "east": 34.0, "west": 34.0, "south": 47.6, "ox": 55.0, "oy": 60.0,
                "add_val": 60.0, "add_unit": "cm", "add_desc": "Inter-block ditch buffer",
                "status": "Growing", "desc": "Advanced yield trials with elite multi-location lines (0.40 ac)"
            },
            # Block E: Row 5 (Southmost of Block E)
            {
                "code": "E5a", "name": "Plot E5a (Agronomic Unit)", "block": "BLOCK-E",
                "north": 35.0, "east": 30.0, "west": 30.0, "south": 35.0, "ox": 15.0, "oy": -20.0,
                "add_val": 70.0, "add_unit": "cm", "add_desc": "Irrigation ditch width",
                "status": "Growing", "desc": "Nitrogen response and spacing evaluation trial (0.26 ac)"
            },
            {
                "code": "E5b", "name": "Plot E5b (Spacing & Water Unit)", "block": "BLOCK-E",
                "north": 41.8, "east": 30.0, "west": 30.0, "south": 41.8, "ox": 55.0, "oy": -20.0,
                "add_val": 70.0, "add_unit": "cm", "add_desc": "Irrigation ditch width",
                "status": "Growing", "desc": "Water saving and aerobic rice cultivation trial (0.31 ac)"
            },
            # Block B Fields (Crossing Nursery)
            {
                "code": "B1", "name": "Plot B1 (Parental Crossing Nursery)", "block": "BLOCK-B",
                "north": 32.0, "east": 28.0, "west": 28.0, "south": 32.0, "ox": -55.0, "oy": 60.0,
                "add_val": 50.0, "add_unit": "cm", "add_desc": "Staggered planting row gap",
                "status": "Planted", "desc": "Parental lines maintainer for artificial hybridization"
            },
            {
                "code": "B2", "name": "Plot B2 (Germplasm Maintenance Field)", "block": "BLOCK-B",
                "north": 32.0, "east": 28.0, "west": 28.0, "south": 32.0, "ox": -55.0, "oy": 100.0,
                "add_val": 50.0, "add_unit": "cm", "add_desc": "Accession separation buffer",
                "status": "Growing", "desc": "Core rice collection preservation and seed regeneration"
            },
            # Block C Fields (North Screening Block)
            {
                "code": "C1", "name": "Plot C1 (Submergence Screening Basin)", "block": "BLOCK-C",
                "north": 30.0, "east": 25.0, "west": 25.0, "south": 30.0, "ox": 15.0, "oy": 215.0,
                "add_val": 90.0, "add_unit": "cm", "add_desc": "Controlled bund dyke height",
                "status": "Planted", "desc": "Submergence-tolerant Sub1 gene introgression screen"
            },
            {
                "code": "C2", "name": "Plot C2 (Aerobic & Drought Stress Field)", "block": "BLOCK-C",
                "north": 30.0, "east": 25.0, "west": 25.0, "south": 30.0, "ox": 55.0, "oy": 215.0,
                "add_val": 60.0, "add_unit": "cm", "add_desc": "Tensiometer buffer strip",
                "status": "Prepared", "desc": "Controlled water withholding for drought tolerance phenotyping"
            },
            # Block G Fields (South Evaluation Block)
            {
                "code": "G1", "name": "Plot G1 (Water Regime Field)", "block": "BLOCK-G",
                "north": 30.0, "east": 25.0, "west": 25.0, "south": 30.0, "ox": 15.0, "oy": -95.0,
                "add_val": 60.0, "add_unit": "cm", "add_desc": "South field margin",
                "status": "Prepared", "desc": "South agronomic and water management evaluation field"
            },
            # Block A Fields (West Multiplication Block)
            {
                "code": "A1", "name": "Plot A1 (Breeder Seed Multiplication)", "block": "BLOCK-A",
                "north": 35.0, "east": 30.0, "west": 30.0, "south": 35.0, "ox": -115.0, "oy": 60.0,
                "add_val": 75.0, "add_unit": "cm", "add_desc": "Isolation distance margin",
                "status": "Growing", "desc": "Genetic purity maintenance and foundation seed supply"
            }
        ]

        plot_objs = {}
        for p_data in plots_seed_data:
            poly_dict = generate_prototype_polygon(
                north_m=p_data["north"],
                east_m=p_data["east"],
                west_m=p_data["west"],
                south_m=p_data["south"],
                center_at_origin=(p_data["code"] == "E4A"),
                origin_x=p_data["ox"],
                origin_y=p_data["oy"]
            )
            geo_str = json.dumps(poly_dict)
            area, perim = calculate_area_and_perimeter(geo_str)
            target_block = block_map[p_data["block"]]

            plot_entity = db.query(Plot).filter(Plot.plot_code == p_data["code"]).first()
            if not plot_entity:
                plot_entity = Plot(
                    block_id=target_block.id,
                    plot_code=p_data["code"],
                    name=p_data["name"],
                    description=p_data["desc"],
                    north_length_m=p_data["north"],
                    east_length_m=p_data["east"],
                    west_length_m=p_data["west"],
                    south_length_m=p_data["south"],
                    additional_measurement_value=p_data["add_val"],
                    additional_measurement_unit=p_data["add_unit"],
                    additional_measurement_description=p_data["add_desc"],
                    geometry_geojson=geo_str,
                    area_sqm=area,
                    perimeter_m=perim,
                    status=p_data["status"],
                    geometry_source="Paddy Breeding Station Coordinate Survey"
                )
                db.add(plot_entity)
                db.commit()
                db.refresh(plot_entity)

                # Geometry Version
                ver = PlotGeometryVersion(
                    plot_id=plot_entity.id,
                    version_number=1,
                    geometry_geojson=geo_str,
                    source="Paddy Breeding Station Coordinate Survey",
                    notes=f"Initial boundary survey N={p_data['north']}m, E={p_data['east']}m, W={p_data['west']}m, S={p_data['south']}m"
                )
                db.add(ver)

                # Status History
                hist = PlotStatusHistory(
                    plot_id=plot_entity.id,
                    status=p_data["status"],
                    changed_by="Field Officer",
                    notes=f"Initial seeded status: {p_data['status']}"
                )
                db.add(hist)
                db.commit()
            else:
                # Update geometry to ensure proper spatial layout across blocks
                plot_entity.geometry_geojson = geo_str
                plot_entity.area_sqm = area
                plot_entity.perimeter_m = perim
                plot_entity.block_id = target_block.id
                plot_entity.name = p_data["name"]
                plot_entity.description = p_data["desc"]
                plot_entity.north_length_m = p_data["north"]
                plot_entity.east_length_m = p_data["east"]
                plot_entity.west_length_m = p_data["west"]
                plot_entity.south_length_m = p_data["south"]
                plot_entity.additional_measurement_value = p_data["add_val"]
                plot_entity.additional_measurement_unit = p_data["add_unit"]
                plot_entity.additional_measurement_description = p_data["add_desc"]
                db.commit()

            plot_objs[p_data["code"]] = plot_entity

        print(f"[SUCCESS] {len(plots_seed_data)} Station Plots/Fields seeded across Blocks.")

        # 4. Seed Paddy Varieties (including TNAU Coimbatore lines)
        demo_varieties = [
            {"code": "CB-22-158", "name": "CB 22 158 (Coimbatore Line)", "duration": 125, "desc": "Elite PBS Coimbatore breeding line evaluated in IVT-DM trial"},
            {"code": "CO-51", "name": "CO 51", "duration": 110, "desc": "Popular short duration high yielding variety developed by TNAU Coimbatore"},
            {"code": "CO-52", "name": "CO 52", "duration": 130, "desc": "Medium duration blast and BPH resistant variety developed by TNAU Coimbatore"},
            {"code": "CR-310", "name": "CR Dhan 310", "duration": 125, "desc": "High protein rice variety developed by NRRI"},
            {"code": "SW-SUB1", "name": "Swarna Sub1", "duration": 140, "desc": "Submergence tolerant mega variety with SUB1A QTL"},
            {"code": "DRR-45", "name": "DRR Dhan 45", "duration": 130, "desc": "High zinc enriched biofortified rice variety"},
            {"code": "MTU-1010", "name": "MTU 1010", "duration": 115, "desc": "Popular early maturing short bold grain variety"},
            {"code": "IR-64", "name": "IR 64", "duration": 120, "desc": "Standard check variety for high yielding semi-dwarf trials"},
            {"code": "BPT-5204", "name": "Samba Mahsuri", "duration": 145, "desc": "Elite fine grain benchmark with premium cooking quality"}
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
                    source="Paddy Breeding Station, TNAU Coimbatore"
                )
                db.add(existing_v)
                db.commit()
                db.refresh(existing_v)
            variety_objs.append(existing_v)
            
        print(f"[SUCCESS] {len(demo_varieties)} Elite Paddy Varieties seeded successfully.")

        # 5. Seed Trials for Multiple Active Fields
        trials_data = [
            {
                "code": "TR-E4A-2026",
                "name": "E4A Yield Evaluation & Agronomic Performance Trial 2026",
                "plot": plot_objs["E4A"],
                "design": "RBD", "entries": variety_objs[:5], "reps": 3,
                "season": "Kharif 2026", "status": "Growing",
                "notes": "Randomized Complete Block Design trial on reference field E4a"
            },
            {
                "code": "TR-E2B-2026",
                "name": "E2b IVT-DM Initial Variety Trial 2026",
                "plot": plot_objs["E2b"],
                "design": "RBD", "entries": [v for v in variety_objs if v.variety_code in ("CB-22-158", "CO-51", "IR-64", "CR-310")], "reps": 3,
                "season": "Kharif 2026", "status": "Planted",
                "notes": "IVT-DM Direct Seeded trial testing Outs CB 22 158 as per field trial record"
            },
            {
                "code": "TR-E3A-2026",
                "name": "E3a Observational High-Density Yield Trial",
                "plot": plot_objs["E3a"],
                "design": "RBD", "entries": variety_objs[2:6], "reps": 3,
                "season": "Kharif 2026", "status": "Growing",
                "notes": "Micro-plot evaluation for tillering capacity under standard NPK"
            },
            {
                "code": "TR-B1-2026",
                "name": "B1 Elite Parental Hybridization Crosses",
                "plot": plot_objs["B1"],
                "design": "Custom", "entries": variety_objs[:3], "reps": 2,
                "season": "Kharif 2026", "status": "Growing",
                "notes": "Parental crossing nursery for biofortification x yield crosses"
            },
            {
                "code": "TR-C1-2026",
                "name": "C1 Submergence Sub-1 Gene Tolerance Screening",
                "plot": plot_objs["C1"],
                "design": "RBD", "entries": [v for v in variety_objs if v.variety_code in ("SW-SUB1", "IR-64", "CR-310")], "reps": 3,
                "season": "Kharif 2026", "status": "Planted",
                "notes": "14-day vegetative stage submergence inundation protocol"
            }
        ]

        trial_objs = {}
        for t_info in trials_data:
            t = db.query(Trial).filter(Trial.trial_code == t_info["code"]).first()
            if not t:
                t = Trial(
                    trial_code=t_info["code"],
                    name=t_info["name"],
                    plot_id=t_info["plot"].id,
                    crop="Paddy / Rice",
                    season=t_info["season"],
                    year=2026,
                    design_type=t_info["design"],
                    num_entries=len(t_info["entries"]),
                    num_replications=t_info["reps"],
                    start_date="2026-06-15",
                    expected_harvest_date="2026-10-25",
                    status=t_info["status"],
                    notes=t_info["notes"]
                )
                db.add(t)
                db.commit()
                db.refresh(t)

                for idx, v in enumerate(t_info["entries"]):
                    entry = TrialEntry(
                        trial_id=t.id,
                        variety_id=v.id,
                        entry_number=idx + 1,
                        treatment_code=f"T{idx+1}"
                    )
                    db.add(entry)
                db.commit()
            trial_objs[t_info["code"]] = t

        print("[SUCCESS] 5 Breeding Trials seeded across active fields.")

        # 6. Seed Layout for E4A and Active Fields
        e4a_trial = trial_objs["TR-E4A-2026"]
        e4a_plot = plot_objs["E4A"]
        layout_data = generate_rbd_layout(
            plot_geometry_geojson=e4a_plot.geometry_geojson,
            north_m=e4a_plot.north_length_m,
            east_m=e4a_plot.east_length_m,
            west_m=e4a_plot.west_length_m,
            south_m=e4a_plot.south_length_m,
            num_rows=15,
            row_spacing_cm=20.0,
            plant_spacing_cm=15.0,
            border_buffer_m=0.5,
            pathway_width_m=0.5,
            num_entries=5,
            num_replications=3,
            varieties=[{"id": v.id, "variety_code": v.variety_code, "variety_name": v.variety_name} for v in variety_objs[:5]],
            randomization_seed=42
        )
        layout_e4a = db.query(Layout).filter(Layout.trial_id == e4a_trial.id).first()
        if not layout_e4a:
            layout_e4a = Layout(
                plot_id=e4a_plot.id,
                trial_id=e4a_trial.id,
                version_number=1,
                design_type="RBD",
                num_rows=15,
                row_spacing_cm=20.0,
                plant_spacing_cm=15.0,
                border_buffer_m=0.5,
                pathway_width_m=0.5,
                randomization_seed=42,
                parameters_json=json.dumps({"num_rows": 15, "row_spacing_cm": 20.0, "plant_spacing_cm": 15.0}),
                generated_grid_json=json.dumps(layout_data),
                status="Active",
                created_by="Dr. Ananya Sharma"
            )
            db.add(layout_e4a)
            db.commit()
            db.refresh(layout_e4a)
        else:
            layout_e4a.generated_grid_json = json.dumps(layout_data)
            db.commit()

        # 7. Seed Planting Records for Active Trials
        planting_check = db.query(PlantingRecord).filter(PlantingRecord.trial_id == e4a_trial.id).first()
        if not planting_check:
            p_rec = PlantingRecord(
                trial_id=e4a_trial.id,
                plot_id=e4a_plot.id,
                layout_id=layout_e4a.id,
                planting_date="2026-06-20",
                status="Planted",
                updated_by="Ramesh Kumar (Field Officer)",
                notes="DEMO: 15 rows transplanted into flooded paddy soil (2-3 seedlings/hill)."
            )
            db.add(p_rec)
            db.commit()

        # 8. Seed Observation Traits & Field Observations
        traits = [
            {"code": "PH", "name": "Plant Height", "cat": "Morphological", "unit": "cm", "min": 50, "max": 160, "desc": "Height from ground to panicle tip"},
            {"code": "TC", "name": "Productive Tiller Count", "cat": "Morphological", "unit": "tillers/hill", "min": 5, "max": 40, "desc": "Number of panicle-bearing productive tillers"},
            {"code": "DS", "name": "Bacterial Blight Disease Score", "cat": "Disease", "unit": "1-9 Scale", "min": 1, "max": 9, "desc": "Standard IRRI evaluation scale (SES 1-9)"},
            {"code": "DF", "name": "Days to 50% Flowering", "cat": "Physiological", "unit": "days", "min": 60, "max": 120, "desc": "Days elapsed from sowing until 50% panicles emerged"},
            {"code": "PL", "name": "Panicle Length", "cat": "Yield Component", "unit": "cm", "min": 15, "max": 35, "desc": "Length of primary panicle from neck node to tip"},
            {"code": "SP", "name": "Spikelet Fertility", "cat": "Physiological", "unit": "%", "min": 40, "max": 98, "desc": "Percentage of filled grains per panicle"}
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

        # Seed Observations across Trials
        obs_count = db.query(Observation).count()
        if obs_count < 10:
            obs_sample = [
                {"t": e4a_trial, "p": e4a_plot, "trait": trait_objs[0], "var": variety_objs[0], "rep": 1, "row": 1, "pos": 5, "val": 105.4, "date": "2026-08-15", "rem": "Uniform height across row"},
                {"t": e4a_trial, "p": e4a_plot, "trait": trait_objs[0], "var": variety_objs[1], "rep": 1, "row": 2, "pos": 5, "val": 112.0, "date": "2026-08-15", "rem": "Lush erect flag leaves"},
                {"t": e4a_trial, "p": e4a_plot, "trait": trait_objs[1], "var": variety_objs[0], "rep": 1, "row": 1, "pos": 8, "val": 22.0, "date": "2026-08-20", "rem": "Vigorous effective tillering"},
                {"t": e4a_trial, "p": e4a_plot, "trait": trait_objs[2], "var": variety_objs[2], "rep": 1, "row": 3, "pos": 4, "val": 2.0, "date": "2026-08-25", "rem": "Highly resistant (SES score 2)"},
                {"t": e4a_trial, "p": e4a_plot, "trait": trait_objs[3], "var": variety_objs[3], "rep": 1, "row": 4, "pos": 6, "val": 88.0, "date": "2026-09-02", "rem": "Early synchronous heading"},
                {"t": e4a_trial, "p": e4a_plot, "trait": trait_objs[4], "var": variety_objs[0], "rep": 1, "row": 1, "pos": 10, "val": 26.5, "date": "2026-09-10", "rem": "Dense well-exserted panicle"},
                # Observations for E2b
                {"t": trial_objs["TR-E2B-2026"], "p": plot_objs["E2b"], "trait": trait_objs[0], "var": variety_objs[0], "rep": 1, "row": 1, "pos": 3, "val": 98.2, "date": "2026-08-16", "rem": "Semi-dwarf stature verified"},
                {"t": trial_objs["TR-E2B-2026"], "p": plot_objs["E2b"], "trait": trait_objs[2], "var": variety_objs[1], "rep": 1, "row": 2, "pos": 5, "val": 1.0, "date": "2026-08-22", "rem": "Immune reaction to blast"},
                # Observations for C1
                {"t": trial_objs["TR-C1-2026"], "p": plot_objs["C1"], "trait": trait_objs[5], "var": variety_objs[1], "rep": 1, "row": 1, "pos": 4, "val": 92.4, "date": "2026-09-12", "rem": "High spikelet fertility post-submergence"}
            ]
            for o in obs_sample:
                db.add(Observation(
                    trial_id=o["t"].id,
                    plot_id=o["p"].id,
                    entry_id=o["var"].id,
                    trait_id=o["trait"].id,
                    replication=o["rep"],
                    row_number=o["row"],
                    plant_position=o["pos"],
                    value=o["val"],
                    unit=o["trait"].unit,
                    observation_date=o["date"],
                    recorded_by="Dr. Ananya Sharma",
                    remarks=o["rem"]
                ))
            db.commit()

        print("[SUCCESS] 6 Observation Traits & Multi-Field Observations seeded successfully.")

        # 9. Seed Harvest Records
        harvest_count = db.query(HarvestRecord).count()
        if harvest_count < 5:
            h_sample = [
                {"t": e4a_trial, "p": e4a_plot, "var": variety_objs[0], "rep": 1, "yield": 4.85, "gw": 24.5, "m": 13.5, "date": "2026-09-18"},
                {"t": e4a_trial, "p": e4a_plot, "var": variety_objs[1], "rep": 1, "yield": 5.20, "gw": 26.1, "m": 14.0, "date": "2026-09-18"},
                {"t": e4a_trial, "p": e4a_plot, "var": variety_objs[2], "rep": 1, "yield": 4.95, "gw": 25.0, "m": 13.8, "date": "2026-09-18"},
                {"t": e4a_trial, "p": e4a_plot, "var": variety_objs[3], "rep": 1, "yield": 4.60, "gw": 23.8, "m": 13.2, "date": "2026-09-18"},
                {"t": e4a_trial, "p": e4a_plot, "var": variety_objs[4], "rep": 1, "yield": 5.05, "gw": 25.4, "m": 13.9, "date": "2026-09-18"}
            ]
            for h in h_sample:
                db.add(HarvestRecord(
                    trial_id=h["t"].id,
                    plot_id=h["p"].id,
                    entry_id=h["var"].id,
                    replication=h["rep"],
                    harvest_date=h["date"],
                    yield_value=h["yield"],
                    yield_unit="kg/plot",
                    grain_weight=h["gw"],
                    moisture_percentage=h["m"],
                    recorded_by="Ramesh Kumar (Field Officer)",
                    notes="Early harvested net plot area (standard 14% moisture basis)"
                ))
            db.commit()

        print("[SUCCESS] Multi-variety Harvest records seeded successfully.")

        # 10. Audit Log
        db.add(AuditLog(
            user_name="System",
            action="SEED_DATABASE",
            entity="Station",
            new_value_json=f"Seeded full Paddy Breeding Station: 5 Blocks, {len(plots_seed_data)} Fields/Plots, {len(demo_varieties)} Varieties, 5 Trials"
        ))
        db.commit()

        print("======================================================================")
        print("DATABASE SEEDING COMPLETE: Full Paddy Breeding Station Ready!")
        print(f"Station: PBS-CBE | Blocks: {len(blocks_data)} | Fields/Plots: {len(plots_seed_data)}")
        print("======================================================================")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Database seeding failed: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
