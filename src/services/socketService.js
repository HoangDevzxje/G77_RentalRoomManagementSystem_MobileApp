import { io } from "socket.io-client";

const SOCKET_URL =
  "https://faultier-nonaristocratically-willene.ngrok-free.dev";

class SocketService {
  constructor() {
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.options = {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      forceNew: true,
    };
  }

  connect(token) {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket.removeAllListeners();
      this.socket = null;
    }

    const opts = {
      ...this.options,
      auth: token ? { token } : undefined,
    };

    this.socket = io(SOCKET_URL, opts);

    this.socket.on("connect", () => {
      this.reconnectAttempts = 0;
    });

    this.socket.on("connect_error", (err) => {
      this.reconnectAttempts++;
    });

    return this.socket;
  }

  getSocket() {
    return this.socket;
  }

  isConnected() {
    return !!(this.socket && this.socket.connected);
  }

  on(event, handler) {
    if (!this.socket) return;
    this.socket.on(event, handler);
  }

  off(event, handler) {
    if (!this.socket) return;
    this.socket.off(event, handler);
  }

  emit(event, data) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket.removeAllListeners();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
export default socketService;
