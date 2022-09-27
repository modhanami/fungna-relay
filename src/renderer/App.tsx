import { useEffect, useState } from 'react';
import { MemoryRouter as Router, Route, Routes } from 'react-router-dom';
import { clientManager } from 'webrtc/peer-connection';
import './App.css';

const Home = () => {
  const [ip, setIp] = useState('');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');

  async function getAudioDevices() {
    const allDevices = await navigator.mediaDevices.enumerateDevices();
    const audioDevices = allDevices.filter(
      (device) => device.kind === 'audioinput'
    );
    setDevices(audioDevices);
  }

  function handleDeviceChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const deviceId = e.target.value;
    console.log(`Selected audio source: ${deviceId}`);
    clientManager.changeAudioSource(deviceId);
    setSelectedDevice(deviceId);
  }

  useEffect(() => {
    getAudioDevices();
    window.electron.ipcRenderer.getServerIp().then(setIp).catch(console.log);
  }, []);

  return (
    <div>
      <h1>Fungna Relay</h1>
      <h2>Server IP: {ip}</h2>
      <div>
        <h2>Audio</h2>
        <select onChange={handleDeviceChange} defaultValue={selectedDevice}>
          {devices.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

function What() {
  return <div>What</div>;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        {/* <Route path="/" element={<What />} /> */}
      </Routes>
    </Router>
  );
}
