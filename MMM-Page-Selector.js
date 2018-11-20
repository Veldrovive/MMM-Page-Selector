Module.register("MMM-Page-Selector", {

	defaults: {
		page: "",
		displayTitle: true,

		selectPageNotif: [],
		incrementPageNotif: [],
		decrementPageNotif: []
	},

	requiresVersion: "2.1.0",

	start: function() {
		this.sendSocketNotification("UPDATE_PAGES");

		this.page = this.config.defaultPage || this.config.page;
		this.displayTitle = this.config.displayTitle;

		this.selectPageNotif = ["PAGE_SELECT", "PAGE_CHANGED"].concat(this.config.selectPageNotif);
		this.incrementPageNotif = ["INCREMENT_PAGE"].concat(this.config.incrementPageNotif);
		this.decrementPageNotif = ["DECREMENT_PAGE"].concat(this.config.decrementPageNotif);

		if(this.config.hasOwnProperty("autoChange")){
			autoChange = this.config.autoChange;
			const methods = Object.keys(autoChange)
			if(methods.includes("interval")){
				this.startChangeInterval(autoChange.interval);
			}
		}
	},

	startChangeInterval: function(interval){
		const self = this;
		console.log("Starting page change interval at",interval,"seconds")
		self.changeInterval = setInterval(() => {
			self.changePage(1, true)
		}, interval*1000)
	},

	getStyles: function () {
		return [
			"MMM-Page-Selector.css",
		];
	},

	getScripts: function() {
		return[
			this.file("resources/numConvert.js"),
		]
	},

	getDom: function() {
		var wrapper = document.createElement("div");
		wrapper.className += "page-title"
		if(this.displayTitle){
			if(this.page !== ''){
				wrapper.innerHTML = `${this.titleCase(this.page)}`;
			}else{
				wrapper.innerHTML = "No Page Selected"
			}
		}

		return wrapper;
	},

	init: function(){
		const self = this;

		if(self.domLoaded && self.pagesLoaded && self.exclusionsLoaded){
			const pages = Object.keys(self.pages)
			self.sendNotification("MAX_PAGES_CHANGED", pages.length);
			if(pages.indexOf(self.page) === -1){
				self.page = pages[0];
			}
			if(self.config.persistentPages){
				self.sendSocketNotification("RESTORE_PAGE")
			}else{
				self.changePage(self.page);
			}
		}
	},

	getModuleRef: function(module){
		ref = document.getElementById(module.data.identifier);
		if(ref === null){
			throw "Module was selected, but not found in the DOM. Make sure that a position for the module is set in the config.js!"
		}
		return document.getElementById(module.data.identifier);
	},

	moveRefToLoc: function(ref, loc){
		const self = this;
		function insertAfter(newNode, referenceNode) {
		    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
		}

		//Search for the correct container to append the module into
		var moveToRef = document.getElementsByClassName(loc.replace("_", " "))[0];
		if(typeof moveToRef === "undefined"){
			Log.error("Incorrect Position string for module:", ref);
			return false;
		}
		var containers = moveToRef.childNodes;
		var container;
		containers.forEach(node => {
			if (node.className == "container") {
				container = node;
			}
		})
		if(loc === "top_bar"){
			insertAfter(ref, self.getModuleRef(self))
		}else{
			container.prepend(ref);
		}
	},

	setUpPage: function(pageName) {
		const self = this;
		var page = self.pages[pageName];

		if(page !== undefined){
			//Set title once the page has been identified
			self.page = pageName;
			self.updateDom(0);

			//Integration with MMM-page-indicator
			const indexOfPage = Object.keys(self.pages).indexOf(pageName);
			self.sendNotification("PAGE_CHANGED", indexOfPage);
			self.sendSocketNotification("WRITE_TEMP", {page: pageName})

			//Code for moving and changing visibility for certain modules
			MM.getModules()
				.enumerate(module => {
					if(!self.neverHide.includes(module.data.identifier)){
						module.hide(500, { lockString: self.identifier });
					}
				})

			const identifiers = page.map(x => x.identifier);
			setTimeout(() => MM.getModules()
				.enumerate(module => {
					if(self.neverHide.includes(module.data.identifier)){
						module.show(0, { lockString: self.identifier })
					}
					if(identifiers.includes(module.data.identifier)){
						const id = module.data.identifier;
						self.moveRefToLoc(self.getModuleRef(module), page[identifiers.indexOf(id)].position);
						module.show(500, { lockString: self.identifier });
					}
				}), 500
			)
		}else{
			Log.error("Tried to navigate to a non-existent page: ",pageName);
		}
	},

	//Changes to the page given by the {page} parameter. If increment is true, then if page is a number then the page
	//will be incremented by that number. Otherwise it will simply select the page at that index
	changePage: function(page, increment){
		const self = this;
		function mod(n, m) {
		  return ((n % m) + m) % m;
		}

		if(typeof page === "number"){
			const pageArray = Object.keys(self.pages);
			if(increment){
				const currentPage = pageArray.indexOf(self.page);
				self.setUpPage(pageArray[mod(currentPage + page, pageArray.length)]);
			}else{
				if(page >= pageArray.length || page < 0){
					Log.error("Page index out of bounds");
				}else{
					self.setUpPage(pageArray[page])
				}
			}
		}else if(typeof page === "string"){
			self.setUpPage(page.toLowerCase().trim());
		}else{
			Log.error("Tried to change to a page that is not a number or a string")
		}
	},

	//If an external module wants to change the page, it sends a notification to PAGE_SELECT with the payload as the page name
	//if the payload is an integer, the index of the page is selected
	notificationReceived: function(notification, payload, sender) {
		const self = this;

		function selectPage(page){
			const payloadToNum = WtoN.convert(page);
			self.changePage(isNaN(payloadToNum) ? page : payloadToNum)
		}

		if(self.selectPageNotif.includes(notification)){
			selectPage(payload);
		}else if(self.incrementPageNotif.includes(notification)){
			self.changePage(1, true)
		}else if(self.decrementPageNotif.includes(notification)){
			self.changePage(-1, true)
		}else if(notification === "MODULE_DOM_CREATED"){
			MM.getModules().enumerate(module => {
				module.hide(0, { lockString: self.identifier });
			})

			self.domLoaded = true;
			self.init();
		}
	},

	//When the helper sends the PAGE_SELECT notification, start setting up the page cooresponding to the payload
	socketNotificationReceived: function(notification, payload){
		const self = this;

		if(notification === "SET_PAGE_CONFIG"){
			self.pages = payload;
			self.pagesLoaded = true;
			self.init();
		}else if (notification === "SET_EXCLUSIONS_CONFIG"){
			self.neverHide = payload;
			self.neverHide.push(self.identifier)
			self.exclusionsLoaded = true;
			self.init();
		}else if(notification === 'PAGE_SELECT'){
			self.changePage(payload);
		}else if(notification === "RESTART_DOM"){
			window.location.reload(false); 
		}
	},

	titleCase: function (str) {
		return str.toLowerCase().split(' ').map(function(word) {
			return word.replace(word[0], word[0].toUpperCase());
		}).join(' ');
	}

})
