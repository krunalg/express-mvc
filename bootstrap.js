"use strict";
var Bootstrap = function () {
    var winston = require('winston');
    var path = require('path');
    GLOBAL._ = require('underscore')._;
    _.mixin(require('underscore.deferred'));
    var modelCache = [];
    var pluginCache = [];

    return _.extend({
        /**
         * Init application
         */
        _init: function () {
            this._initGlobals();
            this._registerEvents();
            this._configureServer(function () {
                this._initDB();
            });
        },
        /**
         * init globals, configurations and packages
         */
        _initGlobals: function () {
            GLOBAL.G = {};
            G.express = require('express');
            G.http = require('http');
            G.path = require('path');
            G.app = G.express();
            G.mongoose = require('mongoose');
            G.clogger = require(baseDir + '/lib/lib-color');
            G.cFuncs = require(baseDir + '/lib/lib-common');
            G.serverCfg = require(baseDir + '/config/server.config')();
            G.baseController = require(baseDir + "/lib/base/controllers/baseStandardController");
            G.baseView = require(baseDir + "/lib/base/views/baseStandardView");
            G.baseModel = require(baseDir + "/lib/base/models/baseModel");
            G.autoinc = require(baseDir + "/lib/core/autoinc");
            G.fs = require('fs');
            G.moment = require('moment');
            G.event = new (require("events").EventEmitter);
        },
        /**
         * register application events
         */
        _registerEvents: function () {
            var self = this;
            G.event.on("request.post.dispatch", function (httpObj) {
                self._postDispatch(httpObj.request, httpObj.response);
            });
        },
        /*
         * initialize db and connection
         */
        _initDB: function () {
            var self = this;
            //mongodb connection
            var db = G.serverCfg.mongo;
            var dsn = "mongodb://" + db.host + ":" + db.port + "/" + db.database;
            G.mongoose.connect(dsn);
            G.db = G.mongoose.connection;
            G.db.on('error', function (err) {
                G.mongoose.connection.isConnected = false;
                G.mongoose.connection.errors = err;
                console.error(err.toString());
            });
            G.db.once('open', function () {
                G.mongoose.connection.isConnected = true;
                G.autoinc.init(G.mongoose);
                /*
                 * User Initializer
                 */
                G.app.use(function (req, res, next) {
                    var appuserClass = self.getModel('appuser');
                    var user = new appuserClass(req);
                    req.currentUser = user;
                    next();
                });

                /*
                 * modules initialization
                 */
                self.initModules();
                /*
                 /*
                 * catch 404 and forward to error handler
                 */
                G.app.use(function (req, res, next) {
                    var err = new Error('Not Found');
                    err.status = 404;
                    res.status(err.status);
                    //res.statusCode = err.status;
                    res.render(G.app.get('template_path') + '/404', {
                        layout: false,
                        title: 'Page not found :(',
                        status: err.status
                    });
                    //next(err);
                });
                /*
                 * development error handler
                 * will print stacktrace
                 */
                if (G.app.get('env') === 'development') {
                    G.app.use(function (err, req, res, next) {
                        res.status(err.status || 500);
                        res.render(G.app.get('template_path') + '/error', {
                            message: err.message,
                            error: err,
                            status: err.status || 500
                        });
                    });
                }

                /*
                 * staging/production error handler
                 * no stacktraces leaked to user
                 */
                if (G.app.get('env') === 'staging' || G.app.get('env') === 'production') {
                    G.app.use(function (err, req, res, next) {
                        res.status(err.status || 500);
                        res.render(G.app.get('template_path') + '/error', {
                            message: err.message,
                            error: {},
                            status: err.status || 500
                        });
                    });
                }
            });

        },
        /**
         * configure server
         * @param {type} cb
         * @returns {undefined}
         */
        _configureServer: function (cb) {
            var _partials = require(baseDir + '/lib/base/views/viewPartials'),
                    _logger = require('morgan'),
                    cookieParser = require('cookie-parser'),
                    bodyParser = require('body-parser'),
                    flash = require(baseDir + '/lib/core/flash'),
                    multer = require('multer');
            var self = this;

            // Setting session with express
            var session = require('express-session');
            var RedisStore = require('connect-redis')(session);
            G.app.use(session({
                secret: G.serverCfg.app.server_keys.cookie,
                saveUninitialized: true,
                resave: true,
                name: 'CODEBYTE',
                store: new RedisStore({
                    'db': G.serverCfg.redis.db,
                    'host': G.serverCfg.redis.host,
                    'port': G.serverCfg.redis.port,
                    'pass': G.serverCfg.redis.password
                })
            }));

            /**
             * set view path
             */
            G.app.set('view', require(baseDir + '/lib/base/views/multipleViews'));

            /*
             * load module configurations
             */
            G.modulesConfig = this.loadModules(G.globalCfg.modules);

            /*
             * view base url for modules
             */
            G.app.set('views_base', G.globalCfg.views.viewBase);

            /*
             * templates base url
             */
            G.app.set('template_path', G.globalCfg.views.templatePath);
            /**
             * supports multipart
             */
            G.app.use(multer({dest: '/tmp'}));

            /*
             * set template engine
             */
            G.app.set('view engine', 'ejs');
            /*
             * set default layout
             */
            G.app.set('view options', {
                defaultLayout: G.path.join(baseDir, 'lib/base/templates/default-layout.ejs')
            });

            /*
             * set port for app
             */
            G.app.set('env', G.serverCfg.env);

            /*
             * set port for app
             */
            G.app.set('port', G.serverCfg.port || 3000);

            /*
             * global parameters/config
             */
            G.app.locals = {
                app_name: G.globalCfg.app_name,
                app_domain: G.serverCfg.app_domain,
                details: G.globalCfg.app_details,
                page_limit: G.globalCfg.datatables.pageLimit,
                moment: G.moment
            };

            /*
             * set partials middleware
             */
            G.app.use(_partials());
            G.app.use(flash());
            /*
             * logger configuration
             */
            if (G.app.set('env') === "development") {
                G.app.use(_logger('dev'));
            } else {
                var httpLog = _logger({
                    "format": ':remote-addr [:date] - [referrer :referrer] - :method :url :status :response-time ms',
                    "stream": {
                        write: function (str) {
                            console.log(str);
                        }
                    }
                });
                G.app.use(httpLog);
                //G.app.use(_logger({"format": ':remote-addr [:date] - [referrer :referrer] - :method :url :status :response-time ms'}));
            }
            /*
             * configure parsers
             */
            G.app.use(bodyParser.json({
                extended: true
            }));
            G.app.use(bodyParser.urlencoded({
                extended: true
            }));
            G.app.use(cookieParser(G.serverCfg.app.server_keys.cookie));

            /*
             * check database connection
             */
            G.app.use(function (req, res, next) {
                if (!G.mongoose.connection.isConnected) {
                    var err = G.mongoose.connection.errors;
                    res.status(500);
                    next(new Error(err.toString()));
                } else {
                    next();
                }
            });

            /*
             * request dispatcher
             */
            G.app.use(function (req, res, next) {
                res.setHeader('X-Powered-By', 'CodeByte v0.3');
                self._preDispatch(req, res, next);
                res.once("finish", function () {
                    G.event.emit('request.post.dispatch', {
                        request: req,
                        response: res
                    });
                });
                next();
            });

            /*
             * serve static files from public directory
             */
            G.app.use(G.express.static(G.path.join(baseDir, 'public')));

            /*
             * centralized error handling and logging it to the file located in logs directory
             */
            process.on('uncaughtException', function (err) {
                if (err && err.stack) {
                    //console.error('Caught exception: ' + err.stack);
                    self.wlogger.error("\n" + err.stack + "\n");
                } else {
                    //console.error(err);
                    self.wlogger.error("\n" + err + "\n");
                }
            });

            /*
             * close connection on process termination
             */
            process.on('SIGINT', function () {
                G.mongoose.connection.close(function () {
                    console.log('Mongoose default connection disconnected through app termination.');
                    process.exit(0);
                });
            });
            /*
             * close connection on process exit
             */
            process.on('exit', function () {
                G.mongoose.connection.close(function () {
                    console.log('Mongoose default connection disconnected through app process exit.');
                    process.exit(0);
                });
            });
            cb.apply(this);
        },
        /**
         * request pre dispatch method
         */
        _preDispatch: function (req, res, next) {
            //next();
        },
        /**
         * request post dispatch method
         */
        _postDispatch: function (req, res) {
        },
        wlogger: new (winston.Logger)({
            transports: [
                new (winston.transports.Console)({
                    json: false,
                    timestamp: true,
                    colorize: true
                }),
                new winston.transports.File({
                    filename: path.join(baseDir, 'logs/debug.log'),
                    json: false
                })
            ],
            exceptionHandlers: [
                new (winston.transports.Console)({
                    json: false,
                    timestamp: true
                }),
                new winston.transports.File({
                    filename: path.join(baseDir, 'logs/error.log'),
                    json: false
                })
            ],
            colors: {
                info: 'cyan'
            },
            exitOnError: false
        }),
        /**
         * Load all modules into memory
         * @param {type} modules
         * @returns {Bootstrap.Anonym$0.loadModules.config}
         */
        loadModules: function (modules) {
            var moduleBaseDir = G.path.join(baseDir, 'modules');
            var config = {};
            config.config = {};
            config.routers = {};
            config.controllers = {};
            config.models = {};
            config.plugins = {};
            _.each(modules, function (val) {
                try {
                    config.config[val] = require(G.path.join(moduleBaseDir, val, "module.config"));
                    config.routers[val] = config.config[val].routers;
                    config.controllers[val] = config.config[val].controllers;
                    config.models = _.extend(config.models, config.config[val].models);
                    config.plugins = _.extend(config.plugins, config.config[val].plugins);
                } catch (e) {
                    return new Error(e.toString());
                }
            });
            return config;
        },
        moduleStack: {},
        /**
         * initialize all modules
         * @returns {undefined}
         */
        initModules: function () {
            var moduleRoutes = G.modulesConfig.routers;
            var moduleControllers = G.modulesConfig.controllers;
            var moduleBaseDir = G.path.join(baseDir, 'modules');
            var moduleStack = {};

            /*
             * register all controllers
             */
            _.each(moduleControllers, function (mKey, mVal) {
                _.each(mKey, function (cKey, cVal) {
                    moduleStack[mVal] = moduleStack[mVal] || {};
                    moduleStack[mVal][cVal] = require(G.path.join(moduleBaseDir, cKey));
                });
                if (Object.keys(moduleStack).length === Object.keys(moduleControllers).length) {
                    this.moduleStack = _.extend({}, moduleStack);
                    this.emit('ready:moduleStack')
                }
            }, this);

            /*
             * register all routes
             */
            var self = this;
            //console.log(moduleRoutes);
            _.each(moduleRoutes, function (rmKey, rmVal) {
                _.each(rmKey, function (rKey, rVal) {
                    G.app.all(rKey.route.toString(), function (req, res, next) {
                        var roleType = req.currentUser.get('type');
                        if (_.contains(G.globalCfg.acl[roleType]['allowed']['routes'], rVal)) {
                            var initObj = {};
                            initObj.controller = rKey.controller;
                            initObj.action = rKey.action;
                            initObj.module = rmVal;
                            initObj.request = req;
                            initObj.response = res;
                            initObj.dispatched = true;
                            try {
                                var controller = new moduleStack[rmVal][rKey.controller](initObj);
                            } catch (e) {
                                self.wlogger.error(e.toString());
                            }
                            var returnData = controller[rKey.action]();
                            var view = new G.baseView(controller);
                            if (self.isDeferred(returnData)) {
                                returnData.done(function (defReturnData) {
                                    view.render(defReturnData, controller);
                                }).fail(function (err) {
                                    res.status(err.status || 500);
                                    res.render(G.app.get('template_path') + '/error', {
                                        message: err.message,
                                        error: err,
                                        status: err.status || 500
                                    });
                                });
                            } else {
                                view.render(returnData, controller);
                            }
                        } else {
                            // User is not authorized to access that page/request
                            res.status(403);
                            res.render(G.app.get('template_path') + '/403', {
                                layout: false,
                                title: 'Unauthorized',
                                status: 403
                            });
                        }
                    });
                }, this);
            }, this);
        },
        isDeferred: function (obj) {
            if (typeof obj['done'] === 'function' && typeof obj['resolve'] === 'function') {
                return true;
            }
            return false;
        },
        getController: function (module, controller) {
            return this.moduleStack[module][controller];
        },
        getModel: function (modelName) {
            var modelPath = G.path.join(baseDir, 'modules', G.modulesConfig.models[modelName]);
            var existingModel = _.findWhere(modelCache, {name: modelName});
            if (existingModel) {
                return existingModel['data'];
            }
            var data = require(modelPath);
            modelCache.push({name: modelName, data: data});
            return data;
        },
        getPlugin: function (pluginName) {
            var pluginPath = G.path.join(baseDir, 'modules', G.modulesConfig.plugins[pluginName]);
            var existingPlugin = _.findWhere(pluginCache, {name: pluginName});
            if (existingPlugin) {
                return existingPlugin['data'];
            }
            var data = require(pluginPath);
            pluginCache.push({name: pluginName, data: data});
            return data;
        },
        /**
         * start server
         */
        startServer: function () {
            var server = G.http.createServer(G.app);
            var self = this;
            server.on('error', function (e) {
                if (e['code'] === 'EADDRINUSE') {
                    self.wlogger.error("Address in use, Port " + G.app.get('port') + " is already occupied.");
                } else {
                    self.wlogger.error(e.toString());
                }
            });
            server.listen(G.app.get('port'), function () {
                if (env === G.serverCfg.env) {
                    G.Bootstrap.wlogger.info('Express server listening on port ' + server.address().port + " on " + G.serverCfg.env + " ENV");
                } else {
                    G.Bootstrap.wlogger.warn('Express server listening on port ' + server.address().port + " and ENV is considered as " + G.serverCfg.env);
                }
            });
        }
    }, require("events").EventEmitter.prototype);
};
module.exports = Bootstrap;