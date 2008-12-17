/*
Licencováno pod MIT Licencí

© 2008 Seznam.cz, a.s.

Tímto se uděluje bezúplatná nevýhradní licence k oprávnění užívat Software,
časově i místně neomezená, v souladu s příslušnými ustanoveními autorského zákona.

Nabyvatel/uživatel, který obdržel kopii tohoto softwaru a další přidružené 
soubory (dále jen „software“) je oprávněn k nakládání se softwarem bez 
jakýchkoli omezení, včetně bez omezení práva software užívat, pořizovat si 
z něj kopie, měnit, sloučit, šířit, poskytovat zcela nebo zčásti třetí osobě 
(podlicence) či prodávat jeho kopie, za následujících podmínek:

- výše uvedené licenční ujednání musí být uvedeno na všech kopiích nebo 
podstatných součástech Softwaru.

- software je poskytován tak jak stojí a leží, tzn. autor neodpovídá 
za jeho vady, jakož i možné následky, ledaže věc nemá vlastnost, o níž autor 
prohlásí, že ji má, nebo kterou si nabyvatel/uživatel výslovně vymínil.



Licenced under the MIT License

Copyright (c) 2008 Seznam.cz, a.s.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

/**
 * @overview reorder
 * @version 1.0
 * @author zara
 * @class Mnozina prohazovacich prvku, ktere se drag'n'drop daji radit
 * @group jak-widgets
 */   
SZN.Reorder = SZN.ClassMaker.makeClass({
	NAME: "Reorder",
	VERSION: "1.0",
	CLASS: "class"
});

/**
 * @param {Node || String} container id nebo reference kontejneru, obsahujiciho prohazovaci prvky
 * @param {Object} optObj asociativni pole parametru, muze obsahovat tyto hodnoty:
 *	 <ul>
 *		<li><em>handleClass</em> - css trida k elementu, za ktery se ma chytat. Pokud je false (default), taha se za cely node</li>
 *   <ul>
 * @param {Object} callbackObj objekt, jehoz metoda bude volana po zmene poradi
 * @param {String} callbackMethod nazev metody, ktera bude volana po zmene poradi. Jedinym parametrem bude nove pole indexu.
 */
SZN.Reorder.prototype.$constructor = function(container, optObj, callbackObj, callbackMethod) {
	this.ec = [];
	this.items = [];
	
	this.options = {
		handleClass:false,
		direction:"xy",
		ghostProcess:false
	}
	for (var p in optObj) { this.options[p] = optObj[p]; }
	
	this.dom = {
		container:SZN.gEl(container),
		ghost:false
	};
	
	this.itemDragged = false; /* currently dragged */
	this.itemAbove = false; /* active */
	this.callbackObj = callbackObj;
	this.callbackMethod = callbackMethod;
	
	this.appended = false;
	this.dragging = false;

	var children = this.dom.container.childNodes;
	for (var i=0;i<children.length;i++) {
		var node = children[i];
		if (node.nodeType == 1) { 
			var item = new SZN.ReorderBox(this,node);
			this.items.push(item);
		}
	}
	
	this.ec.push(SZN.Events.addListener(document,"mousemove",this,"_mouseMove",false,true));
	this.ec.push(SZN.Events.addListener(document,"mouseup",this,"_mouseUp",false,true));
}

/**
 * @method Explicitni desktruktor. Odvesi udalosti a maze vsechny vlastnosti.
 */
SZN.Reorder.prototype.$destructor = function() {
	for (var i=0;i<this.items.length;i++) {
		this.items[i].$destructor();
	}
	for (var i=0;i<this.ec.length;i++) {
		SZN.Events.removeListener(this.ec[i]);
	}
	for (var p in this) { this[p] = null; }
}

SZN.Reorder.prototype._startDrag = function(item, e, elm) {
	if (this.dragging) { return; }
	this.itemDragged = item;
	this.itemAbove = false;
	this.dom.ghost = item.dom.container.cloneNode(true);
	var pos = SZN.Dom.getFullBoxPosition(item.dom.container);
	var scroll = SZN.Dom.getScrollPos();
	if (this.options.ghostProcess) {
		this.dom.ghost = this.options.ghostProcess(this.dom.ghost);
	}
	this.dom.ghost.style.position = "absolute";
	var x = pos.left+scroll.x;
	var y = pos.top+scroll.y;
	this.dom.ghost.style.left = x+"px";
	this.dom.ghost.style.top = y+"px";
	this.dom.ghost.style.opacity = "0.5";
	SZN.Dom.addClass(this.dom.ghost,"reorder-dragged");
	if (SZN.Browser.klient == "ie") {
		this.dom.ghost.style.filter = "alpha(opacity=50)";
	}
	
	this.ghostX = x;
	this.ghostY = y;
	this.clientX = e.clientX;
	this.clientY = e.clientY;
	this.dragging = true;
}

