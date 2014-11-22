var app = require('express'),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    uuid = require('node-uuid'),
    SQS = require('./sqs');

var argv = require('optimist')
    .usage('Usage: $0 -s [PORT] -rw')
    .demand(['s', 'rw'])
    .alias('s', 'schedulerport')
    .describe('s', 'Scheduler Port')
    .alias('rw', 'remoteworker')
    .describe('rw', 'Remote Worker')
    .default('rw', 1)
    .argv;

var port = argv.s;

io.on('connection', function (socket) {
    console.log("Client connected : ", socket.conn.remoteAddress);

    var clientId = uuid.v1();

    // NOTE: Create result queue for client => use 'clientId' as 'queueName'
    SQS.createQueue(clientId).then(function (data) {
        console.log("Queue created : ", data.QueueUrl);
    });

    socket.on('taskSubmit', function (task) {
        console.log("Received task : ", task);

        // NOTE: Send task to SQS and return the taskId to client
        SQS.sendMessage(clientId, task).then(function (taskId) {
            socket.emit('taskSubmit', taskId);
        });
    });

    // NOTE: ReceiveMessage() on QUEUE created on initial request from client
    setInterval(function () {
        SQS.receiveMessage(clientId).then(function (data) {
            if (data.Messages && data.Messages.length > 0) {
                socket.emit('taskResult', data);
            }
        });
    }, 5000);

    socket.on('disconnect', function () {
        console.log("Client disconnected : ", this.conn.remoteAddress);
        console.log("Deleting client queue...");
        SQS.deleteQueue(clientId).then(function (data) {
            console.log("Successfully deleted queue for client : ", clientId);
        });
    });
});

http.listen(port, function () {
    console.log("Scheduler running on " + port + "...");
});
