"use strict";
var clc = require('cli-color');
module.exports = {
    error: function(message) {
        if (env === "staging" || env === "production") {
            console.log("Error: " + message);
        } else {
            console.log("Error: " + clc.red(message));
        }
    },
    warn: function(message) {
        if (env === "staging" || env === "production") {
            console.log("Warning: " + message);
        } else {
            console.log("Warning: " + clc.yellow(message));
        }
    },
    notice: function(message) {
        if (env === "staging" || env === "production") {
            console.log("Notice: " + message);
        } else {
            console.log("Notice: " + clc.blue(message));
        }
    },
    info: function(message) {
        if (env === "staging" || env === "production") {
            console.log("Notice: " + message);
        } else {
            console.log("Info: " + clc.cyan(message));
        }
    }
};