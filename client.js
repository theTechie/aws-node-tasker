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

var schedulerAddress, startTime, endTime;

if (validateAddress(argv.scheduler)) {
    schedulerAddress = "http://" + argv.scheduler;
} else {
    console.log("Please enter a valid IP address and port ! : [IP_ADDRESS]:[PORT] => ", argv.scheduler);
    process.exit();
}

var socket = io(schedulerAddress),
    TASK_LIST = [];

if (!fs.existsSync(argv.workload)) {
    console.log("File does not exist ! : " + argv.workload);
    process.exit();
}

socket.on('connect', function () {
    console.log("Connected to Scheduler @ ", socket.io.uri);

    socket.on('disconnect', function () {
        console.log("Scheduler went down ! Sorry, I am going down too !");
        TASK_LIST.length = 0;
        process.exit();
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
                    console.log("==========================================================");

                    TASK_LIST = _.without(TASK_LIST, task.MessageAttributes.taskId.StringValue);

                    if (TASK_LIST.length == 0) {
                        endTime = Date.now();
                        console.log("Successfully processed all tasks in " + (endTime - startTime) / 1000 + " seconds !");
                        process.exit();
                    }
                } else {
                    console.log("CAUTION : Received task result which does not belong to me !", task);
                }
            });
        }
    });

    socket.on('READY', function () {
        // NOTE: Read workload file
        fs.readFile(argv.workload, function (err, data) {
            var buffer = new Buffer(data),
                tasks = buffer.toString().split('\n');

            startTime = Date.now();

            // NOTE: Submit tasks to scheduler
            tasks.forEach(function (task) {
                submitTask(task);
            });
        });
    });
});

function submitTask(task) {
    socket.emit('taskSubmit', task);
}

// NOTE: check if address is valid (ip:port)
function validateAddress(entry) {
  var ip_port = entry.split(":");
  var blocks = ip_port[0].split(".");

  if (ip_port.length < 2)
    return false;

  if(blocks.length === 4) {
    return blocks.every(function(block) {
      return parseInt(block,10) >=0 && parseInt(block,10) <= 255;
    });
  }
  return false;
}

process.on("SIGINT", function () {
    console.log('Exiting Client !');
    process.exit();
});

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
