Module.register("MMM-Page-Selector", {

	defaults: {
		page: "",
		displayTitle: true,
		debug: false,
		restoreDefault: -1,

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

	debug: function(message){
		const self = this;

		if(self.config.debug){
			Log.log(message)
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
				defaultPage = typeof self.config.defaultPage === "undefined" ? 0 : self.config.defaultPage;
				self.changePage(defaultPage);
			}
		}
	},

	getModuleRef: function(module){
		if (module === undefined) {
			Log.error("Failed to find a module in the DOM. This probably means you specified a module in your config that you do not have in your modules folder.");
			return document.createElement("div");
		}
		if(typeof module.data === "undefined"){
			ref = document.getElementById(module.identifier);
		}else{
			ref = document.getElementById(module.data.identifier);
		}

		if(ref === null){
			this.debug("Module was selected, but not found in the DOM. Make sure that a position for the module is set in the config.js!")
			return document.createElement("div")
		}
		return ref;
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
		var containers = Array.from(moveToRef.childNodes);
		var container = containers.filter(node => node.className == "container")[0]
		if(loc === self.data.position){
			insertAfter(ref, self.getModuleRef(self))
		}else{
			container.append(ref);
		}
	},

	removeClasses: function(ref, classes){
		const self = this;

		if(typeof classes === "undefined"){
			classes = Object.keys(self.pages).map(x => `page_${x.replace(" ", "_")}`)
		}
		classes.forEach(page => {
			if(ref.classList.contains(page)){
				ref.classList.remove(page)
			}
		})
	},

	changeClassToPage: function(ref, pageName){
		const self = this;
		pageName = `page_${pageName.replace(" ", "_")}`

		const allPages = Object.keys(self.pages).map(x => `page_${x.replace(" ", "_")}`)
		if(!allPages.includes(pageName)){
			self.debug(`Page class does not match page list. This means that the class, ${pageName}, will never be removed.`);
		}
		self.removeClasses(ref, allPages)
		ref.classList.add(pageName)
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
			self.sendNotification("PAGE_UPDATE", {index: indexOfPage, name: pageName});
			self.sendSocketNotification("WRITE_TEMP", {page: pageName})

			//Code for moving and changing visibility for certain modules
			const neverHideIds = self.neverHide.map(x => x.identifier);
			MM.getModules()
				.enumerate(module => {
					if(!neverHideIds.includes(module.data.identifier)){
						module.hide(500, { lockString: self.identifier });
						self.removeClasses(self.getModuleRef(module))
					}
				})

			const identifiers = page.map(x => x.identifier);
			setTimeout(() => {
				page.forEach((module) => {
					self.moveRefToLoc(module.ref, module.position);
					if (module.mmModule !== undefined) {
						module.mmModule.show(500, { lockString: self.identifier });
					} else {
						Log.error(`Tried to show ${module.identifier} but the module is undefined. Check to make sure this module is installed correctly.`);
					}
				});
				self.positionExclusions();
			}, 500)
		}else{
			Log.error("Tried to navigate to a non-existent page: ",pageName,", navigating to default");
			if(pageName === self.config.defaultPage.toLowerCase()){
				Log.error("Default page does not exist, defaulting to page zero")
				self.changePage(0)
			}else{
				self.changePage(self.config.defaultPage.toLowerCase())
			}
		}
	},

	//Changes to the page given by the {page} parameter. If increment is true, then if page is a number then the page
	//will be incremented by that number. Otherwise it will simply select the page at that index
	changePage: function(page, increment){
		const self = this;
		// Using a custom mod function so that negative numbers work as well
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
			clearTimeout(self.default_timeout);
			if(![Object.keys(self.pages).indexOf(self.config.defaultPage), self.config.defaultPage].includes(payload) && self.config.restoreDefault > 0){
			    self.default_timeout = setTimeout(() => {
			        selectPage(self.config.defaultPage);
			    }, self.config.restoreDefault*1000)
			}
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

	addPageReferences: function(){
		const self = this;
		const pages = Object.keys(self.pages);
		const idModuleMap = {}
		MM.getModules().enumerate((module) => {
			idModuleMap[module.data.identifier] = module
		});

		pages.forEach((page) => {
			_page = self.pages[page];
			_page.forEach((module) => {
				module.mmModule = idModuleMap[module.identifier];
				if (module.mmModule === undefined) {
					Log.error(`${module.identifier} is not loaded correctly. Check that the name is spelled correctly and that you followed the installation instructions.`)
				}
				module.ref = self.getModuleRef(module.mmModule);
			})
		});
	},

	addExclusionReferences: function(){
		const self = this;
		const idModuleMap = {}
		MM.getModules().enumerate((module) => {
			idModuleMap[module.data.identifier] = module
		});

		self.neverHide.forEach((module) => {
			module.mmModule = idModuleMap[module.identifier];
			if (module.mmModule === undefined) {
				Log.error(`${module.identifier} is not loaded correctly. Check that the name is spelled correctly and that you followed the installation instructions.`)
			}
			module.ref = self.getModuleRef(module.mmModule);
		});
	},

	positionExclusions: function(){
		const self = this;
		self.neverHide.forEach((module) => {
			if(module.position.toLowerCase() === "none"){
				if (module.mmModule !== undefined) {
					module.mmModule.hide(0, { lockString: self.identifier });
				} else {
					Log.error(`Tried to hide ${module.identifier} but the module is undefined. Check to make sure this module is installed correctly.`);
				}
			}else{
				if (module.mmModule !== undefined) {
					module.mmModule.show(500, { lockString: self.identifier });
				} else {
					Log.error(`Tried to show ${module.identifier} but the module is undefined. Check to make sure this module is installed correctly.`);
				}
				self.moveRefToLoc(module.ref, module.position);
			}
		})
	},

	//When the helper sends the PAGE_SELECT notification, start setting up the page cooresponding to the payload
	socketNotificationReceived: function(notification, payload){
		const self = this;

		if(notification === "SET_PAGE_CONFIG"){
			self.pages = payload;
			if (!(self.page in self.pages)) {
				self.pages[self.page] = []
			}
			self.pagesLoaded = true;
			self.addPageReferences();
			self.init();
		}else if (notification === "SET_EXCLUSIONS_CONFIG"){
			self.neverHide = payload;
			self.neverHide.push({"identifier": self.identifier, "position": self.data.position });
			self.exclusionsLoaded = true;
			self.addExclusionReferences();
			self.positionExclusions();
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
