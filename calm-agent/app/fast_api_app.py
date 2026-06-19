# Copyright 2026 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
import logging
import os

from fastapi import FastAPI
from google.adk.cli.fast_api import get_fast_api_app

from app.app_utils.typing import Feedback

logger = logging.getLogger(__name__)

# GCP-dependent services — only when running with ADC (Vertex AI mode)
otel_to_cloud = os.getenv("GOOGLE_GENAI_USE_VERTEXAI") == "True"
logs_bucket_name = None

if otel_to_cloud:
    try:
        from app.app_utils.telemetry import setup_telemetry

        setup_telemetry()
    except Exception:
        pass

    try:
        import google.auth

        _, project_id = google.auth.default()
        logs_bucket_name = os.environ.get("LOGS_BUCKET_NAME")
    except Exception:
        pass

allow_origins = os.getenv("ALLOW_ORIGINS", "http://localhost:3000").split(",")

AGENT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
session_service_uri = None
artifact_service_uri = f"gs://{logs_bucket_name}" if logs_bucket_name else None

app: FastAPI = get_fast_api_app(
    agents_dir=AGENT_DIR,
    web=True,
    artifact_service_uri=artifact_service_uri,
    allow_origins=allow_origins,
    session_service_uri=session_service_uri,
    otel_to_cloud=otel_to_cloud,
)
app.title = "calm-agent"
app.description = "API for interacting with the Agent calm-agent"


@app.post("/feedback")
def collect_feedback(feedback: Feedback) -> dict[str, str]:
    """Collect and log feedback."""
    logger.info("Feedback: %s", feedback.model_dump())
    return {"status": "success"}


# Main execution
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
