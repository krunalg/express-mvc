describe("Configuration setup", function() {
    it("should load local configurations", function(next) {
        var config = require('../config/server.config')();
        expect(config.env).toBe('development');
        next();
    });
    it("should load staging configurations", function(next) {
        var config = require('../config/server.config')('staging');
        expect(config.env).toBe('staging');
        next();
    });
    it("should load production configurations", function(next) {
        var config = require('../config/server.config')('production');
        expect(config.env).toBe('production');
        next();
    });
});