SZN.Reorder.prototype._mouseMove = function(e, elm) {
	if (!this.dragging) { return; }
	SZN.Events.cancelDef(e);
	if (!this.appended) { /* append ghost */
		this.appended = true;
		document.body.appendChild(this.dom.ghost);
	}
	
	var nx = e.clientX;
	var ny = e.clientY;
	var dx = nx - this.clientX;
	var dy = ny - this.clientY;
	
	var g = this.dom.ghost;

	/* move ghost */
	if (this.options.direction.indexOf("x") != -1) { 
		this.ghostX += dx;
		g.style.left = this.ghostX+"px";
	}
	if (this.options.direction.indexOf("y") != -1) { 
		this.ghostY += dy;
		g.style.top = this.ghostY+"px"; 
	}
	
	this.clientX = nx;
	this.clientY = ny;

	/* test position */
	var above = this._getAbove();
	
	if (!above || above != this.itemAbove) { /* remove active */
		if (this.itemAbove) { 
			this.itemAbove._removeActive(); 
			this.itemAbove = false;
		}
	}
	if (above && above != this.itemAbove) {
		above._addActive();
		this.itemAbove = above;
	}
	
}

SZN.Reorder.prototype._getAbove = function() {
	var x = this.ghostX + this.dom.ghost.offsetWidth/2;
	var y = this.ghostY + this.dom.ghost.offsetHeight/2;
	
	var scroll = SZN.Dom.getScrollPos();
	for (var i=0;i<this.items.length;i++) {
		var item = this.items[i];
		var pos = SZN.Dom.getFullBoxPosition(item.dom.container);
		pos.left += scroll.x;
		pos.top += scroll.y;
		var w = item.dom.container.offsetWidth;
		var h = item.dom.container.offsetHeight;
		var ok_x = true;
		var ok_y = true;
		if (this.options.direction.indexOf("x") != -1) { ok_x = x >= pos.left && x <= pos.left+w; }
		if (this.options.direction.indexOf("y") != -1) { ok_y = y >= pos.top && y <= pos.top+h; }
		if (ok_x && ok_y) { return item; }
	}
	return false;
}

SZN.Reorder.prototype._mouseUp = function(e, elm) {
	if (!this.dragging) { return; }
	this.dragging = false;
	if (this.itemAbove) { this.itemAbove._removeActive(); }
	if (!this.dom.ghost || !this.dom.ghost.parentNode) { return; }
	this.dom.ghost.parentNode.removeChild(this.dom.ghost);
	this.appended = false;
	
	if (!this.itemAbove || this.itemAbove == this.itemDragged) { return; } /* no repositioning */
	
	var dragId = -1;
	var aboveId = -1;
	var arr = [];
	for (var i=0;i<this.items.length;i++) {
		arr.push(i);
		var item = this.items[i];
		if (item == this.itemDragged) { dragId = i; }
		if (item == this.itemAbove) { aboveId = i; }
	}
	var target = false;
	arr.splice(dragId,1);
	arr.splice(aboveId,0,dragId);
	this.items.splice(dragId,1);
	this.items.splice(aboveId,0,this.itemDragged);
	if (dragId > aboveId) { /* backward */
		target = this.itemAbove.dom.container;
	} else { /* forward */
		target = this.itemAbove.dom.container.nextSibling;
	}
	this.dom.container.insertBefore(this.itemDragged.dom.container, target);

	if (this.callbackObj && this.callbackMethod) {
		this.callbackObj[this.callbackMethod](arr);
	}
}

/* ------------------------------------------------------------- */

/**
 * @class SZN.ReorderBox
 * @group jak-widgets
 * @private
 */
SZN.ReorderBox = SZN.ClassMaker.makeClass({
	NAME: "Reorder",
	VERSION: "1.0",
	CLASS: "class"
});
SZN.ReorderBox.prototype.$constructor = function(owner, container) {
	this.owner = owner;
	this.dom = {
		container:container
	}
	this.ec = [];
	var handle = this.dom.container;
	if (this.owner.options.handleClass) {
		var c = this.owner.options.handleClass;
		var all = this.dom.container.getElementsByTagName("*");
		for (var i=0;i<all.length;i++) {
			if (SZN.Dom.hasClass(all[i],c)) { handle = all[i]; }
		}
	}
	this.ec.push(SZN.Events.addListener(handle,"mousedown",this,"_mouseDown",false,true));
}

SZN.ReorderBox.prototype.$destructor = function() {
	for (var i=0;i<this.ec.length;i++) {
		SZN.Events.removeListener(this.ec[i]);
	}
	for (var p in this) { this[p] = null; }
}

SZN.ReorderBox.prototype._mouseDown = function(e, elm) {
	SZN.Events.cancelDef(e);
	SZN.Events.stopEvent(e);
	this.owner._startDrag(this, e, elm);
}

SZN.ReorderBox.prototype._addActive = function() {
	SZN.Dom.addClass(this.dom.container,"reorder-active");
}

SZN.ReorderBox.prototype._removeActive = function() {
	SZN.Dom.removeClass(this.dom.container,"reorder-active");
}
