"use strict";
/*
 * Config/Initialization 
 */
for (var i in process.argv) {
    var splittedProcessArgv = process.argv[i].split("=");
    if (splittedProcessArgv.length > 1) {
        if (splittedProcessArgv[0].toUpperCase() === 'ENV') {
            GLOBAL.env = process.env.ENV = splittedProcessArgv[1];
        }
    }
}
if (!GLOBAL.env) {
    GLOBAL.env = process.env.ENV = 'development';
}
GLOBAL.baseDir = __dirname;
var Bootstrap = new (require('./bootstrap'));
Bootstrap.on("ready:moduleStack", function () {
    G.Bootstrap = Bootstrap;
    Bootstrap.wlogger.info("All modules loaded.");
    Bootstrap.wlogger.info("Starting Http Server....");
    Bootstrap.startServer();
});
Bootstrap.wlogger.info("Loading Modules...");
Bootstrap._init();