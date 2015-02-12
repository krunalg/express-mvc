var basicProperties = {
	customSave: function(){
		console.log("Am custom save");
	}
};
/**
 * method for extend
 * @param {type} properties
 * @returns {Object}
 */
module.exports.extend = function(properties) {
    if(_.isEmpty(properties['collection'])){
    	throw "Please specify the collection name for the model";
    }else{
        this.name = properties['collection'];
    }
    var schema = {};
    if(!_.isEmpty(properties['schema'])){
    	schema = properties['schema'];
    }
    var mongooseSchema = G.mongoose.Schema(schema,{ strict: false });
    var otherProperties = _.filter(Object.keys(properties),function(prop){
    	return prop !== 'schema' && prop !== 'collection';
    });
    var prop = {};
    _.each(otherProperties,function(op){
    	prop[op] = properties[op];
    });
    _.defaults(prop, basicProperties);

    _.each(prop,function(staticProp,staticName){
    	mongooseSchema.static(staticName, staticProp);
    });
    return G.mongoose.model(properties['collection'],mongooseSchema,properties['collection']);
};