var app = require('express'),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    uuid = require('node-uuid'),
    SQS = require('./sqs'),
    EC2 = require('./ec2');

var argv = require('optimist')
    .usage('Usage: $0 -s [PORT] -p [yes | no] -rw')
    .demand(['s', 'p', 'rw'])
    .alias('s', 'schedulerport')
    .describe('s', 'Scheduler Port')
    .alias('p', 'provisioner')
    .describe('p', 'Provisioner')
    .default('p', 'yes')
    .alias('rw', 'remoteworker')
    .describe('rw', 'Remote Worker')
    .default('rw', 1)
    .argv;

var port = argv.schedulerport,
    QUEUE_MASTER = 'ANIMOTO',
    QUEUE_LENGTH = 0,
    MAX_INSTANCE_COUNT = 1;

// NOTE: Create Master Queue : CS553
SQS.createQueue(QUEUE_MASTER).then(function (data) {
    console.log("[Scheduler] : Master Queue created : ", data.QueueUrl);

    if (argv.p == 'yes')
        startProvisioner();

    io.on('connection', function (socket) {
        console.log("[Scheduler] : Client connected : ", socket.conn.remoteAddress);

        var clientId = uuid.v1(); // NOTE: clientId == queueName (result queue specific to client)

        // NOTE: Create result queue for client => use 'clientId' as 'queueName'
        SQS.createQueue(clientId).then(function (data) {

            console.log("[Scheduler] : Client Queue created : ", data.QueueUrl);

            socket.emit('READY');

            socket.on('taskSubmit', function (task) {
                console.log("[Scheduler] : Received task : ", task);

                var messageAttributes = {
                    clientId: {
                        DataType: 'String',
                        StringValue: clientId
                    }
                };

                // NOTE: Send task to SQS and return the taskId to client
                SQS.sendMessage(undefined, messageAttributes, task).then(function (taskId) {
                    socket.emit('taskSubmit', taskId);
                }, function (err) {
                    console.log("ERROR : sendMessage() : ", err);
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
                console.log("[Scheduler] : Client disconnected : ", this.conn.remoteAddress);
                console.log("[Scheduler] : Deleting client queue...PLEASE WAIT BEFORE EXITING !");
                SQS.deleteQueue(clientId).then(function (data) {
                    console.log("[Scheduler] : Successfully deleted queue for client : ", clientId);
                });
            });

        }, function (error) {
            console.error("'[Scheduler] : Error creating client response queue : ", error);
        });
    });

    http.listen(port, function () {
        console.log("[Scheduler] : Running on port " + port + "...");
    });
}, function (error) {
    console.error("[Scheduler] : Error creating Master Queue : ", error);
    console.log('[Scheduler] : Exiting Scheduler !');
    process.exit();
});

// NOTE: Start Dynamic Provisioner
function startProvisioner() {
    var USER_DATA = 'I2Nsb3VkLWNvbmZpZw0KcnVuY21kOg0KIC0gWyBjZCwgIiRIT01FIiBdDQogLSBbIGdpdCwgY2xvbmUsICJodHRwczovL2dpdGh1Yi5jb20vdGhlVGVjaGllL2F3cy1ub2RlLXRhc2tlci5naXQiLCAiYXdzLW5vZGUtdGFza2VyIiBdDQogLSBbIGNkLCAiYXdzLW5vZGUtdGFza2VyIiBdDQogLSBbIG5wbSwgaW5zdGFsbCBdDQogLSBbIG5vZGVqcywgIndvcmtlci5qcyIsICItaSIsIDUgXQ0KZmluYWxfbWVzc2FnZTogIlRoZSBzeXN0ZW0gaXMgZmluYWxseSB1cCwgYWZ0ZXIgJFVQVElNRSBzZWNvbmRzIg==';


    var canProceed = true;

    // NOTE: Check for tasks on Master Q every 1 second
    setInterval(function () {
        SQS.getQueueLength(QUEUE_MASTER).then(function (length) {
            // NOTE: get number of spot instances in 'pending' and 'running' state
            EC2.describeInstances().then(function (data) {
                var instanceCount = data.Reservations.length;

                console.log("[Provisioner] : Queue Length: " + length + ", Instance Count : " + instanceCount);

                // NOTE: if the number of tasks increased, start a worker
                if (parseInt(length) > parseInt(QUEUE_LENGTH) && parseInt(instanceCount) < parseInt(MAX_INSTANCE_COUNT)) {
                    console.log("[Provisioner] : Provisioning... 1 Spot Instance.");

                    EC2.createSpotInstances(1, USER_DATA).then(function (data) {
                        console.log("[Provisioner] : Provisioned 1 Spot Instance.");
                    }, function (error) {
                        console.error("[Provisioner] : Error -> createSpotInstances() : " + error);
                    });
                }
                QUEUE_LENGTH = parseInt(length);
            }, function (err) {
                console.error("[Provisioner] : Error -> describeInstances() : " + err);
            });
        }, function (error) {
            console.error("[Provisioner] : Error -> getQueueLength() : " + error);
        });
    }, 1000);
}

process.on("SIGINT", function () {
    console.log('Exiting Scheduler !');
    process.exit();
});
