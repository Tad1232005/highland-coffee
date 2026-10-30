from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from app.api.api import api_router
from app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Highland Coffee E-Commerce REST API - Coffee, Tea, Freeze, Bakery ordering platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

# CORS Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", include_in_schema=False)
async def root():
    """Service discovery: returns API prefix, status, and documentation links."""
    return {
        "app": settings.PROJECT_NAME,
        "version": "1.0.0",
        "status": "ok",
        "api_prefix": settings.API_V1_STR,
        "health": f"{settings.API_V1_STR}/health",
        "docs": "/docs",
        "redoc": "/redoc",
        "openapi": f"{settings.API_V1_STR}/openapi.json",
    }


@app.get("/health", tags=["Health"])
@app.get(f"{settings.API_V1_STR}/health", tags=["Health"])
async def health_check():
    """Health check endpoint to verify backend service operational status."""
    return {"status": "ok", "app": settings.PROJECT_NAME, "version": "1.0.0"}


@app.get("/v1/models", include_in_schema=False)
async def v1_models_redirect(request: Request):
    """Redirect OpenAI-style /v1/models probes to the real products endpoint."""
    return RedirectResponse(url=f"{settings.API_V1_STR}/products", status_code=307)


@app.get("/v1/{path:path}", include_in_schema=False)
async def v1_prefix_redirect(request: Request, path: str):
    """Redirect any /v1/* request to the corresponding /api/* endpoint.

    Some clients probe /v1/* (OpenAI-compatible convention). Our API
    lives under /api, so redirect them instead of returning a bare 404.
    """
    return RedirectResponse(url=f"{settings.API_V1_STR}/{path}", status_code=307)


# Mount all API endpoints with prefix /api
app.include_router(api_router, prefix=settings.API_V1_STR)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
