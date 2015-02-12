module.exports = function() {
};
module.exports.prototype = {
    /**
     * method to exnted view object
     * @param {type} properties
     * @returns {require.prototype.extend.Child|module.exports.prototype.extend.Child|G.baseController@call;extend.prototype.extend.Child|cache.prototype.extend.Child|ejs@call;render.prototype.extend.Child|module.exports|cache|require|view@call;split@call;@arr;slice@call;@arr;split@call;replace@call;replace@call;split@call;map@call;join.prototype.extend.Child}
     */
    extend: function(properties) {
        var parent = this;
        var child = function() {
            return parent.apply(this, arguments);
        };
        var Surrogate = function() {
        };
        Surrogate.prototype = parent.prototype;
        child.prototype = new Surrogate;
        _.extend(child.prototype, properties);
        return child;
    },
    /**
     * Overriden render method
     * @param {type} data
     * @param {type} controller
     */
    render: function(data, controller) {
        if (typeof data === 'undefined') {
            data = {};
        }

        var tmpl = controller.module + "/views/" + controller.controller + "/" + controller.action;
        if (controller.response && controller.action) {
            if (controller.getResponseType() === 'json') {
                var resCode = controller.getResponseCode() || 200;
                controller.response.status(resCode).send(data);
            } else {
                if (typeof data.title === 'undefined') {
                    data.title = G.globalCfg.app_details.display_title;
                } else {
                    data.title = G.globalCfg.app_details.display_title + " - " + data.title;
                }
                if (typeof data.layout === 'undefined') {
                    data.layout = 'default-layout';
                }
                data.appuser = controller.request.currentUser;
                if (data.layout !== 'none') {
                    data.messages = [];
                    data.messages['info'] = controller.request.flash('info');
                    data.messages['error'] = controller.request.flash('error');
                    data.messages['warning'] = controller.request.flash('warning');
                    data.messages['success'] = controller.request.flash('success');
                    controller.response.render(tmpl, data);
                }
            }
        }
    }
};