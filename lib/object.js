/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/
(function(){
	var ObjLib =
/**
 * @class Třída provádí operace s objekty jako je jejich porovnávaní a serializace a deserializace. Obsolete!
 * @group jak
 */    
JAK.ObjLib = JAK.ClassMaker.makeClass({
	NAME: "ObjLib",
	VERSION: "3.1"
});

ObjLib.prototype.reSetOptions = function() {
}

ObjLib.prototype.pretty = function(str) {
	return str;
}

ObjLib.prototype.serialize = function(objToSource) {
	return JSON.stringify(objToSource);
};

ObjLib.prototype.unserialize = function(serializedString) {
	return JSON.parse(serializedString);
}

ObjLib.prototype.match = function(refObj, matchObj){
	return (JSON.stringify(refObj) == JSON.stringify(matchObj));
};

ObjLib.prototype.copy = function(objToCopy) {
	return JSON.parse(JSON.stringify(objToCopy));
};

ObjLib.prototype.arrayCopy = function(arrayToCopy) {
	return this.copy(arrayToCopy);
};

}());
