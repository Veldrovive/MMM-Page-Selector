const NodeHelper = require("node_helper");
const path = require("path");

module.exports = NodeHelper.create({
	start: function(){
		this.createRoutes(this);
	},

	//Page can also be changed externally by calling to the /selectPage endpoint
	createRoutes: function() {
		const self = this;

		self.expressApp.get("/selectPage/:pageId", (req, res) => {
			self.sendSocketNotification("PAGE_SELECT", req.params.pageId.toLowerCase());
			res.send(`Updating page to ${req.params.pageId.toLowerCase()}`);
		});
	},

	sendPageChange: function(pageId) {
		const self = this;

		self.sendSocketNotification("PAGE_SELECT", pageId.toLowerCase());
	},

	socketNotificationReceived: function(notification, payload) {
		const self = this;

		if(notification === "RELAY_PAGE_SELECT"){
			self.sendPageChange(payload);
		}else if(notification === "UPDATE_PAGES"){
			self.getModulePages();
		}
	},

	getModulePages: function(){
		const self = this;

		const configPath = path.join(__dirname, "../..", "config/config.js");
		const modules = require(configPath).modules;

		const pageList = [];
		const pageConfig = {};
		const exlusions = [];

		modules.forEach(module => {
			const name = module.module;
			const pages = module.pages;

			if(typeof pages === "object"){
				const modulePages = Object.keys(pages);
				modulePages.forEach(page => {
					if(pageList.indexOf(page) === -1){
						pageList.push(page);
						pageConfig[page] = [];
					}
					pageConfig[page].push({
						"module": name,
						"position": pages[page]
					})
				})
			}else if(typeof pages === "string"){
				if(pages.toLowerCase() === "all"){
					exlusions.push(name);
				}
			}
		});
		console.log("Sending config to selector");
		self.sendSocketNotification("SET_PAGE_CONFIG", pageConfig);
		self.sendSocketNotification("SET_EXCLUSIONS_CONFIG", exlusions);
	}
})
