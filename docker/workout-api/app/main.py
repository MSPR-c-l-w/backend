"""Micro-service workout (stub dev) — API interne, non exposée sur l'hôte."""

from fastapi import FastAPI

app = FastAPI(title="HealthAI Workout API", version="0.1.0")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/recommendations/workout")
def recommendations_workout() -> dict[str, str]:
    return {"status": "stub", "message": "Implémenter dans le dépôt micro-service IA"}
