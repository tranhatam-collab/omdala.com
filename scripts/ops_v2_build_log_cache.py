#!/usr/bin/env python3
import csv
import json
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any


def parse_timestamp(value: Any) -> datetime | None:
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    try:
        if text.endswith("Z"):
            text = text.replace("Z", "+00:00")
        dt = datetime.fromisoformat(text)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)
    except ValueError:
        return None


def to_float(value: Any) -> float | None:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def percentile(values: list[float], p: float) -> float:
    if not values:
        return 0.0
    idx = max(0, int((len(values) * p + 0.999999)) - 1)
    return values[min(idx, len(values) - 1)]


def normalize_row(row: dict[str, Any]) -> dict[str, Any]:
    timestamp = (
        row.get("timestamp")
        or row.get("datetime")
        or row.get("time")
        or row.get("ts")
    )
    error_code = row.get("error_code") or row.get("errorCode")
    duration_ms = (
        row.get("duration_ms")
        or row.get("durationMs")
        or row.get("response_time_ms")
        or row.get("latency_ms")
    )

    return {
        "timestamp": parse_timestamp(timestamp),
        "error_code": str(error_code) if error_code else "",
        "duration_ms": to_float(duration_ms),
    }


def load_rows(path: Path) -> list[dict[str, Any]]:
    text = path.read_text(encoding="utf-8").strip()
    if not text:
        return []

    suffix = path.suffix.lower()
    rows: list[dict[str, Any]] = []

    if suffix == ".csv":
        with path.open("r", encoding="utf-8", newline="") as f:
            reader = csv.DictReader(f)
            for row in reader:
                rows.append(dict(row))
        return rows

    if text.startswith("["):
        payload = json.loads(text)
        if isinstance(payload, list):
            return [item for item in payload if isinstance(item, dict)]
        return []

    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            obj = json.loads(line)
            if isinstance(obj, dict):
                rows.append(obj)
        except json.JSONDecodeError:
            continue
    return rows


def build_cache(input_path: Path, output_path: Path) -> None:
    raw_rows = load_rows(input_path)
    normalized = [normalize_row(row) for row in raw_rows]

    now = datetime.now(timezone.utc)
    start_current = now - timedelta(hours=24)
    start_previous = now - timedelta(hours=48)

    def in_current(dt: datetime | None) -> bool:
        return bool(dt and start_current <= dt <= now)

    def in_previous(dt: datetime | None) -> bool:
        return bool(dt and start_previous <= dt < start_current)

    tracked_codes = [
        "DATABASE_TIMEOUT",
        "DATABASE_UNAVAILABLE",
        "DATABASE_CONSTRAINT_FOREIGN_KEY",
        "DATABASE_CONSTRAINT_UNIQUE",
        "DATABASE_CONSTRAINT_VIOLATION",
    ]

    current_counts = {code: 0 for code in tracked_codes}
    previous_counts = {code: 0 for code in tracked_codes}
    current_durations: list[float] = []
    previous_durations: list[float] = []

    for row in normalized:
        ts = row["timestamp"]
        code = row["error_code"]
        duration = row["duration_ms"]

        if in_current(ts):
            if code in current_counts:
                current_counts[code] += 1
            if duration is not None:
                current_durations.append(duration)
        elif in_previous(ts):
            if code in previous_counts:
                previous_counts[code] += 1
            if duration is not None:
                previous_durations.append(duration)

    current_durations.sort()
    previous_durations.sort()

    payload = {
        "source": str(input_path),
        "generated_at": now.isoformat().replace("+00:00", "Z"),
        "window_24h": {
            "error_counts": current_counts,
            "p95_ms": round(percentile(current_durations, 0.95), 2),
        },
        "window_prev_24h": {
            "error_counts": previous_counts,
            "p95_ms": round(percentile(previous_durations, 0.95), 2),
        },
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(payload, ensure_ascii=True, indent=2), encoding="utf-8")


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: ops_v2_build_log_cache.py <input_export_file> [output_file]", file=sys.stderr)
        return 1

    input_path = Path(sys.argv[1])
    output_path = Path(
        sys.argv[2] if len(sys.argv) > 2 else "reports/ops/cache/v2-log-query-cache.json"
    )

    if not input_path.exists():
        print(f"ERROR: export file not found: {input_path}", file=sys.stderr)
        return 1

    build_cache(input_path, output_path)
    print(f"cache generated: {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
