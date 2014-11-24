var Q = require('q'),
    _ = require('underscore'),
    SQS = require('./sqs'),
    EC2 = require('./ec2');

SQS.getQueueLength('CS553').then(function (length) {
    console.log("Queue Length:", length);
}, function (error) {
    console.log(error);
});

//var USER_DATA = 'bWtkaXIgZG9uZQ=='; // 'I2Nsb3VkLWNvbmZpZw0KcnVuY21kOg0KIC0gWyB3Z2V0LCAiaHR0cDovL3NsYXNoZG90Lm9yZyIsIC1PLCAvdG1wL2luZGV4Lmh0bWwgXQ0KIC0gWyBzaCwgLXhjLCAiZWNobyAkKGRhdGUpICc6IGhlbGxvIHdvcmxkISciIF0=';
// NOTE: #cloud-config
//runcmd:
// - [ wget, "http://slashdot.org", -O, /tmp/index.html ]
// - [ sh, -xc, "echo $(date) ': hello world!'" ]

var USER_DATA = 'I2Nsb3VkLWNvbmZpZw0KcGFja2FnZXM6DQogLSBnaXQNCiAtIG5vZGVqcw0KIC0gbnBtDQpydW5jbWQ6DQogLSBbIGNkLCAiJEhPTUUiIF0NCiAtIFsgZ2l0LCBjbG9uZSwgImh0dHBzOi8vZ2l0aHViLmNvbS90aGVUZWNoaWUvYXdzLW5vZGUtdGFza2VyLmdpdCIsICJhd3Mtbm9kZS10YXNrZXIiIF0NCiAtIFsgY2QsICJhd3Mtbm9kZS10YXNrZXIiIF0NCiAtIFsgbnBtLCBpbnN0YWxsIF0NCiAtIFsgbm9kZWpzLCAid29ya2VyLmpzIiwgIi1pIiwgNSBdDQpmaW5hbF9tZXNzYWdlOiAiVGhlIHN5c3RlbSBpcyBmaW5hbGx5IHVwLCBhZnRlciAkVVBUSU1FIHNlY29uZHMi';

/*#cloud-config
packages:
 - git
 - nodejs
 - npm
runcmd:
 - [ cd, "$HOME" ]
 - [ git, clone, "https://github.com/theTechie/aws-node-tasker.git", "aws-node-tasker" ]
 - [ cd, "aws-node-tasker" ]
 - [ npm, install ]
 - [ nodejs, "worker.js", "-i", 5 ]
final_message: "The system is finally up, after $UPTIME seconds"*/

EC2.createInstances(1, USER_DATA).then(function (data) {
    console.log(data);
}, function (error) {
    console.error(error);
});
