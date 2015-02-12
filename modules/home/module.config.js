module.exports = {
    module: 'home',
    controllers: {
        'index': 'home/controllers/index'
    },
    models : {
        'user' : 'home/models/user'
    },
    routers: {
        'login': {
            route: '/',
            controller: 'index',
            action: 'login'
        },
        'logout': {
            route: '/logout',
            controller: 'index',
            action: 'logout'
        }
    }
};