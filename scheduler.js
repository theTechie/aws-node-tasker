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

var port = argv.schedulerport,
    QUEUE_MASTER = 'CS553';

// NOTE: Create Master Queue : CS553
SQS.createQueue(QUEUE_MASTER).then(function (data) {
    console.log("Master Queue created : ", data.QueueUrl);

    io.on('connection', function (socket) {
        console.log("Client connected : ", socket.conn.remoteAddress);

        var clientId = uuid.v1(); // NOTE: clientId == queueName (result queue specific to client)

        // NOTE: Create result queue for client => use 'clientId' as 'queueName'
        SQS.createQueue(clientId).then(function (data) {

            console.log("Queue created : ", data.QueueUrl);

            socket.emit('READY');

            socket.on('taskSubmit', function (task) {
                console.log("Received task : ", task);

                var messageAttributes = {
                    clientId: {
                        DataType: 'String',
                        StringValue: clientId
                    }
                };

                // NOTE: Send task to SQS and return the taskId to client
                SQS.sendMessage(undefined, messageAttributes, task).then(function (taskId) {
                    socket.emit('taskSubmit', taskId);
                });
            });

            // NOTE: ReceiveMessage() on QUEUE created on initial request from client
            setInterval(function () {
                SQS.receiveMessage(clientId, ['taskId']).then(function (data) {
                    if (data.Messages && data.Messages.length > 0) {
                        socket.emit('taskResult', data);
                    }
                });
            }, 1000);

            socket.on('disconnect', function () {
                console.log("Client disconnected : ", this.conn.remoteAddress);
                console.log("Deleting client queue...PLEASE WAIT BEFORE EXITING !");
                SQS.deleteQueue(clientId).then(function (data) {
                    console.log("Successfully deleted queue for client : ", clientId);
                });
            });

        }, function (error) {
            console.error("'Error creating client response queue : ", error);
        });
    });

    http.listen(port, function () {
        console.log("Scheduler running on port " + port + "...");
    });
}, function (error) {
    console.error("Error creating Master Queue : ", error);
    console.log('Exiting Scheduler !');
    process.exit();
});

process.on("SIGINT", function () {
    console.log('Exiting Scheduler !');
    process.exit();
});
