import { Peer } from "peerjs";
const peer = new Peer();

peer.on("open", (id) => {
	console.log("The server id is: ", id);
});

peer.on("error", (err) => {
	console.error("Peer error: ", err.type, err);
});
