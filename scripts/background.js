MultiDictLookupBackgroundService = {
/* List of dictionaries supported */
    /*
     * 'menuitem-id': {
  \      * url: URL of the dictionary
         * image: dictionary icon
         * title: dictionary name for attribution
         * selector: CSS selector api to scrape HTML
     * }
     * */

    dictionaries: {
        freeDict: {
            enabled: true,
            url: "https://www.thefreedictionary.com",
            url_append: "/",
            icon: browser.runtime.getURL("icons/tfd-icon.png"),
            title: "The Free Dictionary",
            selector: "#MainTxt>#Definition>section:nth-child(1)"
        },
        urbanDict: {
            enabled: true,
            url: "https://www.urbandictionary.com",
            url_append: "/define.php?term=",
            icon: browser.runtime.getURL("icons/ud-icon.png"),
            title: "Urban Dictionary",
            selector: "div.def-panel:nth-child(1)>div:nth-child(3)"
        },
        beeDict: {
            enabled: true,
            url: "https://www.beedictionary.com",
            url_append: "/meaning/",
            icon: browser.runtime.getURL("icons/beed-icon.png"),
            title: "Bee Dictionary",
            selector: "#WordsDiv>ul>li:first-child"
        },
        babylonThes: {
            enabled: true,
            url: "https://thesaurus.babylon.com",
            url_append: "/",
            icon: browser.runtime.getURL("icons/bt-icon.png"),
            title: "Babylon Thesaurus",
            selector: "#last-term"
        },
        thesaurusThes: {
            enabled: false,
            url: "https://www.thesaurus.com",
            url_append: "/browse/",
            icon: browser.runtime.getURL("icons/tt-icon.png"),
            title: "thesaurus.com",
            selector: "div.synonyms_wrapper>div.synonyms"
        },
        enWiki: {
            enabled: true,
            url: "https://en.wikipedia.org",
            url_append: "/wiki/",
            icon: browser.runtime.getURL("icons/wiki-icon.png"),
            title: "Wikipedia",
            selector: "#mw-content-text>p"
        },
        techPedia: {
            enabled: false,
            url: "https://www.techdict.org",
            url_append: "/define/",
            icon: browser.runtime.getURL("icons/tech-icon.png"),
            title: "Technology Dictionary",
            selector: "#Content"
        }
    },

    saveOptions: function (options) {
        var prefStorage = {};
        for (const dictionary in options) {
            this.dictionaries[dictionary].enabled = options[dictionary];
            prefStorage[dictionary] = options[dictionary];
        };
        browser.storage.sync.set(prefStorage)
        console.log("Options saved");
        this.createMenus();
    },

    setDefaultPreferences: function() {
        var options = {};
        for (const dictionary in this.dictionaries) {
            options[dictionary] = this.dictionaries[dictionary].enabled;
        }
        this.saveOptions(options);
    },

    onMessage: function(message) {
        console.log("onMessage " +message);
        if (message.action == "showMenu") {
            //this.createMenu(message.selection);
            //we have to set visible to true
        } else if (message.action = "hideMenu") {
        }
    },

    createMenus: function() {
        var parentId = "multidict_lookup-context-menu";
        console.log("Create Menus");
        if (browser.menus.onClicked.hasListener(MultiDictLookupBackgroundService.onMenuClicked)) {
            browser.menus.removeAll();
            browser.menus.onClicked.removeListener(MultiDictLookupBackgroundService.onMenuClicked);
        }

        browser.menus.create({
            id: parentId,
            type: "normal",
            title: "Define %s",
            contexts: ["selection"],
        });
        browser.storage.sync.get().then((prefStorage) => {
            for (prefElem in prefStorage) {
                prefVal = prefStorage[prefElem];
                if (prefVal && "useSubmenu" != prefElem) {
                    browser.menus.create({
                        parentId: parentId,
                        id: prefElem,
                        type: "normal",
                        title: "Define %s " + prefElem,
                        contexts: ["selection"],
                    });
                }
            }
        });
        browser.menus.onClicked.addListener(MultiDictLookupBackgroundService.onMenuClicked);

    },

    onStartup: function() {
        console.log("onStartup");
        createMenus();
        /*create the top level menu*/
    },

    onMenuClicked: function(menuInfo, tabInfo) {
        console.log("onMenuClicked " + menuInfo.menuItemId);
        console.log(menuInfo);
        console.log(tabInfo);
        browser.tabs.sendMessage(tabInfo.id, {
            dictionary: MultiDictLookupBackgroundService.dictionaries[menuInfo.menuItemId],
            word: menuInfo.selectionText
        });
    },
    onConnect: function(port) {
        this.contentPort = port;
        this.contentPort.onMessage.addListener(function(message) {
            console.log("Message received");
            MultiDictLookupBackgroundService.onMessage(message);
        });
    }
};
console.log("Calling onStartup.addListner");
browser.runtime.onStartup.addListener(MultiDictLookupBackgroundService.onStartup);
console.log("Calling onConnect.addListner");
browser.runtime.onConnect.addListener(MultiDictLookupBackgroundService.onConnect);
console.log("Calling onInstalled.addListner");
browser.runtime.onInstalled.addListener(function() {
    //browser.storage.sync.clear();
    MultiDictLookupBackgroundService.setDefaultPreferences();
});
