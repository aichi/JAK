/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/
(function(){
	var win = window,
		doc = document,
		body = doc.body,
		client = JAK.Browser.client,
		version = JAK.Browser.version,
		Request =
		/**
		 * @class XML/TEXT/JSONP request
		 * @group jak
		 * @example
		 * var r = new JAK.Request(JAK.Request.XML, {method:"get"});
		 * r.setCallback(mujObjekt, "jehoMetoda");
		 * r.send("/dobrerano", {a:b, c:"asdf&asdf"});
		 */
		JAK.Request = JAK.ClassMaker.makeClass({
			NAME: "JAK.Request",
			VERSION: "2.0"
		}),
		RequestProto = Request.prototype;

/** @constant */
Request.XML		= 0;
/** @constant */
Request.TEXT	= 1;
/** @constant */
Request.JSONP	= 2;
/** @constant */
Request.BINARY	= 3;

/**
 * Podporuje tento prohlizec CORS?
 */
Request.supportsCrossOrigin = function() {
	if (client == "opera") { return false; }
	if (client == "ie" && version < 8) { return false; }
	return true;
}

/**
 * @param {int} type Type požadavku, jedna z konstant JAK.Request.*
 * @param {object} [options] Konfigurační objekt
 * @param {bool} [options.async=true] Je-li požadavek asynchronní
 * @param {bool} [options.timeout=0] Timeout v msec; 0 = disable
 * @param {bool} [options.method="get"] HTTP metoda požadavku
 */
RequestProto.$constructor = function(type, options) {
	this._NEW		= 0;
	this._SENT		= 1;
	this._DONE		= 2;
	this._ABORTED	= 3;
	this._TIMEOUT	= 4;
	
	this._xhr = null;
	this._callback = "";
	this._script = null;
	this._type = type;
	this._headers = {};
	this._callbacks = {};
	this._state = this._NEW;
	this._xdomain = false; /* pouzivame IE8+ XDomainRequest? */
	
	this._options = {
		async: true,
		timeout: 0,
		method: "get"
	}
	for (var p in options) { this._options[p] = options[p]; }

	if (this._type == JAK.Request.JSONP) {
		if (this._options.method.toLowerCase() == "post") { throw new Error("POST not supported in JSONP mode"); }
		if (!this._options.async) { throw new Error("Async not supported in JSONP mode"); }
	}
};

RequestProto.$destructor = function() {
	if (this._state == this._SENT) { this.abort(); }
	this._xhr = null;
}

/**
 * Nastaví hlavičky požadavku
 * @param {object} headers Hlavičky (dvojice název:hodnota)
 */
RequestProto.setHeaders = function(headers) {
	if (this._type == Request.JSONP) { throw new Error("Request headers not supported in JSONP mode"); }
	for (var p in headers) { this._headers[p] = headers[p]; }
}

/**
 * Vrátí hlavičky odpovědi
 * @returns {object} Hlavičky (dvojice název:hodnota)
 */
RequestProto.getHeaders = function() {
	if (this._state != this._DONE) { throw new Error("Response headers not available"); }
	if (this._type == Request.JSONP) { 	throw new Error("Response headers not supported in JSONP mode"); }
	var headers = {};
	var h = this._xhr.getAllResponseHeaders();
	if (h) {
		h = h.split(/[\r\n]/);
		for (var i=0;i<h.length;i++) if (h[i]) {
			var v = h[i].match(/^([^:]+): *(.*)$/);
			headers[v[1]] = v[2];
		}
	}
	return headers;
}

/**
 * Odešle požadavek
 * @param {string} url Cílové URL
 * @param {string || object} [data] Data k odeslání
 */
RequestProto.send = function(url, data) {
	if (this._state != this._NEW) { throw new Error("Request already sent"); }

	this._state = this._SENT;
	this._userCallback(this);

	switch (this._type) {
		case Request.XML:
		case Request.TEXT:
		case Request.BINARY:
			return this._sendXHR(url, data);
		break;
		case Request.JSONP:
			return this._sendScript(url, data);
		break;
		default:
			throw new Error("Unknown request type");
		break;
	}
}

/**
 * Přeruší probíhající požadavek
 * @returns {bool} Byl požadavek přerušen?
 */
RequestProto.abort = function() {
	if (this._state != this._SENT) { return false; }
	this._state = this._ABORTED;
	if (this._xhr) { this._xhr.abort(); }
	this._userCallback(this);
	return true;
}

/**
 * Nastavení callbacku po dokončení požadavku
 * @param {object || null} obj
 * @param {function || string} method
 */
RequestProto.setCallback = function(obj, method) {
	this._setCallback(obj, method, this._DONE);
	return this;
}

/**
 * Nastavení callbacku po odeslání
 * @see JAK.Request#setCallback
 */
RequestProto.setSendCallback = function(obj, method) {
	this._setCallback(obj, method, this._SENT);
	return this;
}

/**
 * Nastavení callbacku po abortu
 * @see JAK.Request#setCallback
 */
RequestProto.setAbortCallback = function(obj, method) {
	this._setCallback(obj, method, this._ABORTED);
	return this;
}

/**
 * Nastavení callbacku po timeoutu
 * @see JAK.Request#setCallback
 */
RequestProto.setTimeoutCallback = function(obj, method) {
	this._setCallback(obj, method, this._TIMEOUT);
	return this;
}

/**
 * Interni registrace callbacku pro zadany stav
 */
RequestProto._setCallback = function(obj, method, state) {
	this._callbacks[state] = [obj, method];
}

/**
 * Odeslani pozadavku pres XHR
 */
RequestProto._sendXHR = function(url, data) {
	/* nejprve vyrobit instanci XHR */
	if (win.XMLHttpRequest) {
		var ctor = XMLHttpRequest;
		var r = url.match(/^https?\:\/\/(.*?)\//);
		if (r && r[1] != location.host && win.XDomainRequest) { /* pro cross-domain je v IE >= 8 novy objekt */
			if (this._type == Request.BINARY) { throw new Error("XDomainRequest does not support BINARY mode"); }
			this._xdomain = true;
			ctor = XDomainRequest; 
		}
		this._xhr = new ctor(); 
	} else if (win.ActiveXObject) {
		this._xhr = new ActiveXObject("Microsoft.XMLHTTP"); 
	} else { throw new Error("No XHR available"); }
	
	if (this._xdomain) {
		this._xhr.onload = this._onXDomainRequestLoad.bind(this);
	} else {
		this._xhr.onreadystatechange = this._onReadyStateChange.bind(this);
	}

	/* zpracovat parametry */
	var u, d;
	if (this._options.method.toLowerCase() == "get") {
		u = this._buildURL(url, data);
		d = null;
	} else {
		u = url;
		d = this._serializeData(data);
		
		var ctSet = false;
		for (var p in this._headers) {
			if (p.toLowerCase() == "content-type") { 
				ctSet = true;
				break;
			}
		}
		if (!ctSet) { this.setHeaders({"Content-Type":"application/x-www-form-urlencoded"}); }
	}

	if (this._type == Request.BINARY) {
		if (this._xhr.overrideMimeType) {
			this._xhr.overrideMimeType("text/plain; charset=x-user-defined");
		} else if (client == "ie") {
			this._buildVBS();
		} else {
			throw new Error("This browser does not support binary transfer");
		}
	}

	this._xhr.open(this._options.method, u, this._options.async);
	for (var p in this._headers) { this._xhr.setRequestHeader(p, this._headers[p]); }
	this._xhr.send(d);
	
	if (this._options.timeout) { setTimeout(this._timeout.bind(this), this._options.timeout); }
	if (!this._options.async) { this._onReadyStateChange(); }
	
	return u;
}

/**
 * Odeslani JSONP pozadavku pres &lt;script&gt;
 */
RequestProto._sendScript = function(url, data) {
	var o = data || {};

	this._callback = "callback" + JAK.idGenerator();
	o.callback = this._callback;
	var url = this._buildURL(url, o);
	win[this._callback] = this._scriptCallback.bind(this);
	
	this._script = JAK.mel("script", {type:"text/javascript", src:url});
	body.insertBefore(this._script, body.firstChild);

	return url;
}

/**
 * Tvorba URL zmixovanim zakladu + dat
 */
RequestProto._buildURL = function(url, data) {
	var s = this._serializeData(data);
	if (!s.length) { return url; }
	
	if (url.indexOf("?") == -1) {
		return url + "?" + s;
	} else {
		return url + "&" + s;
	}
}

/**
 * Serialize dat podle HTML formularu
 */
RequestProto._serializeData = function(data) {
	if (typeof(data) == "string") { return data; }
	if (win.File && data instanceof File) { return data; }
	if (!data) { return ""; }
	
	var arr = [],
		p,
		value,
		i;
	for (p in data) {
		value = data[p];
		if (!(value instanceof Array)) { value = [value]; }
		for (i = 0; i < value.length; i++) {
			arr.push(encodeURIComponent(p) + "=" + encodeURIComponent(value[i]));
		}
	}
	return arr.join("&");
}

/**
 * Zmena stavu XHR
 */
RequestProto._onReadyStateChange = function() {
	if (this._state == this._ABORTED) { return; }
	if (this._xhr.readyState != 4) { return; }

	var status = this._xhr.status,
		data,
		length,
		i,
		text;

	if (this._type == Request.BINARY) {
		data = [];
		if (client == "ie") {
			length = VBS_getLength(this._xhr.responseBody);
			for (i=0;i<length;i++) { data.push(VBS_getByte(this._xhr.responseBody, i)); }
		} else {
			text = this._xhr.responseText;
			length = text.length;
			for (i=0;i<length;i++) { data.push(text.charCodeAt(i) & 0xFF); }
		}
	} else {
		data = (this._type == Request.XML ? this._xhr.responseXML : this._xhr.responseText);
	}

	this._done(data, status);
}

/**
 * Nacteni XDomainRequestu
 */
RequestProto._onXDomainRequestLoad = function() {
	if (this._state == this._ABORTED) { return; }

	var data = this._xhr.responseText;
	if (this._type == JAK.Request.XML) {
		var xml = new ActiveXObject("Microsoft.XMLDOM");
		xml.async = false;
		xml.loadXML(data);
		data = xml;
	}

	this._done(data, 200);
}

/**
 * JSONP callback
 */
RequestProto._scriptCallback = function(data) {
	this._script.parentNode.removeChild(this._script);
	this._script = null;
	delete win[this._callback];

	if (this._state != this._ABORTED) { this._done(data, 200); }
}

/**
 * Request uspesne dokoncen
 */
RequestProto._done = function(data, status) {
	if (this._state == this._DONE) { return; }
	this._state = this._DONE;
	this._userCallback(data, status, this);
}

/**
 * Nastal timeout
 */
RequestProto._timeout = function() {
	if (this._state != this._SENT) { return; }
	this.abort();
	
	this._state = this._TIMEOUT;
	this._userCallback(this);	
}

/**
 * Volani uziv. callbacku
 */
RequestProto._userCallback = function() {
	var data = this._callbacks[this._state];
	if (!data) { return; }
	
	var obj = data[0] || win;
	var method = data[1];
	
	if (obj && typeof(method) == "string") { method = obj[method]; }
	if (!method) {
		method = obj;
		obj = win;
	}
	
	method.apply(obj, arguments);
}

RequestProto._buildVBS = function() {
	var s = JAK.mel("script", {type:"text/vbscript"});
	s.text = "Function VBS_getByte(data, pos)\n"
		+ "VBS_getByte = AscB(MidB(data, pos+1,1))\n"
		+ "End Function\n"
		+ "Function VBS_getLength(data)\n"
		+ "VBS_getLength = LenB(data)\n"
		+ "End Function";
	doc.getElementsByTagName("head")[0].appendChild(s);
}

}());