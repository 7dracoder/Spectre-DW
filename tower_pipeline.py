import json
import os
from datetime import datetime, timezone


def read_parameter(name: str) -> str:
    return os.environ.get(name, "")


event = {
    "event": "specter.investigation.completed",
    "occurred_at": datetime.now(timezone.utc).isoformat(),
    "investigation_id": read_parameter("investigation_id"),
    "subject_name": read_parameter("subject_name"),
    "context": read_parameter("context"),
    "source_count": read_parameter("source_count"),
    "consistency_score": read_parameter("consistency_score"),
}

print(json.dumps(event, separators=(",", ":")))
