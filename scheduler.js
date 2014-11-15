var app = require('express'),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    SQS = require('./sqs'),
    port = 4000;

io.on('connection', function (socket) {
    console.log("Client connected : ", socket.conn.remoteAddress);

    socket.on('tasker', function (task) {
        console.log("Received task : ", task);

        // NOTE: Send task to SQS and return the taskId to client
        SQS.sendMessage(task).then(function (taskId) {
            socket.emit('tasker', taskId);
        });
    });

    socket.on('disconnect', function () {
        console.log("Client disconnected : ", this.conn.remoteAddress);
    });
});

http.listen(port, function () {
    console.log("Scheduler running on " + port + "...");
});