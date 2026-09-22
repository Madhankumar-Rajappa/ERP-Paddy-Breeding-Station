import os

class Settings:
    PROJECT_NAME: str = "Paddy Breeding Station GIS + ERP"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "paddy_breeding_station_super_secret_jwt_key_2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours
    
    # Database (SQLite default for zero-config run, standard Postgres/PostGIS supported via DATABASE_URL)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite:///./paddy_breeding_station.db"
    )

settings = Settings()
