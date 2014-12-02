var Q = require('q'),
    fs = require('fs'),
    _ = require('underscore'),
    shell = require('shelljs'),
    SQS = require('./sqs'),
    S3 = require('./s3'),
    DynamoDB = require('./dynamoDB');

var argv = require('optimist')
    .usage('Usage: $0 -i [TIME_SEC]')
    //.demand(['i'])
    .alias('i', 'timesec')
    .describe('i', 'Idle Time in seconds')
    .default('i', '0')
    .argv;

var idleTime = argv.i;

var idleTimer,
    noTimer = false,
    QUEUE_NAME = 'ANIMOTO';

if (idleTime == 0) {
    noTimer = true;
    console.log("[WORKER] : worker running with default value of 0 for Idle Time");
} else {
    idleTimer = startIdleTimer(idleTime);
}


var canProceed = true;

// NOTE: Check for tasks on Master Q every 1 second
setInterval(function () {
    if (canProceed) {
        SQS.getQueueLength(QUEUE_NAME).then(function (length) {
            console.log("Queue Length:", length);
            // NOTE: if there are tasks in Q, fetch task, process and then return the response
            if (length > 0) {
                canProceed = false;

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
                                var result = processTask(task.Body);

                                console.log("Task completed. Result : " + result);

                                var messageAttributes = {
                                    taskId: {
                                        DataType: 'String',
                                        StringValue: taskId
                                    }
                                };

                                console.log("Sending message to resultQ : " + resultQ + ", taskId : " + taskId);

                                SQS.sendMessage(resultQ, messageAttributes, result).then(function (taskId) {
                                    console.log("Task Result Sent Back : ", taskId);
                                    canProceed = true;

                                    if (!noTimer)
                                        idleTimer = startIdleTimer(idleTime);
                                }, function (err) {
                                    console.error("Failed to send message to ResultQ. ", err);
                                    canProceed = true;
                                });
                            }, function (error) {
                                // task already being processed by another worker, so ignore
                                console.log("Task already being processed by other worker; so ignoring. ");

                                if (!noTimer)
                                    idleTimer = startIdleTimer(idleTime);

                                canProceed = true;
                            });
                        });
                    } else {
                        canProceed = true;
                    }
                }, function (err) {
                    console.error("Problem retrieving message from MASTER_QUEUE.", err);
                    canProceed = true;
                });
            }
        }, function (error) {
            console.error("Error retrieving MASTER_QUEUE length.", error);
            canProceed = true;
        });
    }
}, 1000);

// NOTE: Synchronous process of task
// 1. Run wget and download images to /images folder
// 2. Run ffmpeg and create a video
// 3. Store video in S3
// 4. Return S3 URL in the task response to client
function processTask(task) {
    console.log("Performing Task : ", Date.now());

    var buffer = new Buffer(task),
        imageUrls = buffer.toString().split('\n');

    shell.exec('mkdir images', {
        silent: true
    });

    imageUrls.forEach(function (url, i) {
        var taskResult = shell.exec('wget -O images/' + i + '.jpg ' + url, {
            silent: true
        }).output;
    });

    var fileName = Date.now() + '_video.mpg';

    var taskResult_ffmpeg = shell.exec('ffmpeg -f image2 -start_number 0 -i images/%d.jpg ' + 'images/' + fileName, {
        silent: true
    }).output;

    // create video using images
    // ffmpeg -f image2 -start_number 0 -i %d.jpg a.mpg
    var video_url = 'https://s3-us-west-2.amazonaws.com/cs553-data/' + fileName;

    var data = fs.readFileSync('images/' + fileName);

    S3.putObject(fileName, data).then(function (res) {
        console.log("Uploaded video.");
    }, function (err) {
        console.log("Error in uploading file to S3.");
    });


    return 'Video generated : ' + video_url + ' !';
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

    if (!noTimer) {
        console.log('Shutting myself down !');

        shell.exec('sudo shutdown -h now', function (code, output) {
            console.log('Exit Code: ', code);
            console.log('Program output: ', output);
        });
    }
    process.exit();
});
