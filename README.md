# MMM-Page-Selector
![Demo](https://i.imgur.com/7E7dn4n.gif)<br/>
Page Selector is meant to make it easy to configure the positions and visibility of any module on your [MagicMirror²](https://github.com/MichMich/MagicMirror) on the fly and to make those pages able to be changed from any other module. By default, MMM-Page-Selector works with MMM-page-indicator and MMM-Voice-Commands, but could easily be configured to interact with other modules if the need arose. 

## Installation
Navigate to the modules folder of your Magic Mirror installation.
```bash
cd ~/MagicMirror/modules
```

Clone the repository.
```bash
git clone https://github.com/Veldrovive/MMM-Page-Selector.git
```

## Usage
For all usage, including the standard `position` prop in the module config is allowed, but is not necessary and does not have any effect.

**Very Important Note**: MMM-Page-Selector **must** still have a position prop.
#### There are two options for creating pages. If in doubt, use the first one:
If there are too many pages and using the `page` prop becomes confusing. Switch to the second method. It is slightly more complicated to set up, but is more clear when many modules are at play.
```js
modules[
    ...
    {
        module: "MMM-Page-Selector",
        position: "top_bar",
        config: {
            defaultPage: "pageName",
            displayTitle: true,
        }
    },
  ...
    //Example of the config for a module to be shown on pages: "pageNameOne" and "pageNameTwo"
    {
        module: "MMM-any-other",
        //position: "bottom_center", It is NOT neccesary to have a position prop anymore although having one does not have any effect
        pages: {"pageNameOne": "position_string", "pageNameTwo": "another_position_string"},
        config: {...}
    },
  ...
    //Example of the config for a module to be shown on all pages
    {
        module: "MMM-any-other",
        pages: {"all": "position_string"},
        config: {...}
    }
]
```
Pages are created implicitly when included within a module's `pages` prop.<br/>
For example, specifying `pages: {"main": "bottom_center", "fun": "top_right"}` will create the pages `main` and `fun` then make the module appear at the bottom center on the main page and top right on the fun page.

If `pages` is set to `{"all": "position_string"}`, then the module will always appear in the position defined by the position_string.

Example of a complete config for a very simple mirror (Click [here](https://github.com/Veldrovive/MMM-Page-Selector/issues/3#issuecomment-433203300) for a more complicated example):
```js
modules: [
    {
        module: "MMM-Page-Selector",
        position: "top_center",
        config: {
            defaultPage: "main",
            displayTitle: true,
            selectPageNotif: ["SELECT_PAGE"],
            incrementPageNotif: ["PAGE_UP"],
            decrementPageNotif: ["PAGE_DOWN"],
	    persistentPages: true,
	    autoChange: {
	    	interval: 100
	    }
        }
    },
    {
        module: "MMM-Weather-Now",
        pages: {main: "top_right", weather: "bottom_left"}
    },
    {
        module: "MMM-page-indicator",
        pages: {"all": "bottom_bar"}
    }
]
```
The configuration for `MMM-Page-Selector` will:
* `position`: Make the title of the page appear at the top_center position.
* `defaultPage`: Display the page with the name of "main" on startup.
* `displayTitle`: Display the page name at the defined position since it is true.

* `selectPageNotif`: Sending a notification to "SELECT_PAGE" will now set the page to the payload. By default, this already includes "PAGE_SELECT" and "PAGE_CHANGED".

* `incrementPageNotif`: Sending a notification to "PAGE_UP" will now increment the page. By default, this already includes "INCREMENT_PAGE".

* `decrementPageNotif`: Sending a notification to "PAGE_DOWN" will now decrement the page. By default, this already includes "DECREMENT_PAGE".

* `persistentPages`: If set to true, the current page you are on will persist even through restarts.

* `autoChange`: Used for automatically changing the page.
  * `interval`: Changes the page automatically every certain amount of time. In this case, the next page will be displayed every 100 seconds.

The configuration for `MMM-Weather-Now` will:
* `pages`: Each key defines a page and each value defines the position on that page. This means that `MMM-Weather-Now` will be rendered at the top right when on the "main" page and on the bottom left when on the "weather" page.

The configuration for `MMM-page-indicator` will:
* `pages`: Means that regardless of the page, `MMM-page-indicator` will be shown on the bottom bar.

#### The second method for defining pages:
```js
address: "localhost",
port: 8081,
ipWhitelist: ["127.0.0.1", "::ffff:127.0.0.1", "::1"],
modules: [
    ...
    {
        module: 'MMM-DWD-WarnWeather',
	...
    },
    {
        module: 'MMM-DWD-WarnWeather',
	...
    },
    {
        module: 'clock',
        name: "middle_clock",
	...
    },
    {
        module: 'clock',
        name: "bottom_middle",
	...
    },
    {
	module: "MMM-PublicTransportHafas",
	name: "transport_right",
	...
    },
    {
	module: "MMM-PublicTransportHafas",
	name: "transport_right",
	...
    },
    {
	module: "MMM-PublicTransportHafas",
	name: "transport_left",
	...
    },
    {
	module: "MMM-PublicTransportHafas",
	name: "transport_left",
	...
    },
    {
        module: "MMM-page-indicator",
	...
    }
],
pages: {
    main: {
        "MMM-DWD-WarnWeather": "top_bar",
	"middle_clock": "middle_center",
	"bottom_clock": "bottom_center"
    },
    second: {
    	"transport_right": "bottom_right",
	"transport_left": "bottom_left"
    }
},
exclusions: {
    "MMM-page-indicator": "bottom_bar"
}
```
Both `pages` and `exclusions` are on the same level as `modules`

`pages`: 

* This contains objects where the key is the page name and the members are define the module names and positions. 
  * The new `name` prop comes into play here. Both `module` and `name` are simply used as selectors. If you want to assign all `clock` modules to a certain position, then `"clock": "bottom_center"` will function, but if you want to have some clocks in some positions and some in others, then you assign them a `name` which can then be used as a selector. In this case, the groups used are:
    * `MMM-DWD-WarnWeather`: This one selects all the `MMM-DWD-WarnWeather` modules. An important note is that when a module name is used as the selector, it is overriden by usage of a `name` prop as the selector.
    * `middle_clock` and `bottom_clock`: Both of these only contain one member, a clock. They still function normally, but now the user can choose the positions of each clock individually instead of having to move them as a group as would happen if `clock` was used as the selector.
    * `transport_right` and `transport_left`: Both of these have multiple members and are used as ways of grouping modules so that they can be moved as a section instead of having to specify them individually. This is used if a set of modules should always be together.
    
`exclusions`: 

* This works the same as `pages: "all"` from the first method. The module is shown on all pages and the position is defined in the same way as it is in the pages config. The selector can be the `module name` or the `name` prop.

Note: Setting the position to `"none"` has the same effect as not defining a position for the module.

## Configuration
Option|Description
------|-----------
`defaultPage`|Default page to display when the mirror boots up.<br/>**Expected Value Type:** `String`.|
`displayTitle`|Whether or not to display the page title.<br/>**Expected Value Type:** `boolean`.|
`selectPageNotif`|Which notifications should be used to set the page. The payload of these notifications should be the name of the page, the index of the page written out ("one", "two",...), or the index of the page as a number.<br/>**Expected Value Type:** `Array of Strings`.|
`incrementPageNotif`|Notifications that increment the page.<br/>**Expected Value Type:** `Array of Strings`.|
`decrementPageNotif`|Notifications that decrement the page.<br/>**Expected Value Type:** `Array of Strings`.|
`autoChange`|Options for automatically changing the current page.<br/>**Expected Value Type:** `Object`.|
`restoreDefault`|If specified, the page will switch back to default after the given number of seconds<br/>**Expected Value Type:** `Integer`.|

`autoChange`:

Currently, autoChange has only one option, `interval`.

`interval` takes a number as it's value and defines the number of seconds before the next page is diplayed.

Configurations for modules used with Page Selector are done in the normal fashion in their own object.

## Integration With Other Modules
In order for an external module to interact with Page Selector, the other module must send a notification in the form of a string to `"PAGE_SELECT"` with a payload of the **page name** or of the **page index**.<br/><br/>
To select the page at index `1` in the array:
```js
this.sendNotification("PAGE_SELECT", "2");
``` 
Yea, yea, yea... it should start at 0. Well that doesn't play nice with MMM-Voice-Commands so it starts at 1, deal with it.<br/><br/>
To select the page named `weather`:
```js
this.sendNotification("PAGE_SELECT", "weather");
```
When the page changes, a notification is sent to `"PAGE_CHANGED"` with the payload being the index of the page.

- This module was developed along side [MMM-Voice-Commands](https://github.com/Veldrovive/MMM-Voice-Commands). For information on how they interact, follow the link and scroll to the bottom of the README
