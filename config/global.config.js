module.exports = {
    app_name: "Express-MVC",
    app_details: {
        display_title: "Express-MVC",
        footer_text: "2014 CodeByte. All rights reserved"
    },
    modules: ['home'],
    views: {
        viewBase: baseDir + '/modules',
        templatePath: baseDir + '/lib/base/templates'
    },
    datatables:{
        pageLimit : 10
    }
};