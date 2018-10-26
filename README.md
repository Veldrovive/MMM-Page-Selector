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
        position: "bottom_center", //Or any other position, this doesnt matter unless "pages" is set to "all"
        pages: {"pageNameOne": "position", "pageNameTwo": "another_position"},
        config: {}
    },
  ...
    //Example of the config for a module to be shown on all pages
    {
        module: "MMM-any-other",
        position: "bottom_center", //This value defines the position that the module will always appear in
        pages: "all",
        config: {}
    }
]
```
Pages are created implicitly when included within a module's `pages` prop.<br/>
For example, specifying `pages: {"main": "bottom_center", "fun": "top_right"}` will create the pages `main` and `fun` then make the module appear at the bottom center on the main page and top right on the fun page.

If `pages` is set to "all", then the module will always appear in the position defined by the `position` prop.

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
            decrementPageNotif: ["PAGE_DOWN"]
        }
    },
    {
        module: "MMM-Weather-Now",
        position: "bottom_center",
        pages: {main: "top_right", weather: "bottom_left"}
    },
    {
        module: "MMM-page-indicator",
        position: "bottom_center",
        pages: "all"
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

The configuration for `MMM-Weather-Now` will:
* `position`: This doesn't matter, it just has to be set so Magic Mirror will render the module.
* `pages`: Each key defines a page and each value defines the position on that page. This means that `MMM-Weather-Now` will be rendered at the top right when on the "main" page and on the bottom left when on the "weather" page.

The configuration for `MMM-page-indicator` will:
* `position`: Since this will be on all pages, setting the position to be "bottom_center" means that it will always be displayed there.
* `pages`: Means that reguardless of the page, `MMM-page-indicator` will be shown.

Note: if 3rd party modules fail to hide correctly, a [potential fix](https://github.com/Veldrovive/MMM-Page-Selector/issues/2) is to remove the position prop.
## Configuration
Option|Description
------|-----------
`defaultPage`|Default page to display when the mirror boots up.<br/>**Expected Value Type:** `String`.|
`displayTitle`|Whether or not to display the page title.<br/>**Expected Value Type:** `boolean`.|
`selectPageNotif`|Which notifications should be used to set the page. The payload of these notifications should be the name of the page, the index of the page written out ("one", "two",...), or the index of the page as a number)<br/>**Expected Value Type:** `Array of Strings`.|
`incrementPageNotif`|Notifications that increment the page.<br/>**Expected Value Type:** `Array of Strings`.|
`decrementPageNotif`|Notifications that decrement the page.<br/>**Expected Value Type:** `Array of Strings`.|

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
