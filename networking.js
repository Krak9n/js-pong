class PeerNetwork {
	constructor(roomId, onData = () => {}, onStatus = () => {}) {
		this.roomId = roomId;
		this.onData = onData;
		this.onStatus = onStatus;
		this.peer = null;
		this.connection = null;
		this.isHost = false;
	}

	start() {
		const candidate = new Peer(this.roomId); // claiming the host
		this.peer = candidate;

		candidate.on("connection", (connection) => {
			this.attach(connection);
		});

		candidate.on("open", () => {
			this.isHost = true;
			this.onStatus("Server has started. Waiting for another player");
		});

		candidate.on("error", (error) => {
			if (error.type !== "unavailable-id") {
				this.onStatus("Connection error: " + error.type);
				return;
			}

			candidate.destroy(); // in this case should connect to the owner
			this.peer = new Peer();

			this.peer.on("open", () => {
				this.attach(this.peer.connect(this.roomId));
			});
		});
	}

	attach(connection) {
		if (this.connection) {
			connection.close();
			return;
		}

		this.connection = connection;

		connection.on("open", () => this.onStatus("Player connected"));
		connection.on("data", (data) => this.onData(data));
		connection.on("close", () => {
			this.connection = null;
			this.onStatus("Player disconnected");
		});
	}
	// improve this aspect
	send(data) {
		if (this.connection?.open) {
			this.connection.send(data);
		}
	}

	close() {
		this.connection?.close();
		this.peer?.destroy();
	}
}
