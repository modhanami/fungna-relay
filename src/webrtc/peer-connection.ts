import { Socket } from 'socket.io-client';
import { createSocketIoTransport, RTCTransportSender } from './socket-io';

// const socket = io("http://localhost:30033");

// socket.on("message", (data) => {
//   console.log(`<<< Data from server [${data.type}]`);
//   if (data.type === 'answer') {
//     const remoteSdp = new RTCSessionDescription(data.payload);
//     handleAnswer(peerConnection, remoteSdp);
//     connectionText.innerText = "Connected!";
//   }
//   if (data.type === 'candidate') {
//     const candidate = new RTCIceCandidate(data.payload);
//     handleCandidate(peerConnection, candidate);
//   }
//   if (data.type === 'ready') {
//     makeOffer(peerConnection, audioSource.value);
//   }
// });

interface SocketIoPeerConnection {
  pc: RTCPeerConnection;
  transport: RTCTransportSender;
  offerAudio: (audioDeviceId: string) => Promise<void>;
}

function setupSocketIoPeerConnectionEventHandlers(
  pc: RTCPeerConnection,
  transport: RTCTransportSender
) {
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      transport.sendCandidate(event.candidate);
    }
  };

  pc.onconnectionstatechange = () => {
    console.log(`Connection state changed: ${pc.connectionState}`);
  };
}

export function createSocketIoPeerConnection(socket: Socket) {
  const transport = createSocketIoTransport(socket);
  const commonEventName = 'message';

  const config = {
    iceServers: [],
  };

  const pc = new RTCPeerConnection(config);
  const spc: SocketIoPeerConnection = {
    pc,
    transport,
    offerAudio: (audioDeviceId) => makeOffer(spc, audioDeviceId),
  };

  socket.on(commonEventName, async (message) => {
    console.log(`Data from server [${message.type}]`);
    switch (message.type) {
      case 'answer':
        console.log('Received answer');
        await pc.setRemoteDescription(message.payload);
        break;
      case 'candidate':
        console.log('Received candidate');
        await pc.addIceCandidate(message.payload);
        break;
      case 'ready':
        console.log('Received ready');
        await makeOffer(spc);
        break;
      default:
        console.log('Unknown message type');
    }
  });

  setupSocketIoPeerConnectionEventHandlers(pc, transport);

  return spc;
}

async function makeOffer(
  spc: SocketIoPeerConnection,
  audioDeviceId = 'default'
) {
  const musicConstraints: MediaTrackConstraints = {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
  };

  const audioConstraints = {
    ...musicConstraints,
  };

  if (audioDeviceId) {
    audioConstraints.deviceId = audioDeviceId;
  }

  const localStream = await navigator.mediaDevices.getUserMedia({
    audio: audioConstraints,
  });

  const tracks = localStream.getTracks();
  tracks.forEach(async (track) => {
    const sender = spc.pc
      .getSenders()
      .find((s) => s.track?.kind === track.kind);
    if (sender) {
      await sender.replaceTrack(track);
    } else {
      spc.pc.addTrack(track, localStream);
    }
  });

  const offer = await spc.pc.createOffer();
  await spc.pc.setLocalDescription(offer);

  spc.transport.sendOffer(offer);
}

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
