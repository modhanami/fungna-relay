import { Socket } from 'socket.io-client';

export const relayMessageEventName = 'relay:message';

interface CreateTransportOptions {
  clientId: string;
}
export interface RTCTransportSender {
  sendCandidate(candidate: RTCIceCandidate): void;
  sendOffer(offer: RTCSessionDescriptionInit): void;
  sendAnswer(answer: RTCSessionDescription): void;
}

// TODO: implement relay authentification to the server
export function createSocketIoTransport(
  socket: Socket,
  options: CreateTransportOptions
): RTCTransportSender {
  const { clientId } = options;

  return {
    sendCandidate(candidate) {
      socket.emit(relayMessageEventName, {
        type: 'candidate',
        payload: candidate,
        clientId,
      });
    },
    sendAnswer(answer) {
      socket.emit(relayMessageEventName, {
        type: 'answer',
        payload: answer,
        clientId,
      });
    },
    sendOffer(offer) {
      socket.emit(relayMessageEventName, {
        type: 'offer',
        payload: offer,
        clientId,
      });
    },
  };
}
