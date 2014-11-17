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

var socket = io(argv.s),
    TASK_LIST = [];

socket.on('connect', function () {
    console.log("Connected to Scheduler @ ", socket.io.uri);

    socket.on('disconnect', function () {
        console.log("Disconnected !");
    });

    socket.on('taskSubmit', function (taskId) {
        TASK_LIST.push(taskId);
        console.log("Received taskId : ", taskId);
    });

    socket.on('taskResult', function (taskResult) {
        console.log("Received task result => ");
        console.log("=====================================================");
        taskResult.Messages.forEach(function (task, i) {
            console.log("=====================================================");
            console.log("Message Id: ", task.MessageId);
            console.log("=====================================================");
            console.log("Body : ", task.Body);
            console.log("Attributes : ", task.MessageAttributes);
            console.log("=====================================================");
        });
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
    socket.emit('taskSubmit', task);
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
