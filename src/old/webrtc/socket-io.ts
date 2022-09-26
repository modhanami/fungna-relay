import {Socket} from "socket.io-client";

export interface RTCTransportSender {
  sendCandidate(candidate: RTCIceCandidate): void;

  sendOffer(offer: RTCSessionDescriptionInit): void;

  sendAnswer(answer: RTCSessionDescription): void;
}

export function createSocketIoTransport(socket: Socket): RTCTransportSender {
  const commonEventName = "message";

  return {
    sendCandidate(candidate) {
      socket.emit(commonEventName, {
        type: "candidate",
        payload: candidate
      });
    },
    sendAnswer(answer) {
      socket.emit(commonEventName, {
        type: "answer",
        payload: answer
      });
    },
    sendOffer(offer) {
      socket.emit(commonEventName, {
        type: "offer",
        payload: offer
      });
    },
  }
}