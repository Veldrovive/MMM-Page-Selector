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
	},

	getStyles: function () {
		return [
			"MMM-Page-Selector.css",
		];
	},

	getScripts: function() {
		return[
			this.file("resources/find.js"),
			this.file("resources/numConvert.js"),
		]
	},

	getDom: function() {
		var wrapper = document.createElement("div");
		wrapper.className += "page-title"
		//If the module is configured to show a title, display it... easy enough
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
				console.log("Setting page to",pages[0]);
				self.page = pages[0];
			}
			self.setUpPage(self.page);
		}
	},

	getModuleRef: function(module){
		var moduleRef = document.getElementById(module.data.identifier);
		return moduleRef;
	},

	moveRefToLoc: function(ref, loc){
		const self = this;
		function insertAfter(newNode, referenceNode) {
		    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
		}

		//Defines where modules will be with a map between the position string and the css class
		var locations = {
			"top_bar": "region top bar",
			"top_left": "region top left",
			"top_center": "region top center",
			"top_right": "region top right",
			"upper_third": "region upper third",
			"middle_center": "region middle center",
			"lower_third": "region lower third",
			"bottom_left": "region bottom left",
			"bottom_center": "region bottom center",
			"bottom_right": "region bottom right",
			"bottom_bar": "region bottom bar",
			"fullscreen_above": "region fullscreen above",
			"fullscreen_below": "region fullscreen below",
		}

		//Search for the correct container to append the module into
		var moveToRef = document.getElementsByClassName(locations[loc])[0];
		if(moveToRef === undefined){
			console.error("Incorrect Position string for module:", ref);
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
			console.log(self.id)
			insertAfter(ref, document.getElementById(self.id))
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

			//Code for moving and changing visibility for certain modules
			var modules = MM.getModules();
			modules.enumerate(module => {
				if(module.name !== self.name){
					if(self.neverHide.indexOf(module.data.identifier) === -1){
						module.hide(500, { lockString: self.identifier });
					}
					setTimeout(() => {
						if(findIndex(page, {identifier: module.data.identifier}) === -1 && self.neverHide.indexOf(module.data.identifier) === -1){
							//If the module is not in the page object and it is not included in the neverHide object, hide it
							module.hide(500, { lockString: self.identifier });
						}else if(self.neverHide.indexOf(module.data.identifier) === -1){
							//If the module is in the page object and is not included the neverHide object, move it to the correct location
							self.moveRefToLoc(self.getModuleRef(module), page[findIndex(page, {identifier: module.data.identifier})].position);
							module.show(500, { lockString: self.identifier });
						}else{
							module.show(0, { lockString: self.identifier });
						}
					}, 500)
				}else{
					module.show(0, { lockString: self.identifier });
				}
			});
		}
	},

	//If an external module wants to change the page, it sends a notification to PAGE_SELECT with the payload as the page name
	//if the payload is an integer, the index of the page is selected
	notificationReceived: function(notification, payload, sender) {
		const self = this;
		console.log("Notification:",notification, payload, sender)

		function incrementPage(){
			const pageArray = Object.keys(self.pages);
			const currentPage = pageArray.indexOf(self.page);
			const nextPage = currentPage+1 > pageArray.length-1 ? 0 : currentPage+1;
			self.sendSocketNotification("RELAY_PAGE_SELECT", pageArray[nextPage]);
		}

		function decrementPage(){
			const pageArray = Object.keys(self.pages);
			const currentPage = pageArray.indexOf(self.page);
			const nextPage = currentPage-1 < 0 ? pageArray.length-1 : currentPage-1;
			self.sendSocketNotification("RELAY_PAGE_SELECT", pageArray[nextPage]);
		}

		function selectPage(info){
			const payloadToNum = WtoN.convert(info);
			console.log("SELECTING PAGE:",payloadToNum)
			if(isNaN(payloadToNum)){
				self.sendSocketNotification("RELAY_PAGE_SELECT", info);
			}else{
				const key = Object.keys(self.pages)[payloadToNum];
				if(key !== undefined){
					self.sendSocketNotification("RELAY_PAGE_SELECT", key);
				}else{
					Log.log("Tried to navigate to a non-existant page:",payloadToNum, key);
				}
			}
		}

		if(self.selectPageNotif.includes(notification)){
			selectPage(payload);
		}else if(self.incrementPageNotif.includes(notification)){
			incrementPage();
		}else if(self.decrementPageNotif.includes(notification)){
			decrementPage();
		}else if(notification === "MODULE_DOM_CREATED"){
			const modules = MM.getModules();
			modules.enumerate(module => {
				if(module.name === self.name){
					self.id = module.data.identifier
				}
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
			self.exclusionsLoaded = true;
			self.init();
		}else if(notification === 'PAGE_SELECT'){
			self.setUpPage(payload);
		}
	},

	titleCase: function (str) {
		return str.toLowerCase().split(' ').map(function(word) {
			return word.replace(word[0], word[0].toUpperCase());
		}).join(' ');
	}

})
