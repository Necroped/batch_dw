const
express            = require('express'),
app                = express();
session            = require('cookie-session'),
bodyParser         = require('body-parser'),
urlencodedParser   = bodyParser.urlencoded({ 
    extended       : false,
    parameterLimit : 1000000 // experiment with this parameter and tweak
}),
fs                 = require('fs'),
async              = require('async'),
path               = require('path');

let 
    _config             = require('./config'),
    _files              = [],
    _data               = [];


const getFileContent = (file, regexp) => {
    let currentLine = 0;
    
    fs.readFileSync(file).toString().split('\n').forEach((line) => { 
        currentLine++;
        if(line.match(regexp)) {
            if(_files.indexOf(file) == -1) {
                _files.push(file);
                _data.push({
                    file : file,
                    line : [{
                        number : currentLine,
                        content : line//.replace(/(\r\n|\n|\r|\t)/g,"").replace(/\\/g, "\\\\")
                    }]
                })
            } else {
                _data[_files.indexOf(file)].line.push({
                    number : currentLine,
                    content : line//.replace(/(\r\n|\n|\r|\t)/g,"").replace(/\\/g, "\\\\")
                });
            }
        }
    });
    return _data;
}

const getFiles = (dir, regexp, fileList = []) => {
    fs.readdirSync(dir).forEach(file => {
        const filePath = path.join(dir, file);
        fs.statSync(filePath).isDirectory()
        ? getFiles(filePath, regexp, fileList)
        :   
        filePath.match(regexp) 
        ? fileList.push(filePath) 
        : null
        ;
    })
    return fileList;
}

app

.set('view engine', 'pug')

.use(express.static(path.join(__dirname, 'public')))

.get('/config', (req, res) => { 
    res.render('config', {
        config: _config
    });
})

.get('/type', (req, res) => {
    let 
        result    = [],
        filesList = getFiles(_config.directory_path, _config.extensionsAllowed),
        file;
    
    _data     = [];
    _files    = [];
    
    for(file of filesList) {
        getFileContent(file, _config.regexp);
    }
    
    res.render('type', {
        data: _data,
        config : _config
    });
})

.get('/success', (req, res) => { 
    res.render('success', {
        data: _data
    });
})

.post('/config', urlencodedParser, (req, res) => {
    let 
        errors  = {},
        isError = false;
    
    if (req.body.directory_path && req.body.directory_path.length > 0) {
        _config.directory_path = req.body.directory_path;
    }

    if (req.body.regexp && req.body.regexp.length > 0) {
        try {
            let 
                flags          = req.body.regexp.replace(/.*\/([gimy]*)$/, '$1'),
                pattern        = req.body.regexp.replace(new RegExp('^/(.*?)/'+flags+'$'), '$1'),
                regex          = new RegExp(pattern, flags);
                _config.regexp = regex;
        } catch(e) {
            isError          = true;
            errors['regexp'] = "Regexp not correct";
        }
    }

    _config.enableLogs = req.body.enableLogs ? req.body.enableLogs : false;

    if (req.body.logFile && req.body.logFile.length > 0 && _config.enableLogs == true) {
        _config.logFile = req.body.logFile;
        fs.open( _config.logFile,'r',(err, fd) => {
            if (err) {
                fs.writeFile(_config.logFile, '', (err) => {
                    if(err) {
                        isError           = true;
                        errors['logFile'] = 'Error while creating the file : ' + err;
                    }
                })
            }
        })
    }

    if (req.body.extensionsAllowed) {
        try {
            let
                flags                    = req.body.extensionsAllowed.replace(/.*\/([gimy]*)$/, '$1'),
                pattern                  = req.body.extensionsAllowed.replace(new RegExp('^/(.*?)/'+flags+'$'), '$1'),
                regex                    = new RegExp(pattern, flags);
                _config.extensionsAllowed = regex;
        } catch(e) {
            isError                     = true;
            errors['extensionsAllowed'] = "Regexp not correct";
        }
    }

    if (JSON.parse(req.body.save) == true) {
        fs.writeFile("./config.js", `module.exports = {` +
            `\n   directory_path: "${_config.directory_path.replace(/\\/g, "\\\\")}",` + 
            `\n   regexp : ${_config.regexp},` + 
            `\n   logFile : "${_config.logFile.replace(/\\/g, "\\\\")}",` + 
            `\n   extensionsAllowed : ${_config.extensionsAllowed},` +
            `\n   enableLogs : ${_config.enableLogs}` + 
        `\n}`, (err) => {
            if (err) {
                isError = true;
                errors['logFile'] = 'Error while creating the file : ' + err;
            }
        })
    }

    if(isError) {
        res.status(400).json({
            config: {
                directory_path    : req.body.directory_path.replace(/\\\\/g, "\\"),
                regexp            : req.body.regexp,
                logFile           : req.body.logFile.replace(/\\\\/g, "\\"),
                extensionsAllowed : req.body.extensionsAllowed,
                enableLogs        : req.body.enableLogs
            },
            error : errors
        });
    } else {
        res.status(200).json({
            config: _config
        });
    }
})

.post('/type', urlencodedParser, (req, res) => {
    let f, l,
        _data_length = _data.length,
        line_length  = 0
        iteration    = 0;
    for(f = 0; f < _data_length; f++) {
        line_length = _data[f].line.length
        for(l = 0; l < line_length; l++) {
            iteration++;
            if(req.body.types.indexOf("" + iteration) == -1) {
                _data[f].line.splice(l, 1);
                line_length--;
                l--;
                if(line_length <= 0) {
                    _data.splice(f, 1);
                    _data_length--;
                    f--;
                }
            }
        }
    }
    if(_config.enableLogs == "true" && _config.logFile) {
        const logStream = fs.createWriteStream(_config.logFile, {'flags': 'w'});
        let file, line;
        for (file of _data) {
            logStream.write(file.file);
            for(line of file.line) {
                logStream.write('\n\t'); 
                logStream.write(line.number + ' : ' + line.content); 
            }
            logStream.write('\n');
            logStream.write('\n');
        }
    }
    for(file of _data) {
        let file_content_old = fs.readFileSync(file.file).toString().split("\n");
        for(line of file.line) {
            file_content_old.splice(line.number - 1, 1, line.content.replace(_config.regexp, ""));
        }
        let file_content_new = file_content_old.join("\n");
        
        fs.writeFile(file.file, file_content_new, (err) => {
          if (err) return console.log(err);
        });
    }
    res.redirect('success');
})

.use((req, res, next) => {
    res.redirect('/config');
})

.listen(7777, () => {
    console.log('Server started on localhost:7777');
});