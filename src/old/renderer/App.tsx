import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { createSocketIoPeerConnection } from '../webrtc/peer-connection';

export function App() {
  const [socket, _setSocket] = useState(io('http://localhost:30033'));
  const [spc, setSpc] = useState(createSocketIoPeerConnection(socket));
  // navigator.mediaDevices.enumerateDevices().then(function (deviceInfos) {
  //   for (const deviceInfo of deviceInfos) {
  //     if (deviceInfo.kind !== "audioinput") {
  //       continue;
  //     }
  //
  //     console.log(deviceInfo);
  //
  //     const option = document.createElement("option");
  //     option.value = deviceInfo.deviceId;
  //     option.text = deviceInfo.label || `Microphone ${audioSource.length + 1}`;
  //     if (deviceInfo.deviceId === 'default') {
  //       option.selected = true;
  //     }
  //
  //     audioSource.appendChild(option);
  //   }
  // });
  //
  // audioSource.addEventListener('change', (event) => {
  //   if (!peerConnection) {
  //     console.log("No peer connection");
  //     return;
  //   }
  //
  //   const audioSourceId = audioSource.value;
  //   console.log(`Selected audio source: ${audioSourceId}`);
  //   makeOffer(peerConnection, audioSourceId);
  // });

  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);

  async function getAudioDevices() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioDevices = devices.filter(
      (device) => device.kind === 'audioinput'
    );
    setDevices(audioDevices);
  }

  useEffect(() => {
    getAudioDevices();
  }, []);

  return (
    <div>
      <h1>WebRTC</h1>
      <div>
        <h2>Audio</h2>
        <select onChange={(e) => setSelectedDevice(e.target.value)}>
          {devices.map((device) => (
            <option
              key={device.deviceId}
              value={device.deviceId}
              selected={device.deviceId === selectedDevice}
            >
              {device.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
