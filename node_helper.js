const NodeHelper = require("node_helper");

module.exports = NodeHelper.create({
	start: function(){
		this.createRoutes(this);
	},

	//Page can also be changed externally by calling to the /selectPage endpoint
	createRoutes: function(self) {
		self.expressApp.get("/selectPage/:pageId", (req, res) => {
			self.sendSocketNotification("PAGE_SELECT", req.params.pageId.toLowerCase());
			res.send(`Updating page to ${req.params.pageId.toLowerCase()}`);
		});
	},

	sendPageChange: function(self, pageId) {
		self.sendSocketNotification("PAGE_SELECT", pageId.toLowerCase());
	},

	socketNotificationReceived: function(notification, payload) {
		if(notification === "RELAY_PAGE_SELECT"){
			this.sendPageChange(this, payload);
		}
	},
})
