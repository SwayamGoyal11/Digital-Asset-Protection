"""
IP Geolocation service.

Resolves an IP address to city/country/coordinates using the free ip-api.com API.
Falls back to a placeholder if the request fails (e.g., localhost / private IPs).
"""

from __future__ import annotations
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

GEO_API_URL: str = os.getenv("GEO_API_URL", "http://ip-api.com/json")


async def resolve_ip(ip: str | None) -> dict:
    """
    Resolve an IP address to geographic metadata.

    Returns a dict with keys:
        country, city, lat, lon, isp, timezone, query (the IP)

    Falls back to a safe default dict if resolution fails.
    """
    if not ip or ip in ("127.0.0.1", "::1", "localhost"):
        return _unknown_location(ip or "127.0.0.1")

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{GEO_API_URL}/{ip}")
            data = response.json()
            if data.get("status") == "success":
                return {
                    "country":  data.get("country", "Unknown"),
                    "city":     data.get("city", "Unknown"),
                    "lat":      data.get("lat", 0.0),
                    "lon":      data.get("lon", 0.0),
                    "isp":      data.get("isp", "Unknown"),
                    "timezone": data.get("timezone", "UTC"),
                    "query":    data.get("query", ip),
                }
    except Exception:
        pass

    return _unknown_location(ip)


def _unknown_location(ip: str) -> dict:
    return {
        "country":  "Unknown",
        "city":     "Unknown",
        "lat":      0.0,
        "lon":      0.0,
        "isp":      "Unknown",
        "timezone": "UTC",
        "query":    ip,
    }
