var fs = require('fs'),
    Q = require('q'),
    io = require('socket.io-client'),
    _ = require('underscore'),
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
        TASK_LIST.length = 0;
    });

    socket.on('taskSubmit', function (taskId) {
        TASK_LIST.push(taskId);
        console.log("Received taskId : ", taskId);
    });

    socket.on('taskResult', function (taskResult) {
        if (taskResult.Messages && taskResult.Messages.length > 0) {
            taskResult.Messages.forEach(function (task, i) {
                if (_.contains(TASK_LIST, task.MessageAttributes.taskId.StringValue)) {
                    console.log("=======TASK-ID:" + task.MessageAttributes.taskId.StringValue + "=======");
                    console.log("Task Result : ", task.Body);
                    console.log("===========================================");
                } else {
                    console.log("CAUTION : Received task result which does not belong to me !", task);
                }
            });
        }
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
