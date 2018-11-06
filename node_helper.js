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
		const config = require(configPath)
		const pageConfig = {};
		let exclusions = [];
		// There are two options when defining pages and locations.
		// If the pages are explicitly defined then that definition is used. 
		// If they are not, then the config for each module is searched to find the pages key
		if(config.hasOwnProperty("pages")){
			// Currently Not Functional
			// TODO: Make this work with the new id system
			/*const pages = config.pages;
			page_names = Object.keys(pages)
			page_names.forEach((page, index) => {
				pageConfig[page] = []
				modules = Object.keys(pages[page])
				modules.forEach(name => {
					pageConfig[page].push({
						"module": name,
						"position": pages[page][name],
					})
				})
			})
			if(config.hasOwnProperty("exclusions")){
				exclusions = config.exclusions
			}*/
		}else{
			const modules = config.modules;
			const pageList = [];

			modules.forEach((module, index) => {
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
							"position": pages[page],
							"identifier": `module_${index}_${name}`
						})
					})
				}else if(typeof pages === "string"){
					if(pages.toLowerCase() === "all"){
						exclusions.push(`module_${index}_${name}`);
					}
				}
			});
		}
		console.log("Sending config to page selector");
		self.sendSocketNotification("SET_PAGE_CONFIG", pageConfig);
		self.sendSocketNotification("SET_EXCLUSIONS_CONFIG", exclusions);
	}
})
