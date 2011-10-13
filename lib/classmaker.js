/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/
(function(){
	var CM =
/**
 * @overview Statická třída sestavující dědičnost rozšiřováním prototypového objektu
 * doplňováním základních metod a testováním závislostí. 
 * @version 5.1
 * @author jelc, zara, aichi
 */   

/**
 * Konstruktor se nevyužívá. Vždy rovnou voláme metody, tedy např.: JAK.ClassMaker.makeClass(...).
 * @namespace
 * @group jak
 */
JAK.ClassMaker = {};

/** 
 * @field {string} verze třídy 
 */
CM.VERSION = "5.1";
/** 
 * @field {string} název třídy 
 */
CM.NAME = "JAK.ClassMaker";
	
/**
 * Vlastní metoda pro vytvoření třídy, v jediném parametru se dozví informace o třídě, kterou má vytvořit.
 * @param {object} params parametry pro tvorbu nové třídy
 * @param {string} params.NAME povinný název třídy
 * @param {string} [params.VERSION="1.0"] verze třídy
 * @param {function} [params.EXTEND=false] reference na rodičovskou třídu
 * @param {function[]} [params.IMPLEMENT=[]] pole referencí na rozhraní, jež tato třída implementuje
 * @param {object[]} [params.DEPEND=[]] pole závislostí
 */
CM.makeClass = function(params) {
	var p = this._makeDefaultParams(params),
		constructor = function() { /* normalni trida */
			/* ff4 beta - workaround pro https://bugzilla.mozilla.org/show_bug.cgi?id=586482 */
			if (JAK.Browser.client == "gecko" && JAK.Browser.version == "4" && !constructor.__ff4_hack) {
				for (var p in this) { typeof(this[p]); }
				constructor.__ff4_hack = true;
			}

			var inicializator = false;
			if ("$constructor" in arguments.callee.prototype) {
				inicializator = arguments.callee.prototype.$constructor;
			}
			if (inicializator) { inicializator.apply(this,arguments); }
		};

	return this._addConstructorProperties(constructor, p);
}

/**
 * Vlastní metoda pro vytvoření Jedináčka (Singleton), odlišnost od tvorby třídy přes makeClass je, 
 * že třídě vytvoří statickou metodu getInstance, která vrací právě jednu instanci a dále, že konstruktor
 * nelze zavolat pomocí new (resp. pokud je alespoň jedna instance vytvořena.) Instance je uschována do 
 * vlastnosti třídy _instance
 * @see JAK.ClassMaker.makeClass
 */ 
CM.makeSingleton = function(params) {
	var p = this._makeDefaultParams(params),
		constructor = function() { /* singleton, nelze vytvaret instance */
			throw new Error("Cannot instantiate singleton class");
		};
	
	constructor._instance = null;
	constructor.getInstance = this._getInstance;

	return this._addConstructorProperties(constructor, p);
}

/**
 * Vlastní metoda pro vytvoření "třídy" charakterizující rozhranní
 * @see JAK.ClassMaker.makeClass
 */
CM.makeInterface = function(params) {
	var p = this._makeDefaultParams(params),
			constructor = function() {
			throw new Error("Cannot instantiate interface");
		};
	
	return this._addConstructorProperties(constructor, p);	
}

/**
 * Vlastní metoda pro vytvoření statické třídy, tedy jmeného prostoru
 * @param {object} params parametry pro tvorbu nové třídy
 * @param {string} params.NAME povinný název třídy
 * @param {string} params.VERSION verze třídy
 */
CM.makeStatic = function(params) {
	var p = this._makeDefaultParams(params),
        obj = {};
	obj.VERSION = p.VERSION;
	obj.NAME = p.NAME;
	return obj;
}

/**
 * Vytvoření defaultních hodnot objektu params, pokud nejsou zadané autorem
 * @param {object} params parametry pro tvorbu nové třídy 
 */ 
CM._makeDefaultParams = function(params) {
	if ('EXTEND' in params) {
		if (!params.EXTEND) {
			throw new Error("Cannot extend non-exist class");
		}
		if (!('NAME' in params.EXTEND)) {
			throw new Error("Cannot extend non-JAK class");
		}
	}

	params.NAME = params.NAME || false;
	params.VERSION = params.VERSION || "1.0";
	params.EXTEND = params.EXTEND || false;
	params.IMPLEMENT = params.IMPLEMENT || [];
	params.DEPEND = params.DEPEND || [];
	
	/* implement muze byt tez jeden prvek */
	if (!(params.IMPLEMENT instanceof Array)) { params.IMPLEMENT = [params.IMPLEMENT]; }
	
	this._preMakeTests(params);
	
	return params;
}

/**
 * Otestování parametrů pro tvorbu třídy
 * @param {object} params parametry pro tvorbu nové třídy 
 */ 
CM._preMakeTests = function(params) {
    if (!params.NAME) { throw new Error("No NAME passed to JAK.ClassMaker.makeClass()"); }
	
	/* test zavislosti */
	var result = false;
	if (result = this._testDepend(params.DEPEND)) { throw new Error("Dependency error in class " + params.NAME + " ("+result+")"); }
}

/**
 * Vytvořenému konstruktoru nové třídy musíme do vínku dát výchozí hodnoty a metody
 */ 
CM._addConstructorProperties = function(constructor, params) {
	/* staticke vlastnosti */
	for (var p in params) { constructor[p] = params[p]; }
	
	/* zdedit */
	this._setInheritance(constructor);
	
	/* classMaker dava instancim do vinku tyto vlastnosti a metody */
	constructor.prototype.constructor = constructor;
	constructor.prototype.$super = this._$super;
	
	return constructor;	
}

/**
 * Statická metoda pro všechny singletony
 */
CM._getInstance = function() {
	if (!this._instance) { 
		var tmp = function() {};
		tmp.prototype = this.prototype;
		this._instance = new tmp(); 
		if ("$constructor" in this.prototype) { this._instance.$constructor(); }
	}
	return this._instance;
}
	
/**
 * Volá vlastní kopírování prototypových vlastností jednotlivých rodičů
 * @param {array} extend pole rodicovskych trid
*/
CM._setInheritance = function(constructor) {
	if (constructor.EXTEND) { this._makeInheritance(constructor, constructor.EXTEND); }
	for (var i=0; i<constructor.IMPLEMENT.length; i++) {
		this._makeInheritance(constructor, constructor.IMPLEMENT[i], true);
	}
}

/**
 * Provádí vlastní kopírovaní prototypových vlastností z rodiče do potomka 
 * pokud je prototypová vlastnost typu object zavolá metodu, která se pokusí
 * vytvořit hlubokou kopii teto vlastnosti
 * @param {object} constructor Potomek, jehož nové prototypové vlastnosti nastavujeme
 * @param {object} parent Rodič, z jehož vlastnosti 'protype' budeme kopírovat	  	 
 * @param {bool} noSuper Je-li true, jen kopírujeme vlasnosti (IMPLEMENT)
*/
CM._makeInheritance = function(constructor, parent, noSuper){
	var p,
		item,
		tmp;
	/* nastavit funkcim predka referenci na predka */
	for (p in parent.prototype) {
		item = parent.prototype[p];
		if (typeof(item) != "function") { continue; }
		if (!item.owner) { item.owner = parent; }
	}

	if (!noSuper) { /* extend */
		tmp = function(){};
		tmp.prototype = parent.prototype;
		constructor.prototype = new tmp();
		for (p in parent.prototype) {
			if (typeof parent.prototype[p] != "object") { continue; }
			constructor.prototype[p] = JSON.parse(JSON.stringify(parent.prototype[p]));
		}
		return;
	}

	for (p in parent.prototype) { /* implement */
		if (typeof parent.prototype[p] == "object") {
			constructor.prototype[p] = JSON.parse(JSON.stringify(parent.prototype[p]));
		} else {
			constructor.prototype[p] = parent.prototype[p];
		}
	}
}
	
/**
 * Testuje závislosti vytvářené třídy, pokud jsou nastavené
 * @param {array} depend Pole závislostí, ktere chceme otestovat
 * @returns {bool|string} false = ok, string = error  
*/
CM._testDepend = function(depend){
	var i,
		item,
		depMajor,
		claMajor;
	for(i = 0; i < depend.length; i++) {
		item = depend[i];
		if (!item.sClass) { return "Unsatisfied dependency"; }
		if (!item.ver) { return "Version not specified in dependency"; }
		depMajor = item.sClass.VERSION.split('.')[0];
		claMajor = item.ver.split('.')[0];
		if (depMajor != claMajor) { return "Version conflict in "+item.sClass.NAME; }
	}
	return false;
}

/**
 * Další pokus o volání předka. Přímo volá stejně pojmenovanou metodu předka a předá jí zadané parametry.
 */
CM._$super = function() {
	var caller,
		owner,
		callerName,
		name,
		parent,
		func;

	caller = arguments.callee.caller; /* nefunguje v Opere < 9.6 ! */
	if (!caller) { throw new Error("Function.prototype.caller not supported"); }
	
	owner = caller.owner || this.constructor; /* toto je trida, kde jsme "ted" */

	callerName = false;
	for (name in owner.prototype) {
		if (owner.prototype[name] == caller) { callerName = name; break; }
	}
	if (!callerName) { throw new Error("Cannot find supplied method in constructor"); }
	
	parent = owner.EXTEND;
	if (!parent) { throw new Error("No super-class available"); }
	if (!parent.prototype[callerName]) { throw new Error("Super-class doesn't have method '"+callerName+"'"); }

	func = parent.prototype[callerName];
	return func.apply(this, arguments);
}

}());