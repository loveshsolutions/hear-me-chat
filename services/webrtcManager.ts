import { socketService } from './socketService';

// Standard public STUN servers for demo purposes. 
// In production, you MUST add TURN servers here to get through firewalls.
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:global.stun.twilio.com:3478' },
    { urls: 'stun:stun.voiparound.com:3478' },
    { urls: 'stun:stun.ekiga.net:3478' }
  ]
};

class WebRTCManager {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  public onRemoteStream: ((stream: MediaStream) => void) | null = null;

  constructor() {
    console.log('[WebRTC] Manager Initialized');
  }

  public async startLocalStream(): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      return this.localStream;
    } catch (err) {
      console.error('[WebRTC] Error accessing media devices:', err);
      throw err;
    }
  }

  public createPeerConnection() {
    if (this.peerConnection) return;

    console.log('[WebRTC] Creating RTCPeerConnection');
    this.peerConnection = new RTCPeerConnection(ICE_SERVERS);

    // 1. Handle Remote Stream
    this.peerConnection.ontrack = (event) => {
      console.log('[WebRTC] Received Remote Track');
      if (!this.remoteStream) {
        this.remoteStream = new MediaStream();
      }
      this.remoteStream.addTrack(event.track);
      if (this.onRemoteStream) {
        this.onRemoteStream(this.remoteStream);
      }
    };

    // 2. Handle ICE Candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socketService.emit('VIDEO_SIGNAL', { type: 'CANDIDATE', candidate: event.candidate });
      }
    };

    // 3. Add Local Tracks to Connection
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        if (this.localStream && this.peerConnection) {
            this.peerConnection.addTrack(track, this.localStream);
        }
      });
    }
  }

  public async createOffer() {
    if (!this.peerConnection) this.createPeerConnection();
    if (!this.peerConnection) return;

    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    socketService.emit('VIDEO_SIGNAL', { type: 'OFFER', sdp: offer });
  }

  public async handleSignal(data: any) {
    if (!this.peerConnection) this.createPeerConnection();
    if (!this.peerConnection) return;

    switch (data.type) {
      case 'OFFER':
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        socketService.emit('VIDEO_SIGNAL', { type: 'ANSWER', sdp: answer });
        break;
      
      case 'ANSWER':
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.sdp));
        break;
      
      case 'CANDIDATE':
        if (data.candidate) {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
        break;
    }
  }

  public close() {
    console.log('[WebRTC] Closing Connection');
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    
    if (this.peerConnection) {
      this.peerConnection.ontrack = null;
      this.peerConnection.onicecandidate = null;
      this.peerConnection.close();
      this.peerConnection = null;
    }
    this.remoteStream = null;
  }
}

export const webrtcManager = new WebRTCManager();