var baseController = function(init) {
    this.response = false;
    this.request = false;
    this.module = false;
    this.controller = false;
    this.action = false;
    this.responseType = "html";
    this.responseCode = 200;
    if (init.dispatched) {
        this.response = init.response;
        this.request = init.request;
        this.module = init.module;
        this.controller = init.controller;
        this.action = init.action;
    }
    this.responseType = "html";
    /**
     * Call the constuctor function
     */
    this.initialize.apply(this);
};
/**
 * method for extend
 * @param {type} properties
 * @returns {Object}
 */
baseController.extend = function(properties) {
    var parent = this;
    var child = function() {
        return parent.apply(this, arguments);
    };
    var Surrogate = function() {};
    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate;
    _.extend(child.prototype, properties);
    return child;
};
baseController.prototype = {
    initialize: function() {},
    /**
     * set response type json or html
     * @param {type} type
     * @returns {module.exports.prototype}
     */
    setResponseType: function(type) {
        this.responseType = type;
        return this;
    },
    /**
     * set ResponseCode
     * @param {type} type
     * @returns {module.exports.prototype}
     */
    setResponseCode: function(code) {
        this.responseCode = code;
        return this;
    },
    /**
     * get response type
     * @returns {type}
     */
    getResponseType: function() {
        return this.responseType;
    },
    /**
     * get response code
     * @returns {code}
     */
    getResponseCode: function() {
        return this.responseCode;
    },
    /**
     * get all parameters
     * @returns {object}
     */
    getParams: function() {
        var routeParams = this.request.params;
        var postParams = this.request.body;
        var queryParams = this.request.query;
        var files = this.request.files;
        var params = _.extend(routeParams, postParams, queryParams,files);
        return params;
    },
    /**
     * get a single parameter
     * @param {type} name
     * @returns {module.exports.prototype@pro;request@call;param}
     */
    getParam: function(name) {
        return this.request.param(name);
    },
    /**
     * url redirector / redirect helper
     * @param {type} route
     */
    redirect: function(route) {
        this.response.redirect(route);
    },
    getModel: function(modelName) {
        return G.Bootstrap.getModel(modelName);
    },
    isPost: function() {
        return this.request.method === 'POST';
    },
    isGet: function() {
        return this.request.method === 'GET';
    },
    noCache: function() {
        this.response.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        this.response.header('Expires', '-1');
        this.response.header('Pragma', 'no-cache');
    },
    sendGrid: function(settings) {
        var def = settings['defer'] || _.Deferred(),
            defaultWhere = settings['defaultWhere'] || {},
            filterWhere = settings['filterWhere'] || {},
            modelClass = settings['modelClass'] || false,
            dataFilter = typeof settings['filter'] === 'function' ? settings['filter'] : function(c) {
                return c;
            };
        var self = this;
        if (!modelClass) {
            throw "Model class is not set for data-grid";
        }
        var params = this.getParams(),
            options = _.extend({
                draw: 1,
                columns: [],
                length: G.globalCfg['datatables']['pageLimit'],
                start: 0,
                order: [{
                    column: '0',
                    dir: 'asc'
                }]
            }, params),
            draw = options['draw'],
            limit = parseInt(options['length'], 10),
            offset = parseInt(options['start'], 10);

        var sortingCriteria = {};
        _.each(options['order'], function(order) {
            sortingCriteria[options['columns'][order['column']]['data']] = order['dir'] === 'desc' ? -1 : 1;
        });

        /**
         * Default Filters
         **/
        var filter = {
            '$and': []
        };
        var query = this.getParams();
        if (!_.isEmpty(query.search.value)) {
            var filterArr = [];
            for (var i = 0; i < columns.length; i++) {
                var colName = columns[i].index;
                var obj = {};
                var regExp = new RegExp(query.search['value'], 'i');
                obj[colName] = {
                    '$regex': regExp
                };
                filterArr.push(obj);
            }
            filter['$and'].push({
                '$or': filterArr
            });
        }
        if (!_.isEmpty(query.filter)) {
            var allOrs = _.filter(query.filter, function(q) {
                return q['condition'] === '$or';
            });
            var allAnds = _.filter(query.filter, function(q) {
                return q['condition'] === '$and';
            });
            var orObjs = [];
            _.each(allOrs, function(qOrs) {
                var obj = {};
                if (qOrs['operator'] === '$eq') {
                    obj[qOrs['field']] = qOrs['compare_value'];
                    orObjs.push(obj);
                } else if (qOrs['operator'] === '$regex') {
                    var regEx = new RegExp(qOrs['compare_value'], "i");
                    obj[qOrs['field']] = {
                        $regex: regEx
                    };
                    orObjs.push(obj);
                } else {
                    obj[qOrs['field']] = {};
                    obj[qOrs['field']][qOrs['operator']] = qOrs['compare_value'];
                    orObjs.push(obj);
                }
            });
            var andObjs = [];
            _.each(allAnds, function(qOrs) {
                var obj = {};
                if (qOrs['operator'] === '$eq') {
                    obj[qOrs['field']] = qOrs['compare_value'];
                    andObjs.push(obj);
                } else if (qOrs['operator'] === '$regex') {
                    var regEx = new RegExp(qOrs['compare_value'], "i");
                    obj[qOrs['field']] = {
                        $regex: regEx
                    };
                    andObjs.push(obj);
                } else {
                    obj[qOrs['field']] = {};
                    obj[qOrs['field']][qOrs['operator']] = qOrs['compare_value'];
                    andObjs.push(obj);
                }
            });
            if (!_.isEmpty(orObjs)) {
                filter['$and'].push({
                    '$or': orObjs
                });
            }
            if (!_.isEmpty(andObjs)) {
                filter['$and'].push({
                    '$and': andObjs
                });
            }
        }
        if (_.isEmpty(filter['$and'])) {
            filter = {};
        }
        filterWhere = _.extend(filterWhere, filter);
        var totalWhere = _.extend({}, defaultWhere, filterWhere);
        modelClass.count(defaultWhere, function(err, count) {
            var recordsTotal = count;
            modelClass.count(totalWhere, function(err, filteredCount) {
                var recordsFiltered = filteredCount;
                var project = {};
                if (settings.columns) {
                    _.each(_.pluck(settings.columns, "data"), function(key) {
                        project[key] = 1;
                    });
                }
                modelClass.aggregate([{
                    $match: totalWhere
                }, {
                    $project: project
                }, {
                    $sort: sortingCriteria
                }, {
                    $skip: offset
                }, {
                    $limit: limit
                }], _.bind(function(err, records) {
                    if (err) {
                        console.log(err);
                    }
                    var data = dataFilter.apply(self, [records]);
                    if(typeof data['resolve'] === 'function' && typeof data['done'] === 'function') {
                        data.done(function(response){
                            def.resolve({
                                draw: draw,
                                data: response,
                                recordsTotal: recordsTotal,
                                recordsFiltered: recordsFiltered
                            });    
                        });
                    } else {
                        def.resolve({
                            draw: draw,
                            data: data,
                            recordsTotal: recordsTotal,
                            recordsFiltered: recordsFiltered
                        });
                    }
                }, self));
            });
        });
    },
    getProjectCids: function(projectId){
        var projectClass = this.getModel('project'),
        self = this,
        def = _.Deferred();
        projectClass.findOne({id: projectId},{'adwords_details.cid':1,_id: 0},function(err,data){
            var cids = [];
            if(data) {
                cids = data['adwords_details'][0]['cid'].split(",");
            }
            def.resolveWith(self,[cids]);
        });
        return def;
    },
    prepareGridColumns: function(columns,modelClass ,removeNotToBeDisplayed){
        var appuser = this.request.currentUser;
        var userType = appuser.get('type');
        var cols = _.filter(columns.slice(0), function(col) {
            if(typeof col['acl'] === 'undefined') {
                return true;
            }
            return _.contains(col['acl'], userType);
        });
        _.each(cols, function(col){
            if(!_.isUndefined(col['render']) && _.isFunction(col['render'])) {
                col['render'] = col['render'].toString();
            }
            if(_.isUndefined(col['display'])) {
                col['display'] = true;
            } else {
                col['display'] = Boolean(col['display']);
            }
        });
        var getFieldInfoByName = function(columnName) {
            var columnNameArr = columnName.split(".");
            var i = 0;
            var path = {};
            if (columnNameArr.length === 1) {
                return modelClass.schema.paths[columnNameArr[0]];
            }
            _.each(columnNameArr, function(col) {
                if (i === 0) {
                    path = modelClass.schema.paths[col];
                } else {
                    path = path.schema.paths[col];
                }
                i++;
            });
            return path;
        };
        var regExp = new RegExp("^function (.*)\\(.*");
        var addType = function(columns) {
            _.each(columns, function(column) {
                try{
                    var info = getFieldInfoByName(column.data);
                    column['type'] = _.last(String(info['options']['type']).match(regExp));
                } catch(ex) {
                    column['type'] = 'String';
                }
            });
        };
        addType(cols);
        if(removeNotToBeDisplayed) {
            cols = _.filter(cols,function(col){
                return col['display'];
            });
        }
        return cols;
    }
};
module.exports = baseController;