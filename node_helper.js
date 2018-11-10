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

	socketNotificationReceived: function(notification, payload) {
		const self = this;
		if(notification === "UPDATE_PAGES"){
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
			const pages = config.pages;
			const modules = config.modules;
			const pageNames = Object.keys(pages);

			pageNames.forEach(page_name => {
				const used_ids = [];
				pageConfig[page_name.toLowerCase()] = [];
				const page = pages[page_name];
				const page_module_names = Object.keys(page);
				const page_store = {};

				modules.forEach((module, index) => {
					const module_name = module.module;
					const name = module.name;
					const id = `module_${index}_${module_name}`;
					if(page_module_names.includes(module_name)){
						page_store[id] = page[module_name]
					}
					if(name !== undefined && page_module_names.includes(name)){
						page_store[id] = page[name]
					}
				})
				pagePositions = []
				Object.keys(page_store).forEach(id => {
					pagePositions.push({
						"position": page_store[id],
						"identifier": id
					})
				})
				pageConfig[page_name.toLowerCase()] = pagePositions
			})
			if(config.hasOwnProperty("exclusions")){
				const excluded_names = config.exclusions;
				modules.forEach((module, index) => {
					const module_name = module.module;
					const name = module.name;
					const id = `module_${index}_${module_name}`;

					if(excluded_names.includes(module_name) || excluded_names.includes(name)){
						exclusions.push(id)
					}
				})
			}
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
							pageConfig[page.toLowerCase()] = [];
						}
						pageConfig[page.toLowerCase()].push({
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
		self.sendSocketNotification("SET_PAGE_CONFIG", pageConfig);
		self.sendSocketNotification("SET_EXCLUSIONS_CONFIG", exclusions);
	}
})
