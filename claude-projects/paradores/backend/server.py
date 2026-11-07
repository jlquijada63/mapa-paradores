import json
import math
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles

BASE = Path(__file__).parent
PARADORES = json.loads((BASE / "paradores.json").read_text(encoding="utf-8"))

app = FastAPI()


def distancia_km(a, b):
    lat1, lon1, lat2, lon2 = map(math.radians, (a["lat"], a["lon"], b["lat"], b["lon"]))
    h = math.sin((lat2 - lat1) / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin((lon2 - lon1) / 2) ** 2
    return 6371 * 2 * math.asin(math.sqrt(h))


@app.get("/api/paradores")
def listar():
    return PARADORES


@app.get("/api/paradores/{id}/cercanos")
def cercanos(id: int, km: float = 150):
    origen = next((p for p in PARADORES if p["id"] == id), None)
    if origen is None:
        raise HTTPException(404, "Parador no encontrado")
    resultado = []
    for p in PARADORES:
        d = distancia_km(origen, p)
        if p["id"] != id and d < km:
            resultado.append({**p, "distancia": round(d)})
    return sorted(resultado, key=lambda p: p["distancia"])


app.mount("/", StaticFiles(directory=BASE.parent / "frontend", html=True))
