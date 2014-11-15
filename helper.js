var AWS = require('aws-sdk');

AWS.config.loadFromPath('./config.json');

exports.AWS = AWS;