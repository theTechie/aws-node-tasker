var Q = require('q'),
    _ = require('underscore'),
    shell = require('shelljs'),
    SQS = require('./sqs'),
    DynamoDB = require('./dynamoDB');

var argv = require('optimist')
    .usage('Usage: $0 -i [TIME_SEC]')
    .demand(['i'])
    .alias('i', 'timesec')
    .describe('i', 'Idle Time in seconds')
    .default('i', '0')
    .argv;

var idleTime = argv.i;

var idleTimer,
    noTimer = false,
    QUEUE_NAME = 'CS553';

if (idleTime == 0) {
    noTimer = true;
    console.log("[WORKER] : worker running with default value of 0 for Idle Time");
} else {
    idleTimer = startIdleTimer(idleTime);
}


// NOTE: Check for tasks on Master Q every 1 second
setInterval(function () {
    SQS.getQueueLength(QUEUE_NAME).then(function (length) {
        console.log("Queue Length:", length);
        // NOTE: if there are tasks in Q, fetch task, process and then return the response
        if (length > 0) {
            SQS.receiveMessage(QUEUE_NAME, ['clientId']).then(function (data) {
                if (data.Messages && data.Messages.length > 0) {
                    data.Messages.forEach(function (task, i) {
                        var resultQ = task.MessageAttributes.clientId.StringValue,
                            taskId = task.MessageId; // messageId in Master Q is the taskId which will be verified at client

                        if (!noTimer)
                            clearTimeout(idleTimer);

                        DynamoDB.addItem(undefined, taskId).then(function (data) {
                            // added task; continue to process it

                            // NOTE: Synchronously process the task
                            //var result = processTask(task.Body);

                            console.log("Task '" + task.Body + "' completed. Result : " + result);

                            var messageAttributes = {
                                taskId: {
                                    DataType: 'String',
                                    StringValue: taskId
                                }
                            };

                            console.log("Sending message to resultQ : " + resultQ + ", taskId : " + taskId);

                            SQS.sendMessage(resultQ, messageAttributes, result).then(function (taskId) {
                                console.log("Task Result Sent Back : ", taskId);

                                if (!noTimer)
                                    idleTimer = startIdleTimer(idleTime);
                            });
                        }, function (error) {
                            // task already being processed by another worker, so ignore
                            console.log("Task '" + task.Body + "' already being processed by other worker; so ignoring. ");

                            if (!noTimer)
                                idleTimer = startIdleTimer(idleTime);
                        });
                    });
                }
            });
        }
    }, function (error) {
        console.log(error);
    });
}, 1000);

// NOTE: Synchronous process of task
function processTask(task) {
    console.log("Performing Task : ", Date.now());

    var taskResult = shell.exec(task, {
        silent: true
    }).output;

    return task + taskResult + ' Completed !';
}

function startIdleTimer(timeInSeconds) {
    return setTimeout(function () {
        console.log('Idle Timeout Expired, Terminating myself !!');
        shell.exec('sudo shutdown -h now', function (code, output) {
            console.log('Exit Code: ', code);
            console.log('Program output: ', output);
        });
    }, timeInSeconds * 1000);
}

// Shutdown instance if worker crashes
process.on("SIGINT", function () {
    console.log('Exiting Worker !');
    console.log('Shutting myself down !');

    shell.exec('sudo shutdown -h now', function (code, output) {
        console.log('Exit Code: ', code);
        console.log('Program output: ', output);
    });

    process.exit();
});
