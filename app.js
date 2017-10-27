const
express          = require('express'),
session          = require('cookie-session'),
bodyParser       = require('body-parser'),
urlencodedParser = bodyParser.urlencoded({ 
                        extended: false,
                        parameterLimit: 1000000 // experiment with this parameter and tweak
                    });
app              = express();

const fs        = require('fs');
var async       = require('async');
const path = require('path');

let 
config      = require('./config');

let lines = [];

const filesContent = (file, regexp) => {
    let result = [];
    let currentLine = 0;
    fs.readFileSync(file).toString().split('\n').forEach((line) => { 
        currentLine++;
        if(line.match(regexp)) {
            lines.push({
                file : file,
                line_number : currentLine,
                line_content : line.replace(/(\r\n|\n|\r|\t)/g,"").replace(/\\/g, "\\\\")
            })
            result.push({
                line_number : currentLine,
                line_content : line.replace(/(\r\n|\n|\r|\t)/g,"").replace(/\\/g, "\\\\")
            })
        }
    });
    return result;
}

const walkSync = (dir, regexp, fileList = []) => {
    fs.readdirSync(dir).forEach(file => {
        const filePath = path.join(dir, file)
        fs.statSync(filePath).isDirectory()
        ? walkSync(filePath, regexp, fileList)
        :   
            filePath.match(regexp) 
            ? fileList.push(filePath) 
            : null
        ;
    })
    return fileList;
}

app.set('view engine', 'pug');
/* On utilise les sessions */
app.use(session({secret: 'secret'}))

.get('/validation', (req, res) => {
    let 
        result = [],
        fileList = walkSync(config.directory_path, config.extensionsAllowed),
        file,
        data;

    for(file of fileList) {
        data = filesContent(file, config.regexp);
        if(data.length > 0) {
            result.push({
                file : file,
                data : data
            });
        }
    }

    res.render('validation', {
        result: result
    });
})

.get('/config', (req, res) => { 
    res.render('config', {
        config: config
    });
})

.post('/config', urlencodedParser, (req, res) => {
    let errors = {};
    let isError = false;
    if (req.body.directory_path && req.body.directory_path.length > 0) {
        config.directory_path = req.body.directory_path;
    }
    if (req.body.regexp && req.body.regexp.length > 0) {
        try {
            let 
                flags                = req.body.regexp.replace(/.*\/([gimy]*)$/, '$1'),
                pattern              = req.body.regexp.replace(new RegExp('^/(.*?)/'+flags+'$'), '$1'),
                regex                = new RegExp(pattern, flags);
                config.regexp = regex;
        } catch(e) {
            isError = true;
            errors['regexp'] = "Regexp not correct";
        }
    }
    config.enableLogs = (req.body.enableLogs ? true : false);
    if (req.body.logFile && req.body.logFile.length > 0 && config.enableLogs == true) {
        config.logFile = req.body.logFile;
    }
    if (req.body.extensionsAllowed) {
        try {
            let
                flags                = req.body.extensionsAllowed.replace(/.*\/([gimy]*)$/, '$1'),
                pattern              = req.body.extensionsAllowed.replace(new RegExp('^/(.*?)/'+flags+'$'), '$1'),
                regex                = new RegExp(pattern, flags);
                config.extensionsAllowed = regex;
        } catch(e) {
            isError = true;
            errors['extensionsAllowed'] = "Regexp not correct";
        }
    }
    if(isError) {
        res.render('config', {
            config: {
                directory_path    : req.body.directory_path,
                regexp            : req.body.regexp,
                logFile           : req.body.logFile,
                extensionsAllowed : req.body.extensionsAllowed,
                enableLogs        : req.body.enableLogs ? true : false
            }, 
            error : errors
        });
    } else {
        res.redirect('validation');
    }
})

.post('/validation', urlencodedParser, (req, res) => {
    lines = lines.filter((line, index) => {
        return req.body.validations.indexOf("" + index) > -1
    });
    console.log(lines);
    res.redirect('validation');
})

.use((req, res, next) => {
    res.redirect('/config');
})

.listen(7777, () => {
    console.log('Server started on localhost:7777');
});