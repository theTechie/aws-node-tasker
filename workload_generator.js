var fs = require('fs'),
     _ = require('underscore');

var argv = require('optimist')
    .usage('Usage: $0 -t [TASK_BODY] -n [NUMBER_OF_TASKS]')
    .demand(['t', 'n'])
    .alias('t', 'taskBody')
    .describe('t', 'Task Body')
    .alias('n', 'numberOfTasks')
    .describe('n', 'Number of Tasks')
    .argv;

if (parseInt(argv.numberOfTasks) != argv.numberOfTasks) {
    console.log("Please provide valid value for number of tasks.");
    console.log("Usage: $0 -t [TASK_BODY] -n [NUMBER_OF_TASKS]");
    process.exit();
}

var range_values = _.range(argv.numberOfTasks),
    buffer = '';

range_values.forEach(function (data, i) {
    buffer += argv.taskBody;
    if (i != range_values.length - 1)
        buffer += '\n';
});

fs.writeFileSync('workload_test.txt', buffer);

console.log("Wordload file generated with " + argv.numberOfTasks + "tasks having '" + argv.taskBody + "' in each line");


