import asyncio
import websockets
import io
from faster_whisper import WhisperModel

model = WhisperModel("small", device="cpu", compute_type="int8")

async def transcribe(websocket, path):
    buffer = io.BytesIO()
    
    try:
        async for message in websocket:
            if isinstance(message, bytes):
                buffer.write(message)
            elif message == "END":
                buffer.seek(0)
                segments, info = model.transcribe(buffer, beam_size=5)
                
                full_text = " ".join(segment.text for segment in segments)
                await websocket.send(full_text)
                
                buffer = io.BytesIO()
    except websockets.exceptions.ConnectionClosed:
        print("WebSocket connection closed unexpectedly")
    finally:
        await websocket.close()

async def main():
    server = await websockets.serve(transcribe, "0.0.0.0", 8765)
    await server.wait_closed()

if __name__ == "__main__":
    asyncio.run(main())