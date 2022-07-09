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
    makeOffer(peerConnection);
  }
});

function createPeerConnection(socket) {
  const config = {
    iceServers: []
  };

  const pc = new RTCPeerConnection(config);
  return pc;
}

async function makeOffer(peerConnection, audioDeviceId = null) {
  const localStream = await navigator.mediaDevices.getUserMedia({
    audio: audioDeviceId == null
      ? true
      : { deviceId: audioDeviceId }
  });

  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

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
