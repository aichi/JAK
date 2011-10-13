/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/
(function(){
	var docu = document,
		window = window,
		body = docu.body,
		documentElement = docu.documentElement,
		client = JAK.Browser.client,
		version = JAK.Browser.version,
		DOM =
/**
 * @overview Statická třída posytující některé praktické metody na úpravy a práci s DOM stromem, např. vytváření a získávání elementů.
 * @version 5.0
 * @author zara, koko, jelc
 */

/**
 * Statický konstruktor, nemá smysl vytvářet jeho instance.
 * @namespace
 * @group jak
 */
JAK.DOM = JAK.ClassMaker.makeStatic({
	NAME: "JAK.DOM",
	VERSION: "5.0"
});

/**
 * Vytvoří DOM node, je možné rovnou zadat CSS třídu a id.
 * Etymologie: cel = cREATE elEMENT
 * @param {string} tagName jméno tagu (lowercase)
 * @param {string} className název CSS tříd(y)
 * @param {string} id id uzlu
 * @param {object} [doc] dokument, v jehož kontextu se node vyrobí (default: document)
 * @returns {node}
 */
JAK.cel = function(tagName, className, id, doc) {
	var d = doc || docu,
		node = d.createElement(tagName);
	if (className) { node.className = className; }
	if (id) { node.id = id; }
	return node;
}
	
/**
 * Vytvoří DOM node, je možné rovnou zadat vlastnosti a css vlastnosti.
 * Etymologie: mel = mAKE elEMENT
 * @param {string} tagName jméno tagu (lowercase)
 * @param {object} properties asociativní pole vlastností a jejich hodnot
 * @param {object} styles asociativní pole CSS vlastností a jejich hodnot
 * @param {object} [doc] dokument, v jehož kontextu se node vyrobí (default: document)
 * @returns {node}
 */
JAK.mel = function(tagName, properties, styles, doc) {
	var d = doc || docu,
		node = d.createElement(tagName),
		p;
	if (properties) {
		for (p in properties) { node[p] = properties[p]; }
	}
	if (styles) { DOM.setStyle(node, styles); }
	return node;
}

/**
 * Alias pro document.createTextNode.
 * Etymologie: ctext = cREATE text
 * @param {string} str řetězec s textem
 * @param {object} doc dokument, v jehož kontextu se node vyrobí (default: document)
 * @returns {node}
 */
JAK.ctext = function(str, doc) {
	var d = doc || docu;
	return d.createTextNode(str);
}
	
/**
 * Zjednodušený přístup k metodě DOM document.getElementById.
 * Etymologie: gel = gET elEMENT
 * @param {string || node} id id HTML elementu, který chceme získat nebo element
 * @param {object} [doc] dokument, v jehož kontextu se node vyrobí (default: document)
 * @returns {node} HTML element s id = id, pokud existuje, NEBO element specifikovaný jako parametr
 */
 JAK.gel = function(id, doc) {
	var d = doc || docu;
	if (typeof(id) == "string") {
		return d.getElementById(id);
	} else { return id; }
}


/**
 * Vrací pole prvků vyhovujících zadanému CSS1 selektoru
 * @param {string} query CSS1 selektor
 * @returns {node[]}
 */
JAK.query = function(query) {
	/* profiltruje nodeset podle idcek a atributu */
	var filterNodes = function(nodes, attributes) {
			var arr = [],
				i,
				j,
				node,
				ok,
				attrib,
				ch,
				value;
			for (i = 0; i < nodes.length; i++) {
				node = nodes[i];
				ok = true;
				for (j = 0; j < attributes.length; j++) {
					attrib = attributes[j];
					ch = attrib.charAt(0);
					value = attrib.substr(1).toLowerCase();
					if (ch == "#" && value != node.id.toLowerCase()) { ok = false; }
					if (ch == "." && !DOM.hasClass(node, value)) { ok = false; }
				}
				if (ok) { arr.push(node); }
			}
			return arr;
		},
		result = [],
		selectors = query.split(","), /* sjednoceni */
		selector,
		parts,
		candidates,
		i,
		newCandidates,
		part,
		tagName,
		attributes,
		candidate,
		nodes,
		c;
	while (selectors.length) {
		selector = selectors.shift().trim(); /* jeden css selektor */
		parts = selector.split(/ +/);
		
		candidates = [docu]; /* zde udrzujeme vsechny, kteri zatim vyhovuji */
		
		for (i = 0; i < parts.length; i++) { /* vsechny casti oddelene mezerou */
			newCandidates = [];
			part = parts[i];
			
			tagName = part.match(/^[a-z]*/i)[0] || "*"; /* nazev uzlu nebo "*" */
			attributes = part.match(/[\.#][^\.#]+/g) || []; /* pole idcek a/nebo class */
			
			while (candidates.length) { /* vezmu vsechny co zatim prosli */
				candidate = candidates.shift();
				nodes = candidate.getElementsByTagName(tagName); /* vsichni jeho vyhovujici potomci */
				
				newCandidates = newCandidates.concat(filterNodes(nodes, attributes)); /* prosli touto iteraci */
			}
			
			candidates = newCandidates;
		}
		
		for (i = 0; i < candidates.length; i++) {
			c = candidates[i];
			if (result.indexOf(c) == -1) { result.push(c); }
		}
	}

	return result;	
}

/**
 * Propoji zadané DOM uzly
 * @param {Array} pole1...poleN libovolný počet polí; pro každé pole se vezme jeho první prvek a ostatní 
 *   se mu navěsí jako potomci
 */
DOM.append = function() { /* takes variable amount of arrays */
	var i,
		j,
		arr,
		head;
	for (i = 0; i < arguments.length; i++) {
		arr = arguments[i];
		head = arr[0];
		for (j = 1; j < arr.length; j++) {
			head.appendChild(arr[j]);
		}
	}
}

/**
 * Otestuje, má-li zadany DOM uzel danou CSS třídu
 * @param {Object} element DOM uzel
 * @param {String} className CSS třída
 * @return {bool} true|false
 */
DOM.hasClass = function(element,className) {
	var arr = element.className.split(" "),
		i;
	for (i = 0; i < arr.length; i++) {
		if (arr[i].toLowerCase() == className.toLowerCase()) { return true; } 
	}
	return false;
}

/**
 * Přidá DOM uzlu CSS třídu. Pokud ji již má, pak neudělá nic.
 * @param {Object} element DOM uzel
 * @param {String} className CSS třída
 */
DOM.addClass = function(element,className) {
	if (DOM.hasClass(element,className)) { return; }
	element.className += " "+className;
}

/**
 * Odebere DOM uzlu CSS třídu. Pokud ji nemá, neudělá nic.
 * @param {Object} element DOM uzel
 * @param {String} className CSS třída
 */
DOM.removeClass = function(element,className) {
	var names = element.className.split(" "),
		newClassArr = [],
		i;
	for (i = 0; i < names.length; i++) {
		if (names[i].toLowerCase() != className.toLowerCase()) { newClassArr.push(names[i]); }
	}
	element.className = newClassArr.join(" ");
}

/**
 * Vymaže (removeChild) všechny potomky daného DOM uzlu
 * @param {Object} element DOM uzel
 */
DOM.clear = function(element) {
	while (element.firstChild) { element.removeChild(element.firstChild); }
}

/**
 * vrací velikost dokumentu, lze použít ve standardním i quirk módu 
 * @returns {object} s vlastnostmi:
 * <ul><li><em>width</em> - šířka dokumentu</li><li><em>height</em> - výška dokumentu</li></ul> 
 */    
DOM.getDocSize = function(){
	var x = 0,
		y = 0;
	if (docu.compatMode != 'BackCompat') {
		
		if(documentElement.clientWidth && client != 'opera'){
			x = documentElement.clientWidth;
			y = documentElement.clientHeight;
		} else if(client == 'opera') {
			if(parseFloat(version) < 9.5){
				x = body.clientWidth;
				y = body.clientHeight;
			} else {
				x = documentElement.clientWidth;
				y = documentElement.clientHeight;
			}
		} 
		
		if ((client == 'safari') || (client == 'konqueror')){
			y = window.innerHeight; 
		}
	} else {
		x = body.clientWidth;
		y = body.clientHeight;
	}
	
	return {width:x,height:y};
};

/**
 * vrací polohu "obj" ve stránce nebo uvnitř objektu který předám jako druhý 
 * argument
 * @param {object} obj HTML element, jehož pozici chci zjistit
 * @param {object} [ref] <strong>volitelný</strong> HTML element, vůči kterému chci zjistit pozici <em>obj</em>, element musí být jeho rodič
 * @param {bool} fixed <strong>volitelný</strong> flag, má-li se brát ohled na "fixed" prvky
 * @returns {object} s vlastnostmi :
 * <ul><li><em>left</em>(px) - horizontální pozice prvku</li><li><em>top</em>(px) - vertikální pozice prvku</li></ul> 
 */
DOM.getBoxPosition = function(obj, ref){
	var refBox = ref || obj.ownerDocument.body,
		top = 0,
		left = 0,
		de,
		box,
		scroll;
	
	if (obj.getBoundingClientRect && !ref) { /* pro IE a absolutni zjisteni se da pouzit tenhle trik od eltona: */
		de = docu.documentElement;
		box = obj.getBoundingClientRect();
		scroll = DOM.getBoxScroll(obj);
		return {left:box.left+scroll.x-de.clientLeft, top:box.top+scroll.y-de.clientTop};
	}

	while (obj && obj != refBox) {
		top += obj.offsetTop;
		left += obj.offsetLeft;

		/*pro FF2, safari a chrome, pokud narazime na fixed element, musime se u nej zastavit a pripocitat odscrolovani, ostatni prohlizece to delaji sami*/
		if ((client == 'gecko' && version < 3) || client == 'safari') {
			if (DOM.getStyle(obj, 'position') == 'fixed') {
				scroll = DOM.getScrollPos();
				top += scroll.y;
				left += scroll.x;
				break;
			}
		}

		obj = obj.offsetParent;
	}
	return {top:top,left:left};
}

/*
	Par noticek k výpočtům odscrollovaní:
	- rodič body je html (documentElement), rodič html je document
	- v strict mode má scroll okna nastavené html
	- v quirks mode má scroll okna nastavené body
	- opera dává vždy do obou dvou
	- safari dává vždy jen do body
*/

/**
 * vrací polohu "obj" v okně nebo uvnitř objektu který předáme jako druhý 
 * argument, zahrnuje i potencialni odskrolovani kdekoliv nad objektem 
 *	Par noticek k výpočtům odscrollovaní:<ul>
 *	<li>rodič body je html (documentElement), rodič html je document</li>
 *	<li>v strict mode má scroll okna nastavené html</li>
 *	<li>v quirks mode má scroll okna nastavené body</li>
 *	<li>opera dává vždy do obou dvou</li>
 *	<li>safari dává vždy jen do body </li></ul>
 * @param {object} obj HTML elmenet, jehož pozici chci zjistit
 * @param {object} parent <strong>volitelný</strong> HTML element, vůči kterému chci zjistit pozici <em>obj</em>, element musí být jeho rodič
 * @param {bool} fixed <strong>volitelný</strong> flag, má-li se brát ohled na "fixed" prvky
 * @returns {object} s vlastnostmi :
 * <ul><li><em>left</em>(px) - horizontalní pozice prvku</li><li><em>top</em>(px) - vertikální pozice prvku</li></ul> 
 */
 DOM.getPortBoxPosition = function(obj, parent, fixed) {
	var pos = DOM.getBoxPosition(obj, parent, fixed),
		scroll = DOM.getBoxScroll(obj, parent, fixed);
	pos.left -= scroll.x;
	pos.top -= scroll.y;
	return {left:pos.left,top:pos.top};
}

/**
 * vrací dvojici čísel, o kolik je "obj" odscrollovaný vůči oknu nebo vůči zadanému rodičovskému objektu
 * @param {object} obj HTML elmenet, jehož odskrolovaní chci zjistit
 * @param {object} ref <strong>volitelný</strong> HTML element, vůči kterému chci zjistit odskrolování <em>obj</em>, element musí být jeho rodič
 * @param {bool} fixed <strong>volitelný</strong> flag, má-li se brát ohled na "fixed" prvky
 * @returns {object} s vlastnostmi :
 * <ul><li><em>left</em>(px) - horizontální scroll prvku</li><li><em>top</em>(px) - vertikální scroll prvku</li></ul> 
 */
DOM.getBoxScroll = function(obj, ref, fixed) {
	var x = 0,
		y = 0,
		cur = obj.parentNode,
		limit = ref || obj.ownerDocument.documentElement,
		fix = false,
		opera =  client == "opera",
		opera95 = opera && version < 9.5;
	while (1) {
		/* opera debil obcas nastavi scrollTop = offsetTop, aniz by bylo odscrollovano */
		if (opera && DOM.getStyle(cur,"display") != "block") {
			cur = cur.parentNode;
			continue; 
		}
		
		/* a taky stara opera (<9.5) pocita scrollTop jak pro <body>, tak pro <html> - takze <body> preskocime */
		if (opera95 && cur == body) {
			cur = cur.parentNode;
			continue; 
		}
		
		if (fixed && DOM.getStyle(cur, "position") == "fixed") { fix = true; }
		
		if (!fix) {
			x += cur.scrollLeft;
			y += cur.scrollTop;
		}
		
		if (cur == limit) { break; }
		cur = cur.parentNode;
		if (!cur) { break; }
	}
	return {x:x,y:y};
}

/**
 * vrací aktuální odskrolování stránky
 * @returns {object} s vlastnostmi:
 * <ul><li><em>x</em>(px) - horizontální odskrolování</li><li><em>y</em>(px) - vertikální odskrolování</li></ul> 
 */
DOM.getScrollPos = function(){
	if (documentElement.scrollTop || documentElement.scrollLeft) {
		var ox = documentElement.scrollLeft;
		var oy = documentElement.scrollTop;
	} else if (body.scrollTop || body.scrollLeft) {
		var ox = body.scrollLeft;
		var oy = body.scrollTop;
	} else {
		var ox = 0;
		var oy = 0;
	}
	return {x:ox,y:oy};
}

/**
 * vraci současnou hodnotu nějaké css vlastnosti
 * @param {object} elm HTML elmenet, jehož vlasnost nás zajímá
 * @param {string} property řetězec s názvem vlastnosti ("border","backgroundColor",...)
 */
DOM.getStyle = function(elm, property) {
	if (docu.defaultView && docu.defaultView.getComputedStyle) {
		var cs = elm.ownerDocument.defaultView.getComputedStyle(elm,'');
		if (!cs) { return false; }
		return cs[property];
	} else {
		return elm.currentStyle[property];
	}
}

/**
 * nastavuje objektu konkretni styly, ktere jsou zadany v objektu pojmenovanych vlastnosti (nazev_CSS : hodnota)
 * @param {object} elm HTML element, jehož vlastnosti měním
 * @param {object} style objekt nastavovaných vlastností, např.: {color: 'red', backgroundColor: 'white'}
 */
DOM.setStyle = function(elm, style) {
	for (var name in style) {
		elm.style[name] = style[name];
	}
}

/**
 * Přidá do dokumentu zadaný CSS řetězec
 * @param {string} css Kus CSS deklarací
 * @returns {node} vyrobený prvek
 */
DOM.writeStyle = function(css) {
	var node = JAK.mel("style", {type:"text/css"}),
		head = docu.getElementsByTagName("head");
	if (node.styleSheet) { /* ie */
		node.styleSheet.cssText = css;
	} else { /* non-ie */
		node.appendChild(JAK.ctext(css));
	}

	if (head.length) {
		head = head[0];
	} else {
		head = JAK.cel("head");
		documentElement.appendChild(head, body);
	}
	head.appendChild(node);
	return node;
}

/**
 * skrývá elementy které se mohou objevit v nejvyšší vrstvě a překrýt obsah,
 * resp. nelze je překrýt dalším obsahem (typicky &lt;SELECT&gt; v internet exploreru)
 * @param {object | string} HTML element nebo jeho ID pod kterým chceme skrývat problematické prvky
 * @param {Array} elements pole obsahující názvy problematických elementů
 * @param {string} action akce kterou chceme provést 'hide' pro skrytí 'show' nebo cokoli jiného než hide pro zobrazení
 * @examples 
 *  <pre>
 * JAK.DOM.elementsHider(JAK.gel('test'),['select'],'hide')
 * JAK.DOM.elementsHider(JAK.gel('test'),['select'],'show')
 *</pre>   									
 *
 */     
DOM.elementsHider = function(obj, elements, action) {
	var elems = elements || ["select","object","embed","iframe"],
		hidden = arguments.callee.hidden,
		box,
		e,
		elm,
		f,
		node;
	

	/* nejprve zobrazit vsechny jiz skryte */
	if (hidden) {
		hidden.forEach(function(node){
			node.style.visibility = "visible";
		});
		arguments.callee.hidden = [];
	}
	
	function verifyParent(node) {
		var ok = false,
			cur = node;
		while (cur.parentNode && cur != docu) {
			if (cur == obj) { ok = true; }
			cur = cur.parentNode;
		}
		return ok;
	}
	
	if (action == "hide") { /* budeme schovavat */
		if (typeof obj == 'string') { obj = JAK.gel(obj); }
		hidden = [];
		box = this.getBoxPosition(obj);
		
		box.width =  obj.offsetWidth + box.left;
		box.height = obj.offsetHeight +box.top;	
		for (e = 0; e < elems.length; ++e) { /* pro kazdy typ uzlu */
			elm = docu.getElementsByTagName(elems[e]);
			for (f = 0; f < elm.length; ++f) { /* vsechny uzly daneho typu */
				node = this.getBoxPosition(elm[f]);
				if (verifyParent(elm[f])) { continue; } /* pokud jsou v kontejneru, pod kterym schovavame, tak fakof */
				node.width = elm[f].offsetWidth + node.left;
				node.height = elm[f].offsetHeight + node.top;
				
				if (!((box.left> node.width) || (box.width < node.left) || (box.top > node.height) || (box.height < node.top))) {
					elm[f].style.visibility = 'hidden';
					hidden.push(elm[f]);
				}
			}
		}
		arguments.callee.hidden = hidden;
	}
}

/**
 * Vrátí kolekci elementů, které mají nadefinovanou třídu <em>searchClass</em>
 * @param {string} searchClass vyhledávaná třída
 * @param {object} node element dokumentu, ve kterém se má hledat, je-li null prohledává
 * se celý dokument 
 * @param {string} tag název tagu na který se má hledání omezit, je-li null prohledávají se všechny elementy
 * @returns {array} pole které obsahuje všechny nalezené elementy, které mají definovanou třídu <em>searchClass</em>
 */      
DOM.getElementsByClass = function(searchClass,node,tag) {
	var elm;
	if (docu.getElementsByClassName && !tag) { /* kde lze, uplatnime nativni metodu */
		elm = node || docu;
		return DOM.arrayFromCollection(elm.getElementsByClassName(searchClass));
	}

	if (docu.querySelectorAll && !tag) { /* kde lze, uplatnime nativni metodu */
		elm = node || docu;
		return DOM.arrayFromCollection(elm.querySelectorAll("."+searchClass));
	}

	var classElements = [],
		node = node || docu,
		tag = tag || "*",
		els = node.getElementsByTagName(tag),
		elsLen = els.length,
		pattern = new RegExp("(^|\\s)"+searchClass+"(\\s|$)"),
		i;

	for (i = 0, j = 0; i < elsLen; i++) {
		if (pattern.test(els[i].className)) {
			classElements[j] = els[i];
			j++;
		}
	}
	return classElements;
}

/**
 * Převede html kolekci, kterou vrací např. document.getElementsByTagName, na pole, které lze
 * lépe procházet a není "živé" (z které se při procházení můžou ztrácet prvky zásahem jiného skriptu)
 * @param {HTMLCollection} col
 * @return {array}   
 */ 
DOM.arrayFromCollection = function(col) {
	var result = [],
		i;
	try {
		result = Array.prototype.slice.call(col);
	} catch(e) {
		for (i = 0; i < col.length; i++) { result.push(col[i]); }
	} finally {
		return result;
	}
}

/**
 * Rozdělí kus HTML kódu na ne-javascriptovou a javascriptovou část. Chceme-li pak
 * simulovat vykonání kódu prohlížečem, první část vyinnerHTMLíme a druhou vyevalíme.
 * @param {string} str HTML kód
 * @returns {string[]} pole se dvěma položkami - čistým HTML a čistým JS
 */
DOM.separateCode = function(str) {
    var js = [],
        out = {},
        s = str.replace(/<script.*?>([\s\S]*?)<\/script>/g, function(tag, code) {
			js.push(code);
			return "";
		});
    return [s, js.join("\n")];
}

/**
 * Spočítá, o kolik je nutno posunout prvek tak, aby byl vidět v průhledu.
 * @param {node} box
 * @returns {int[]}
 */
DOM.shiftBox = function(box) {
	var dx = 0,
		dy = 0,
		/* soucasne souradnice vuci pruhledu */
		pos = DOM.getBoxPosition(box),
		scroll = DOM.getScrollPos(),
		port = DOM.getDocSize(),
		w = box.offsetWidth,
		h = box.offsetHeight,
		diff;

	pos.left -= scroll.x;
	pos.top -= scroll.y;

	/* dolni okraj */
	diff = pos.top + h - port.height;
	if (diff > 0) {
		pos.top -= diff;
		dy -= diff;
	}

	/* pravy okraj */
	diff = pos.left + w - port.width;
	if (diff > 0) {
		pos.left -= diff;
		dx -= diff;
	}
	
	/* horni okraj */
	diff = pos.top;
	if (diff < 0) {
		pos.top -= diff;
		dy -= diff;
	}

	/* levy okraj */
	diff = pos.left;
	if (diff < 0) {
		pos.left -= diff;
		dx -= diff;
	}
	
	return [dx, dy];
}

/**
 * Zjistí jakou šířku má scrollbar v použitém prohlížeci/grafickém prostředí
 * @returns {int}
 */ 
DOM.scrollbarWidth = function() {
    var div = JAK.mel('div', false, {width: '50px', height: '50px', overflow: 'hidden', position: 'absolute', left: '-200px'}),
        innerDiv = JAK.mel('div', false, {height: '100px'}),
		getStyle = DOM.getStyle,
		w1,
		w2;
    div.appendChild(innerDiv);
    // Append our div, do our calculation and then remove it
    body.insertBefore(div, body.firstChild);
    w1 = div.clientWidth + parseInt(getStyle(div,'paddingLeft')) + parseInt(getStyle(div,'paddingRight'));
    DOM.setStyle(div, {overflowY: 'scroll'});
    w2 = div.clientWidth + parseInt(getStyle(div,'paddingLeft')) + parseInt(getStyle(div,'paddingRight'));
    body.removeChild(div);

    return (w1 - w2);
}

/**
 * Vrátí rodiče zadaného uzlu, vyhovujícího CSS selektoru
 * @param {node} node
 * @param {string} selector
 */
DOM.findParent = function(node, selector) {
	/* pokud je prazdny nebo nezadany, dostaneme prazdne pole omezujicich podminek -- a vratime prvniho rodice */
	var parts = (selector || "").match(/[#.]?[a-z0-9]+/g) || [],
		n = node.parentNode,
		ok,
		i,
		part;
	while (n && n != docu) {
		ok = true;
		for (i = 0; i < parts.length; i++) {
			part = parts[i];
			switch (part.charAt(0)) {
				case "#":
					if (n.id != part.substring(1)) { ok = false; }
				break;
				case ".":
					if (!JAK.DOM.hasClass(n, part.substring(1))) { ok = false; }
				break;
				default:
					if (n.nodeName.toLowerCase() != part.toLowerCase()) { ok = false; }
				break;
			}
		}
		if (ok) { return n; }
		n = n.parentNode;
	}
	return null;
}

}());