from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import engine, Base
from app.api.v1 import (
    auth, plots, gis, varieties, trials, 
    layouts, planting, observations, harvest, 
    dashboard, reports, audit, users
)

# Auto-create SQLite / Postgres database tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="GIS + ERP Based Paddy Breeding Plot Planning and Trial Management System"
)

# Configure CORS for local React Vite development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API V1 Routers
api_prefix = settings.API_V1_STR
app.include_router(auth.router, prefix=api_prefix)
app.include_router(plots.router, prefix=api_prefix)
app.include_router(gis.router, prefix=api_prefix)
app.include_router(varieties.router, prefix=api_prefix)
app.include_router(trials.router, prefix=api_prefix)
app.include_router(layouts.router, prefix=api_prefix)
app.include_router(planting.router, prefix=api_prefix)
app.include_router(observations.router, prefix=api_prefix)
app.include_router(harvest.router, prefix=api_prefix)
app.include_router(dashboard.router, prefix=api_prefix)
app.include_router(reports.router, prefix=api_prefix)
app.include_router(audit.router, prefix=api_prefix)
app.include_router(users.router, prefix=api_prefix)

@app.get("/")
def root():
    return {
        "status": "online",
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": "/docs",
        "prototype_plot": "E4A"
    }
