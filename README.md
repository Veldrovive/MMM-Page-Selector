# MMM-Page-Selector
![Demo](https://i.imgur.com/pcrZAHf.gif)<br/>
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

## Use
```js
modules[
    ...
    {
        module: "MMM-Page-Selector",
        position: "top_bar",
        config: {
            page: "pageName",
            displayTitle: true,
            pages: {
                pageName: [{module: "moduleName", position: "modulePosition"},...],
                pageTwo: [{module: "moduleName", position: "modulePosition"},...]
            },
            neverHide: ["alert", "updatenotification"]
        }
    },
  ...
]
```

## Configuration
Option|Description
------|-----------
`page`|Default page to display when the mirror boots up.<br/>**Expected Value Type:** `String`.
`displayTitle`|Wether or not to display the page title.<br/>**Expected Value Type:** `boolean`.
`pages`|Configuration of when and where to display modules.<br/>Example Page: `weather: [{{module: "MMM-3Day-Forecast", position: "bottom_center"}},{module: "calendar", position: 'top_left'},{module: "clock", position: "top_right]]`<br/>**Expected Value Type:** `Array`
`neverHide`|Array of modules that should always appear on screen and never move.<br/>**Expected Value Type:** `Array<String>`

Configurations for modules used with Page Selector are done in the normal fassion in their own object.

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
