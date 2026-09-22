import json
import math
from typing import Dict, Any, List, Tuple
from shapely.geometry import Polygon, Point, mapping, shape

# Station Reference Center Point (Simulated Paddy Station Coordinates)
STATION_CENTER_LAT = 17.50000
STATION_CENTER_LNG = 78.50000

def meters_to_lat_lng(x_meters: float, y_meters: float, ref_lat: float = STATION_CENTER_LAT, ref_lng: float = STATION_CENTER_LNG) -> Tuple[float, float]:
    """Convert local Cartesian meters (x=East, y=North) to geographic Lat/Lng."""
    lat_deg_per_meter = 1.0 / 111320.0
    lng_deg_per_meter = 1.0 / (111320.0 * math.cos(math.radians(ref_lat)))
    
    lat = ref_lat + (y_meters * lat_deg_per_meter)
    lng = ref_lng + (x_meters * lng_deg_per_meter)
    return (lat, lng)

def lat_lng_to_meters(lat: float, lng: float, ref_lat: float = STATION_CENTER_LAT, ref_lng: float = STATION_CENTER_LNG) -> Tuple[float, float]:
    """Convert geographic Lat/Lng to local Cartesian meters (x=East, y=North)."""
    lat_deg_per_meter = 1.0 / 111320.0
    lng_deg_per_meter = 1.0 / (111320.0 * math.cos(math.radians(ref_lat)))
    
    y_meters = (lat - ref_lat) / lat_deg_per_meter
    x_meters = (lng - ref_lng) / lng_deg_per_meter
    return (x_meters, y_meters)

def generate_prototype_polygon(north_m: float = 36.0, east_m: float = 30.0, west_m: float = 31.2, south_m: float = 34.8) -> Dict[str, Any]:
    """
    Generates a quadrilateral polygon from the 4 boundary lengths (N, E, W, S).
    Local meter coordinates:
    SW: (0, 0)
    SE: (south_m, 0)
    NE: (north_m, east_m)
    NW: (0, west_m)
    """
    local_coords = [
        (0.0, 0.0),
        (south_m, 0.0),
        (north_m, east_m),
        (0.0, west_m),
        (0.0, 0.0)
    ]
    
    geo_coords = []
    for x, y in local_coords:
        lat, lng = meters_to_lat_lng(x, y)
        geo_coords.append([lng, lat]) # GeoJSON standard is [longitude, latitude]
        
    polygon_geojson = {
        "type": "Polygon",
        "coordinates": [geo_coords]
    }
    
    return polygon_geojson

def calculate_area_and_perimeter(geometry_geojson_str: str) -> Tuple[float, float]:
    """Calculates area in square meters and perimeter in meters using Shapely."""
    try:
        geo_dict = json.loads(geometry_geojson_str)
        poly = shape(geo_dict)
        
        # Convert lat/lng coordinates to local meter coordinates for accurate planar math
        coords = list(poly.exterior.coords)
        local_coords = []
        for lng, lat in coords:
            x, y = lat_lng_to_meters(lat, lng)
            local_coords.append((x, y))
            
        local_poly = Polygon(local_coords)
        return (round(local_poly.area, 2), round(local_poly.length, 2))
    except Exception as e:
        return (0.0, 0.0)

def is_point_inside_polygon(point_lat: float, point_lng: float, polygon_geojson_str: str) -> bool:
    """Returns True if point is inside polygon using Shapely point-in-polygon test."""
    try:
        geo_dict = json.loads(polygon_geojson_str)
        poly = shape(geo_dict)
        pt = Point(point_lng, point_lat)
        return poly.contains(pt) or poly.touches(pt)
    except Exception:
        return True
