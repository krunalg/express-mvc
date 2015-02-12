var env = process.env.ENV || "dev";
var serverCfg = require('../config/server.config')();
jasmine.getEnv().defaultTimeoutInterval = 5000;
describe("MongoDB - Mongoose", function() {
    it("is there a server running", function(done) {
        var mongoose = require('mongoose');
        mongoose.connect(serverCfg.db.dbDSN);
        var db = mongoose.connection;
        var self = this;
        db.on('error',function(){
           self.connected = false; 
        });
        db.on('open',function(){
           self.connected = true; 
        });
        setTimeout(function(){
            expect(self.connected).toBe(true);
            done();
        },jasmine.getEnv().defaultTimeoutInterval);
    });
});