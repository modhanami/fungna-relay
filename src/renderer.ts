const socket = io("http://localhost:30033");

let connectionText = document.getElementById("connection");

/** @type RTCPeerConnection */
const peerConnection = createPeerConnection();
const audioSource = document.getElementById('audio-source');

let localStream = null;

peerConnection.addEventListener("icecandidate", (event) => {
  if (event.candidate) {
    socket.emit("message", {
      type: "candidate",
      payload: event.candidate
    });
  }
});

peerConnection.addEventListener("connectionstatechange", () => {
  console.log(peerConnection.connectionState);
});

socket.on("message", (data) => {
  console.log(`<<< Data from server [${data.type}]`);
  if (data.type === 'answer') {
    const remoteSdp = new RTCSessionDescription(data.payload);
    handleAnswer(peerConnection, remoteSdp);
    connectionText.innerText = "Connected!";
  }
  if (data.type === 'candidate') {
    const candidate = new RTCIceCandidate(data.payload);
    handleCandidate(peerConnection, candidate);
  }
  if (data.type === 'ready') {
    makeOffer(peerConnection, audioSource.value);
  }
});

function createPeerConnection(socket) {
  const config = {
    iceServers: []
  };

  const pc = new RTCPeerConnection(config);
  return pc;
}

async function makeOffer(peerConnection, audioDeviceId = 'default') {
  const musicConstraints = {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
  };

  /** type MediaTrackConstraints */
  const audioConstraints = {
    ...musicConstraints
  };

  if (audioDeviceId) {
    audioConstraints.deviceId = audioDeviceId;
  }

  const localStream = await navigator.mediaDevices.getUserMedia({
    audio: audioConstraints,
  });

  for (const track of localStream.getTracks()) {
    const sender = peerConnection.getSenders().find(sender => sender.track.kind === track.kind);
    if (sender) {
      await sender.replaceTrack(track);
    } else {
      peerConnection.addTrack(track, localStream);
    }
  }

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  socket.emit("message", {
    type: "offer",
    payload: offer
  });
}

async function handleAnswer(pc, remoteSdp) {
  await pc.setRemoteDescription(remoteSdp);
}

async function handleCandidate(pc, candidate) {
  await pc.addIceCandidate(candidate);
}

navigator.mediaDevices.enumerateDevices().then(function (deviceInfos) {
  for (const deviceInfo of deviceInfos) {
    if (deviceInfo.kind !== "audioinput") {
      continue;
    }

    console.log(deviceInfo);

    const option = document.createElement("option");
    option.value = deviceInfo.deviceId;
    option.text = deviceInfo.label || `Microphone ${audioSource.length + 1}`;
    if (deviceInfo.deviceId === 'default') {
      option.selected = true;
    }

    audioSource.appendChild(option);
  }
});

audioSource.addEventListener('change', (event) => {
  if (!peerConnection) {
    console.log("No peer connection");
    return;
  }

  const audioSourceId = audioSource.value;
  console.log(`Selected audio source: ${audioSourceId}`);
  makeOffer(peerConnection, audioSourceId);
});
