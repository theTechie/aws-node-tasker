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

var USER_DATA = 'I2Nsb3VkLWNvbmZpZw0KYXB0X3VwZ3JhZGU6IHRydWUNCnJ1bmNtZDoNCiAtIFsgc3VkbywgYXB0LWdldCwgdXBkYXRlIF0NCiAtIFsgc3VkbywgYXB0LWdldCwgaW5zdGFsbCwgZ2l0IF0NCiAtIFsgc3VkbywgYXB0LWdldCwgaW5zdGFsbCwgbm9kZWpzIF0NCiAtIFsgc3VkbywgYXB0LWdldCwgaW5zdGFsbCwgbnBtIF0NCiAtIFsgZ2l0LCBjbG9uZSwgImh0dHBzOi8vZ2l0aHViLmNvbS90aGVUZWNoaWUvYXdzLW5vZGUtdGFza2VyLmdpdCwgYXdzLW5vZGUtdGFza2VyIiBdDQogLSBbIGNkLCAiYXdzLW5vZGUtdGFza2VyIiBdDQogLSBbIG5wbSwgaW5zdGFsbCBdDQogLSBbIG5vZGUsICJ3b3JrZXIuanMiLCAiLWkiLCA1IF0=';

/*#cloud-config
apt_upgrade: true
runcmd:
 - [ sudo, apt-get, update ]
 - [ sudo, apt-get, install, git ]
 - [ sudo, apt-get, install, nodejs ]
 - [ sudo, apt-get, install, npm ]
 - [ git, clone, "https://github.com/theTechie/aws-node-tasker.git, aws-node-tasker" ]
 - [ cd, "aws-node-tasker" ]
 - [ npm, install ]
 - [ node, "worker.js", "-i", 5 ]*/

EC2.createInstances(1, USER_DATA).then(function (data) {
    console.log(data.Instances);
}, function (error) {
    console.error(error);
});
