FROM python:3.14.0rc2-slim

# Install system dependencies
RUN apt-get update --fix-missing && apt-get install -y \
    git \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages with retry logic
RUN --mount=type=cache,target=/root/.cache/pip \
    for i in {1..3}; do \
        pip install fastapi uvicorn python-multipart faster-whisper && break || sleep 15; \
    done

# Create app directory
WORKDIR /app

# Pre-download the model during build
RUN python -c "from faster_whisper import WhisperModel; WhisperModel('base', device='cpu', compute_type='int8')"

# Create main.py with embedded code
RUN echo 'from fastapi import FastAPI, UploadFile, File\n\
from fastapi.middleware.cors import CORSMiddleware\n\
from faster_whisper import WhisperModel\n\
import tempfile\n\
import os\n\
\n\
app = FastAPI(title="Whisper Assistant API")\n\
\n\
# Configure CORS\n\
app.add_middleware(\n\
    CORSMiddleware,\n\
    allow_origins=["*"],  # Allows all origins\n\
    allow_credentials=True,\n\
    allow_methods=["*"],  # Allows all methods\n\
    allow_headers=["*"],  # Allows all headers\n\
)\n\
\n\
# Initialize the model (already downloaded during build)\n\
whisper_model = WhisperModel("base", device="cpu", compute_type="int8")\n\
\n\
@app.post("/v1/audio/transcriptions")\n\
async def transcribe_audio(\n\
    file: UploadFile = File(...),\n\
    model_name: str = "whisper-1",  # Renamed parameter to avoid conflict\n\
    language: str = "en"\n\
):\n\
    """Transcribe audio file to text"""\n\
    # Save uploaded file temporarily\n\
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:\n\
        content = await file.read()\n\
        temp_file.write(content)\n\
        temp_file.flush()\n\
        \n\
        # Transcribe the audio\n\
        segments, info = whisper_model.transcribe(\n\
            temp_file.name,\n\
            language=language,\n\
            vad_filter=True\n\
        )\n\
        \n\
        # Format response to match OpenAI API\n\
        formatted_segments = []\n\
        for i, segment in enumerate(segments):\n\
            formatted_segments.append({\n\
                "id": i,\n\
                "seek": 0,\n\
                "start": segment.start,\n\
                "end": segment.end,\n\
                "text": segment.text,\n\
                "tokens": [],\n\
                "temperature": 0.0,\n\
            })\n\
        \n\
        # Clean up temp file\n\
        os.unlink(temp_file.name)\n\
        \n\
        return {\n\
            "text": " ".join(seg["text"] for seg in formatted_segments),\n\
            "segments": formatted_segments,\n\
            "language": info.language\n\
        }\n\
\n\
@app.get("/v1/health")\n\
async def health_check():\n\
    """Check if the API is running"""\n\
    return {"status": "ok"}\n\
\n\
@app.get("/")\n\
async def root():\n\
    """Get API information and available endpoints"""\n\
    return {\n\
        "message": "Whisper Assistant API",\n\
        "docs": "/docs",\n\
        "health_check": "/v1/health",\n\
        "transcribe": "/v1/audio/transcriptions"\n\
    }' > main.py

# Expose the port
EXPOSE 4444

# Run the server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "4444"] 