"use strict";
module.exports = {
    /**
     * to generate random string combination of alpha-numeric
     * @returns {String}
     */
    generateRandom: function () {
        return Math.random().toString(36).substr(3, 8);
    },
    /**
     * checks is values is empty or not
     * @param {mixed} value
     * @returns {mixed}
     */
    isEmpty: function (value) {
        return value && value.length;
    },
    mergeByProperty: function (arr1, arr2, prop) {
        _.each(arr2, function (arr2obj) {
            var arr1obj = _.find(arr1, function (arr1obj) {
                return arr1obj[prop] === arr2obj[prop];
            });

            //If the object already exist extend it with the new values from arr2, otherwise just add the new object to arr1
            arr1obj ? _.extend(arr1obj, arr2obj) : arr1.push(arr2obj);
        });
    },
    shortenText: function (text, size) {
        if (text.length > size) {
            return text.substr(0, size) + "...";
        } else {
            return text;
        }
    },
    removeURLParam: function (url, parameter) {
        var urlparts = url.split('?');
        if (urlparts.length >= 2) {
            var prefix = encodeURIComponent(parameter) + '=';
            var pars = urlparts[1].split(/[&;]/g);
            for (var i = pars.length; i-- > 0; ) {
                if (pars[i].lastIndexOf(prefix, 0) !== -1) {
                    pars.splice(i, 1);
                }
            }
            url = urlparts[0] + '?' + pars.join('&');
            return url;
        } else {
            return url;
        }
    },
    advancedUrlChanges: function (options) {
        var def = _.Deferred();
        var self = this;
        var params = options.params;
        var project_id = params['project_id'];
        var items = params['items'].split(",");
        var itemModel = G.Bootstrap.getModel(options.model);
        var totalProcessed = 0;
        if (!items.length) {
            def.resolve([]);
        }
        def.progress(function () {
            if (items.length == totalProcessed) {
                /*self.request.flash('success', 'Advanced URL changes has been applied.');
                 self.redirect('/campaigns/' + params['project_id']);*/
                def.resolve([]);
            }
        });
        _.each(items, function (item) {
            try {
                self._processAdvancedURL(item, params, options.model).done(function (url) {
                    itemModel.update(url).done(function () {
                        totalProcessed++;
                        def.notify("item:processed");
                    }).fail(function (err) {
                        def.reject(err);
                    });
                }).fail(function (err) {
                    /*self.request.flash('error', 'Something went wrong! ' + err.toString());
                     self.redirect('/campaigns/' + project_id);*/
                    def.reject(err);
                });
            } catch (e) {
                /*self.request.flash('error', 'Something went wrong! ' + e.toString());
                 self.redirect('/campaigns/' + project_id);*/
                def.reject(e);
            }
        });
        return def;
    },
    _processAdvancedURL: function (id, params, model) {
        var def = _.Deferred();
        var item = {};
        item.id = id;
        var model = G.Bootstrap.getModel(model);
        model.fetch(id).done(function (data) {
            data = JSON.parse(JSON.stringify(data));
            switch (params['url_option']) {
                case 'change_url':
                    item.destination_url = params['url'];
                    break;
                case 'append_text':
                    item.destination_url = data['destination_url'] + params['url_text'];
                    break;
                case 'remove_url_param':
                    if (data['destination_url'] !== '') {
                        item.destination_url = G.cFuncs.removeURLParam(data['destination_url'], params['url_param']);
                        var urlparts = item.destination_url.split("?");
                        if (urlparts[1] === "") {
                            item.destination_url = item.destination_url.replace("?", "");
                        }
                    }
                    break;
                default:
                    item.destination_url = data['destination_url'];
            }
            def.resolve(item);
        }).fail(function (err) {
            def.reject(err);
        });
        return def;
    },
    moveUploadedFile: function (source, destination, filename) {
        var mkdirp = require(baseDir + "/lib/core/mkdirp");
        if (typeof destination === 'undefined') {
            destination = "./public/uploads";
        }
        var fs = require('fs');
        mkdirp(destination, function (err) {
            fs.rename(source, destination+"/"+filename, function (err) {
                if (err)
                    throw err;
                // delete the temporary file, so that the explicitly set temporary upload dir does not get filled with unwanted files
                fs.unlink(source, function () {
                    if (err)
                        throw err;
                    //res.send('File uploaded to: ' + target_path + ' - ' + req.files.thumbnail.size + ' bytes');
                });
                return true;
            });
        });

    }
};