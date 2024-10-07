import asyncio
import websockets
import io
from faster_whisper import WhisperModel

model = WhisperModel("base", device="cpu", compute_type="int8")

async def transcribe(websocket, path):
    buffer = io.BytesIO()
    
    async for message in websocket:
        if isinstance(message, bytes):
            buffer.write(message)
        elif message == "END":
            buffer.seek(0)
            segments, info = model.transcribe(buffer, beam_size=5)
            
            for segment in segments:
                await websocket.send(segment.text)
            
            buffer = io.BytesIO()

async def main():
    server = await websockets.serve(transcribe, "0.0.0.0", 8765)
    await server.wait_closed()

if __name__ == "__main__":
    asyncio.run(main())