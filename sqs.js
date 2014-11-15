var helper = require('./helper'),
    Q = require('q'),
    uuid = require('node-uuid');

var SQS = new helper.AWS.SQS(),
    QUEUE_NAME = 'CS553',
    TASK_LIST = [];

// NOTE : Get SQS Queue URL
function getQueueUrl(queueName, callback) {
    var deferred = Q.defer();
    var params = {
        QueueName: queueName
    };

    SQS.getQueueUrl(params, function (err, data) {
        if (err)
            deferred.reject("ERROR : getQueueUrl() : " + err + err.stack);
        else
            deferred.resolve(data.QueueUrl);
    });
    return deferred.promise.nodeify(callback);
};

// NOTE : Send message to SQS Queue; Returns 'MessageId'
exports.sendMessage = function (message, callback) {
    var deferred = Q.defer(),
        clientId = uuid.v1();

    var params = {
        MessageBody: message,
        /* required */
        QueueUrl: 'STRING_VALUE',
        /* required */
        DelaySeconds: 0,
        MessageAttributes: {
            clientId: {
                DataType: 'String',
                StringValue: clientId
            }
        }
    };

    return getQueueUrl(QUEUE_NAME).then(function (queueUrl) {
        params.QueueUrl = queueUrl;

        SQS.sendMessage(params, function (err, data) {
            if (err) deferred.reject("ERROR: sendMessage() : " + err + err.stack);
            else {
                TASK_LIST.push(data.MessageId); // NOTE: MessageId being used as TaskId
                deferred.resolve(data.MessageId);
            }
        });

        return deferred.promise.nodeify(callback);
    });
}

// NOTE: Print Task List
exports.printTaskList = function () {
    console.log("=======================================================");
    console.log("TASK LIST (" + TASK_LIST.length + " tasks) :");
    console.log("=======================================================");
    TASK_LIST.forEach(function (taskId, i) {
        console.log("Task " + (i + 1) + " : ", taskId);
    });
    console.log("=======================================================");
};