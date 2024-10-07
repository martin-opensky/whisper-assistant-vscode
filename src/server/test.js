const WebSocket = require('ws');
const fs = require('fs');

const testAudioFile = 'test.wav'; // Replace with actual path

function transcribeAudio() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket('ws://localhost:8765');

    ws.on('open', () => {
      console.log('WebSocket connection opened');
      const fileStream = fs.createReadStream(testAudioFile);

      fileStream.on('data', (chunk) => {
        ws.send(chunk);
        console.log(`Sent chunk of size ${chunk.length} bytes`);
      });

      fileStream.on('end', () => {
        ws.send('END');
        console.log('Finished sending audio data');
      });

      fileStream.on('error', (error) => {
        console.error(`Error reading audio file: ${error}`);
        reject(error);
      });
    });

    ws.on('message', (data) => {
      console.log(`Received transcription: ${data}`);
      resolve(data.toString());
    });

    ws.on('error', (error) => {
      console.error(`WebSocket error: ${error}`);
      reject(error);
    });

    ws.on('close', (code, reason) => {
      console.log(`WebSocket closed. Code: ${code}, Reason: ${reason}`);
      if (ws.readyState !== WebSocket.CLOSED) {
        reject(
          new Error(
            'WebSocket connection closed before transcription was received',
          ),
        );
      }
    });

    // Add a timeout to prevent hanging indefinitely
    setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
        reject(new Error('Transcription timed out'));
      }
    }, 30000); // 30 seconds timeout
  });
}

async function main() {
  try {
    const transcription = await transcribeAudio();
    console.log('Final transcription:', transcription);
  } catch (error) {
    console.error('Transcription failed:', error);
  }
}

main();
