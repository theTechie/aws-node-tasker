var helper = require('./helper'),
    Q = require('q');

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

// NOTE : delete message on SQS queue (client) after reading the message
function deleteMessage(queueUrl, receiptHandle, callback) {
    var deferred = Q.defer();

    var params = {
        QueueUrl: queueUrl,
        /* required */
        ReceiptHandle: receiptHandle /* required */
    };

    SQS.deleteMessage(params, function (err, data) {
        if (err) deferred.reject("ERROR: deleteMessage() : " + err + err.stack);
        else deferred.resolve(data);
    });

    return deferred.promise.nodeify(callback);
};


// NOTE: Create SQS Queue
exports.createQueue = function (queueName, callback) {
    var deferred = Q.defer();

    var params = {
        QueueName: queueName
        /* required */
    };

    SQS.createQueue(params, function (err, data) {
        if (err) deferred.reject("ERROR: createQueue() : " + err + err.stack);
        else deferred.resolve(data);
    });

    return deferred.promise.nodeify(callback);
};

// NOTE : Send message to SQS Queue; Returns 'MessageId'
exports.sendMessage = function (queueName, messageAttributes, message, callback) {
    var deferred = Q.defer(),
        queueName = queueName || QUEUE_NAME; //NOTE: use master queue for messaged from scheduler

    var params = {
        MessageBody: message,
        /* required */
        QueueUrl: '',
        /* required */
        DelaySeconds: 0,
        MessageAttributes: messageAttributes
    };

    getQueueUrl(queueName).then(function (queueUrl) {
        params.QueueUrl = queueUrl;

        SQS.sendMessage(params, function (err, data) {
            if (err) deferred.reject("ERROR: sendMessage() : " + err + err.stack);
            else {
                TASK_LIST.push(data.MessageId); // NOTE: MessageId being used as TaskId
                deferred.resolve(data.MessageId);
            }
        });
    }, function (error) {
        deferred.reject(error);
    });

    return deferred.promise.nodeify(callback);
};

// NOTE : Receive message from SQS queue (client)
exports.receiveMessage = function (queueName, messageAttributes, callback) {
    var deferred = Q.defer(),
        queueName = queueName || QUEUE_NAME;

    //console.log("Fetching messages from Queue : ", queueName);

    var params = {
        QueueUrl: '',
        /* required */
        AttributeNames: [
    'Policy | VisibilityTimeout | MaximumMessageSize | MessageRetentionPeriod | ApproximateNumberOfMessages | ApproximateNumberOfMessagesNotVisible | CreatedTimestamp | LastModifiedTimestamp | QueueArn | ApproximateNumberOfMessagesDelayed | DelaySeconds | ReceiveMessageWaitTimeSeconds | RedrivePolicy'
  ],
        MaxNumberOfMessages: 10,
        MessageAttributeNames: messageAttributes,
        VisibilityTimeout: 1,
        WaitTimeSeconds: 1
    };

    getQueueUrl(queueName).then(function (queueUrl) {
        params.QueueUrl = queueUrl;

        SQS.receiveMessage(params, function (err, data) {
            if (err) deferred.reject("ERROR: receiveMessage() : " + err + err.stack);
            else {
                if (data.Messages && data.Messages.length > 0) {
                    data.Messages.forEach(function (msg, i) {
                        deleteMessage(params.QueueUrl, msg.ReceiptHandle).then(function (data) {
                            console.log("Successfully deleted message : ", data);
                        });
                    });
                }
                deferred.resolve(data);
            }
        });
    }, function (error) {
        deferred.reject(error);
    });

    return deferred.promise.nodeify(callback);
};

// NOTE: Delete SQS Queue
exports.deleteQueue = function (queueName, callback) {
    var deferred = Q.defer();

    var params = {
        QueueUrl: ''
        /* required */
    };

    getQueueUrl(queueName).then(function (queueUrl) {
        params.QueueUrl = queueUrl;

        SQS.deleteQueue(params, function (err, data) {
            if (err) deferred.reject("ERROR: deleteQueue() : " + err + err.stack);
            else deferred.resolve(data);
        });
    }, function (error) {
        deferred.reject(error);
    });

    return deferred.promise.nodeify(callback);
};

// NOTE: Get queueLength of a given queueName
exports.getQueueLength = function (queueName, callback) {
    var deferred = Q.defer();

    var params = {
        QueueUrl: '',
        /* required */
        AttributeNames: ['ApproximateNumberOfMessages']
    };

    getQueueUrl(queueName).then(function (queueUrl) {
        params.QueueUrl = queueUrl;

        SQS.getQueueAttributes(params, function (err, data) {
            if (err) deferred.reject("ERROR : getQueueLength() : " + err + err.stack);
            else deferred.resolve(data.Attributes.ApproximateNumberOfMessages);
        });
    }, function (error) {
        deferred.reject(error);
    });

    return deferred.promise.nodeify(callback);
};

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
