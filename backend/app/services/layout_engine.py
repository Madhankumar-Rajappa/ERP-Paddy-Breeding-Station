import json
import random
from typing import Dict, Any, List
from shapely.geometry import Polygon, Point, shape
from app.services.gis_service import lat_lng_to_meters, meters_to_lat_lng

def generate_rbd_layout(
    plot_geometry_geojson: str,
    north_m: float,
    east_m: float,
    west_m: float,
    south_m: float,
    num_rows: int,
    row_spacing_cm: float,
    plant_spacing_cm: float,
    border_buffer_m: float,
    pathway_width_m: float,
    num_entries: int,
    num_replications: int,
    varieties: List[Dict[str, Any]],
    randomization_seed: int = 42
) -> Dict[str, Any]:
    """
    Dynamic Plot Design Engine:
    1. Computes total estimated row capacities based on available length (Y) & row spacing.
    2. Computes total estimated plant positions per row based on available width (X) & plant spacing.
    3. Performs RBD randomization (Entries assigned to Replications).
    4. Generates grid coordinates & clips points inside the plot polygon boundary using Shapely.
    """
    random.seed(randomization_seed)
    
    # 1. Parse plot polygon geometry into local Cartesian meters
    geo_dict = json.loads(plot_geometry_geojson)
    plot_poly_geo = shape(geo_dict)
    
    local_coords = []
    for lng, lat in plot_poly_geo.exterior.coords:
        x, y = lat_lng_to_meters(lat, lng)
        local_coords.append((x, y))
    plot_poly_local = Polygon(local_coords)
    
    # 2. Dimensions & Spacing math
    # Compute bounding box of the polygon in local coordinates
    min_x, min_y, max_x, max_y = plot_poly_local.bounds
    poly_width = max(1.0, max_x - min_x)
    poly_length = max(1.0, max_y - min_y)

    row_spacing_m = max(0.05, row_spacing_cm / 100.0)
    plant_spacing_m = max(0.05, plant_spacing_cm / 100.0)
    
    avg_width_m = (south_m + north_m) / 2.0 if (south_m and north_m) else poly_width
    avg_length_m = (west_m + east_m) / 2.0 if (west_m and east_m) else poly_length
    
    usable_width_m = max(1.0, poly_width - (2 * border_buffer_m))
    usable_length_m = max(1.0, poly_length - (2 * border_buffer_m))
    
    # Rows run across length (Y), each row spans the width (X)
    max_possible_rows = int(usable_length_m / row_spacing_m)
    max_possible_plants_per_row = int(usable_width_m / plant_spacing_m)
    
    actual_rows = min(num_rows, max_possible_rows) if num_rows > 0 else max_possible_rows
    
    # 3. RBD Randomized Assignment
    # Varieties assigned to replications
    replications_assignment = []
    variety_pool = varieties if varieties else [{"id": i+1, "variety_code": f"V-{i+1}", "variety_name": f"Paddy Variety {i+1}"} for i in range(num_entries)]
    
    for r in range(1, num_replications + 1):
        # Shuffle varieties independently for each replication block
        shuffled = list(variety_pool[:num_entries])
        random.shuffle(shuffled)
        
        rep_units = []
        for e_idx, v in enumerate(shuffled):
            rep_units.append({
                "replication": r,
                "entry_number": e_idx + 1,
                "variety": v,
                "unit_code": f"R{r}-E{e_idx+1}"
            })
        replications_assignment.append({
            "replication": r,
            "units": rep_units
        })
        
    # 4. Generate Spatial Grid & Planting Positions
    rows_grid = []
    total_valid_plants = 0
    total_clipped_plants = 0
    
    # Distribute replications across rows
    rows_per_rep = max(1, actual_rows // num_replications)
    
    for r_idx in range(actual_rows):
        row_num = r_idx + 1
        y_pos = min_y + border_buffer_m + (r_idx * row_spacing_m)
        
        # Determine replication & entry for this row
        rep_index = min(r_idx // rows_per_rep, num_replications - 1)
        rep_data = replications_assignment[rep_index]
        rep_num = rep_data["replication"]
        
        unit_idx = (r_idx % len(rep_data["units"]))
        assigned_unit = rep_data["units"][unit_idx]
        
        plant_positions = []
        for p_idx in range(max_possible_plants_per_row):
            pos_num = p_idx + 1
            x_pos = min_x + border_buffer_m + (p_idx * plant_spacing_m)
            
            # Shapely point-in-polygon clipping check
            pt_local = Point(x_pos, y_pos)
            is_inside = plot_poly_local.contains(pt_local) or plot_poly_local.touches(pt_local)
            
            lat, lng = meters_to_lat_lng(x_pos, y_pos)
            
            if is_inside:
                total_valid_plants += 1
                plant_positions.append({
                    "position_number": pos_num,
                    "x_m": round(x_pos, 2),
                    "y_m": round(y_pos, 2),
                    "lat": round(lat, 7),
                    "lng": round(lng, 7),
                    "inside_boundary": True,
                    "status": "Planned",
                    "variety_id": assigned_unit["variety"]["id"],
                    "variety_name": assigned_unit["variety"]["variety_name"]
                })
            else:
                total_clipped_plants += 1
                
        rows_grid.append({
            "row_number": row_num,
            "replication": rep_num,
            "unit_code": assigned_unit["unit_code"],
            "variety": assigned_unit["variety"],
            "y_m": round(y_pos, 2),
            "plant_count": len(plant_positions),
            "plants": plant_positions
        })

    layout_result = {
        "summary": {
            "avg_width_m": round(avg_width_m, 2),
            "avg_length_m": round(avg_length_m, 2),
            "row_spacing_cm": row_spacing_cm,
            "plant_spacing_cm": plant_spacing_cm,
            "border_buffer_m": border_buffer_m,
            "estimated_rows": actual_rows,
            "estimated_plants_per_row": max_possible_plants_per_row,
            "total_valid_plants": total_valid_plants,
            "total_clipped_plants": total_clipped_plants,
            "num_entries": num_entries,
            "num_replications": num_replications,
            "randomization_seed": randomization_seed
        },
        "replications_assignment": replications_assignment,
        "rows_grid": rows_grid
    }
    
    return layout_result
