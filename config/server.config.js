"use strict";
var config = {
    development: {
        env: "development",
        port: "6060",
        redis: {
            'host': 'localhost',
            'database': 'redis_dev',
            'port': '6379',
            'password': ''
        },
        mongo: {
            'host': 'localhost',
            'database': 'localdb',
            'port': '27017'
        },
        app: {
            domain: "http://localhost:3000",
            server_keys: {
                cookie: "32e6e8f6aedbb8416b5a35a1ba1ca83b421b5bfa"
            }
        }
    },
    staging: {
        env: "staging",
        port: "6060",
        redis: {
            'host': 'localhost',
            'database': 'redis_staging',
            'port': '6379',
            'password': ''
        },
        mongo: {
            'host': 'localhost',
            'database': 'localdb_staging',
            'port': '27017'
        },
        app: {
            domain: "http://localhost:3000",
            server_keys: {
                cookie: "32e6e8f6aedbb8416b5a35a1ba1ca83b421b5bfa"
            }
        },
        mysql: {
            host: 'localhost',
            user: 'production_db_user',
            database: 'production_db',
            password: 'production_password'
        }
    },
    live: {
        env: "staging",
        port: "6060",
        redis: {
            'host': 'localhost',
            'database': 'redis_staging',
            'port': '6379',
            'password': ''
        },
        mongo: {
            'host': 'localhost',
            'database': 'localdb_staging',
            'port': '27017'
        },
        app: {
            domain: "http://localhost:3000",
            server_keys: {
                cookie: "32e6e8f6aedbb8416b5a35a1ba1ca83b421b5bfa"
            }
        },
        mysql: {
            host: 'localhost',
            user: 'production_db_user',
            database: 'production_db',
            password: 'production_password'
        }
    }

};
module.exports = function (mode) {
    return config[mode || process.env.ENV || 'development'] || config.development;
};