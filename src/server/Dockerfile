FROM python:3.9

RUN apt-get update && apt-get install -y ffmpeg

RUN pip install faster-whisper websockets

COPY ./realtime_transcription.py /app/realtime_transcription.py

WORKDIR /app

CMD ["python", "realtime_transcription.py"]
