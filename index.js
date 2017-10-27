var findInFiles = require('find-in-files');
var config = require('./config');
const fs = require('fs');
var async = require('async');

findInFiles.findSync ({
    term : config.regexp,
    flags : 'ig'
}, config.directory_path, config.extensionsAllowed)
.then(function(results) {
    var files = [];
    var logStream = fs.createWriteStream(config.logFile, {'flags': 'w'});
    // use {'flags': 'a'} to append and {'flags': 'w'} to erase and write a new file
    logStream.write('[\n');
    for (var result in results) {
        
        files.push(result);
        
        /*  fs.readFile(result, 'utf8', function (err,data) {
            if (err) {
                return console.log(err);
            }
            var resultData = data.replace(/:[A-Za-z ]*=/gi, '=');
            if(data !== resultData) {
                console.log('ouai  : ' + result);
            }
            
            fs.writeFile(result, resultData, 'utf8', function (err) {
                if (err) return console.log(err);
            });
        });
        */
        logStream.write('{"' + result.replace(/\//g, "\\") + '":' + JSON.stringify(results[result]).replace(/\//g, "\\") + '},');
        logStream.write('\n'); 
    }
    logStream.write(']'); 
    return files;
}).then((results) => {
    async.eachSeries(
        // Pass items to iterate over
        results,
        // Pass iterator function that is called for each item
        function(filename, cb) {
            fs.readFile(filename, function(err, content) {
                if (!err) {
                    fs.writeFile(filename, content.toString().replace(/:[A-Za-z ]*=/gi, '='), 'utf8', function (err) {
                        if (err) return console.log(err);
                    });
                }
                
                // Calling cb makes it go to the next item.
                cb(err);
            });
        },
        // Final callback after each item has been iterated over.
        function(err) {
            console.log('finished')
        }
    );
});