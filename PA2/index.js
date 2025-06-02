const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
const { mat4, vec3 } = require('gl-matrix');

const app = express();
const server = http.createServer(app); // Create an HTTP server
const io = new Server(server, {
    cors: {
        origin: "*", // Adjust this in production!
        methods: ["GET", "POST"]
    }
});

app.use(express.json({ limit: '10mb' }));

// Serve static files from "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// HTTP route
app.post("/data", (req, res) => {

    const accelerometer = req.body.payload.filter(p => p.name == "accelerometeruncalibrated")
    console.log(accelerometer[accelerometer.length - 1])
    const { x, y, z } = accelerometer[accelerometer.length - 1].values

    // Emit a Socket.IO event to all connected clients
    io.emit("data", {
        messageId: req.body.messageId,
        accelerometer: createRotationMatrixFromAccelerometer(x, y, z)
    });
    res.send("response");
});

// Socket.IO connection handler
io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });
});

// Start the server
server.listen(8000, () => {
    console.log("LISTENING ON PORT 8000");
});



function createRotationMatrixFromAccelerometer(ax, ay, az) {
    const up = vec3.normalize(vec3.create(), [-ax, -ay, -az]); // invert to get "up"

    // Choose a default world-forward axis (e.g., [0, 0, -1])
    let forward = vec3.fromValues(0, 0, -1);

    // If forward and up are too close, switch forward to [1, 0, 0] to avoid cross product ≈ 0
    if (Math.abs(vec3.dot(up, forward)) > 0.99) {
        forward = vec3.fromValues(1, 0, 0);
    }

    const right = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), forward, up));
    const adjustedForward = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), up, right));

    // Compose 4x4 rotation matrix
    const rotationMatrix = mat4.fromValues(
        right[0], right[1], right[2], 0,
        up[0], up[1], up[2], 0,
        adjustedForward[0], adjustedForward[1], adjustedForward[2], 0,
        0, 0, 0, 1
    );

    return rotationMatrix;
}