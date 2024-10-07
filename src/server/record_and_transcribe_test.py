import asyncio
import websockets
import sounddevice as sd
import numpy as np
import tempfile
import os
import wave

CHANNELS = 1
RATE = 16000
CHUNK = 1024

async def record_audio():
    print("Recording... Press Enter to stop.")
    recording = sd.rec(int(RATE * 60), samplerate=RATE, channels=CHANNELS)
    input()  # Wait for Enter key
    sd.stop()
    return recording

async def record_and_transcribe():
    print("Press Enter to start recording.")
    
    while True:
        input()  # Wait for Enter key to start recording
        
        recording = await record_audio()
        
        print("Stopped recording. Transcribing...")
        
        # Save the recorded audio to a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_audio:
            wf = wave.open(temp_audio.name, 'wb')
            wf.setnchannels(CHANNELS)
            wf.setsampwidth(2)  # 2 bytes for 'int16' dtype
            wf.setframerate(RATE)
            wf.writeframes((recording * 32767).astype(np.int16).tobytes())
            wf.close()
        
        # Send the audio file to the WebSocket server
        async with websockets.connect("ws://localhost:8765") as websocket:
            with open(temp_audio.name, "rb") as audio_file:
                while True:
                    chunk = audio_file.read(4096)
                    if not chunk:
                        break
                    await websocket.send(chunk)
                
                await websocket.send("END")
                
                async for message in websocket:
                    print(f"Transcription: {message}")
        
        # Clean up the temporary file
        os.unlink(temp_audio.name)
        
        print("Press Enter to start a new recording, or type 'exit' to quit.")
        if input().lower() == 'exit':
            break

if __name__ == "__main__":
    asyncio.run(record_and_transcribe())