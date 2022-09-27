import { io, Socket } from 'socket.io-client';
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
  clientId: string;
  transport: RTCTransportSender;
  offerAudio: (audioDeviceId: string) => Promise<void>;
}

export function createSocketIoPeerConnection(socket: Socket, clientId: string) {
  const transport = createSocketIoTransport(socket, { clientId });
  const config = {
    iceServers: [],
  };

  const pc = new RTCPeerConnection(config);
  const spc: SocketIoPeerConnection = {
    pc,
    clientId,
    transport,
    offerAudio: (audioDeviceId) => makeOffer(spc, audioDeviceId),
  };

  console.table({
    iceConnectionState: pc.iceConnectionState,
    iceGatheringState: pc.iceGatheringState,
    connectionState: pc.connectionState,
    currentLocalDescription: pc.currentLocalDescription,
    currentRemoteDescription: pc.currentRemoteDescription,
  });

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      transport.sendCandidate(event.candidate);
    }
  };

  pc.onconnectionstatechange = () => {
    console.log(
      `Connection state changed for ${clientId}: ${pc.connectionState}`
    );
  };

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
      console.log(`Replaced ${track.kind} track for ${spc.clientId}`);
      await sender.replaceTrack(track);
    } else {
      console.log(`Added ${track.kind} track for ${spc.clientId}`);
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

export const socket = io('http://localhost:30033', {
  query: {
    isRelay: true,
  },
});

socket.on('connect', () => {
  console.log('Connected to server as ', socket.id);
});

const peerConnections: Map<string, SocketIoPeerConnection> = new Map();

socket.on('client:join', ({ clientId }) => {
  console.log(`Client joined: ${clientId}`);
  const spc = createSocketIoPeerConnection(socket, clientId);
  peerConnections.set(clientId, spc);
});

socket.on('client:leave', ({ clientId }) => {
  console.log(`Client left: ${clientId}`);
  const spc = peerConnections.get(clientId);
  if (spc) {
    spc.pc.close();
    peerConnections.delete(clientId);
  }
});

socket.on('client:request-offer', async ({ clientId }) => {
  console.log(`Client requested an offer: ${clientId}`);
  const spc = peerConnections.get(clientId);
  if (spc) {
    spc.offerAudio('default');
  }
});

socket.on('client:message', async ({ clientId, message }) => {
  console.log(`Client sent message: ${clientId}`);
  const spc = peerConnections.get(clientId);
  if (spc) {
    switch (message.type) {
      case 'answer':
        console.log(`Received answer from ${clientId}`);
        await spc.pc.setRemoteDescription(message.payload);
        break;
      case 'candidate':
        console.log(`Received candidate from ${clientId}`);
        await spc.pc.addIceCandidate(message.payload);
        break;
      default:
        console.log(`Unknown message type from ${clientId}, `, message);
    }
  }
});

export const clientManager = (() => {
  function changeAudioSource(audioDeviceId: string) {
    peerConnections.forEach((spc) => {
      spc.offerAudio(audioDeviceId);
    });
  }

  return {
    changeAudioSource,
  };
})();
