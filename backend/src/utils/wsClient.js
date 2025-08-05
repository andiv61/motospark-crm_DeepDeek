class WsClient {
  constructor() {
    this.socket = null;
    this.eventHandlers = {};
  }

  connect(token) {
    if (this.socket) return;

    const wsUrl = `${window.location.protocol === 'https:' ? 'wss://' : 'ws://'}${window.location.host}/ws?token=${token}`;
    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      console.log('WebSocket connected');
    };

    this.socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (this.eventHandlers[message.event]) {
          this.eventHandlers[message.event].forEach(handler => handler(message.data));
        }
      } catch (err) {
        console.error('Error parsing WS message', err);
      }
    };

    this.socket.onclose = () => {
      console.log('WebSocket disconnected');
      setTimeout(() => this.connect(token), 5000);
    };
  }

  on(event, handler) {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    this.eventHandlers[event].push(handler);
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

export default new WsClient();