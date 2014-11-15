var fs = require('fs'),
    Q = require('q'),
    io = require('socket.io-client'),
    SQS = require('./sqs');

var argv = require('optimist')
    .usage('Usage: $0 -s [IP_ADDRESS]:[PORT] -w [WORKLOAD_FILE]')
    .demand(['s', 'w'])
    .alias('s', 'scheduler')
    .describe('s', 'Task Scheduler')
    .alias('w', 'workload')
    .describe('w', 'Workload File')
    .argv;

var socket = io(argv.s);

socket.on('connect', function () {
    console.log("Connected to Scheduler @ ", socket.io.uri);

    socket.on('disconnect', function () {
        console.log("Disconnected !");
    });

    socket.on('tasker', function (taskId) {
        console.log("Received taskId : ", taskId);
    });

    // NOTE: Read workload file
    fs.readFile(argv.w, function (err, data) {
        var buffer = new Buffer(data),
            tasks = buffer.toString().split('\n');

        // NOTE: Submit tasks to scheduler
        tasks.forEach(function (task) {
            submitTask(task);
        });
    });
});

function submitTask(task) {
    socket.emit('tasker', task);
}

/*// NOTE: Read workload file
fs.readFile('./workload.txt', function (err, data) {
    var buffer = new Buffer(data),
        tasks = buffer.toString().split('\n');

    var promises = [];
    // NOTE: Send SQS message for each task
    tasks.forEach(function (task) {
        promises.push(SQS.sendMessage(task));
    });

    Q.all(promises).then(function (tasks) {
        console.log("Messages Sent !\n", tasks);
        SQS.printTaskList();
    }, console.error);


    // NOTE: Open socket connection to server and keep waiting

    // Divide this app into client and scheduler
});*/