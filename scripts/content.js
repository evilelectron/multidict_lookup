/*
 *  Multi Dictionary Lookup
 *  Website: https://addons.mozilla.org/en-US/firefox/addon/multi-dictionary-lookup/
 *  Source:  https://github.com/evilelectron/multidict_lookup
 *
 *  Copyright (c) 2020+ EvilElectron
 *  Licensed under the Mozilla Public License, version 1.1
 */

/* Prevent Javascript namepsace pollution */
window.multidict_lookup = {
    clientX: 0,
    clientY: 0,
    pageX: 0,
    pageY: 0,
    prefs: null,
    dict: null,
    clickCount: 0,
    aLinkTextNode: null,
    selection: '',

    /**
     * Initialize the Multi Dictionary plugin when the browser page has loaded
     *
     * @return void
     **/
    onLoad: function() {
        console.log("Overlay.js loaded");
        browser.runtime.onMessage.addListener(window.multidict_lookup.onMenuItemCommand);
        document.addEventListener("contextmenu", window.multidict_lookup.onRightClick, false);
    },

    onRightClick: function(e) {
        window.multidict_lookup.clientX = e.clientX;
        window.multidict_lookup.clientY = e.clientY;
    },

    /**
     * Determine which dictionary has been selected from the browser context menu.
     * Form the URL needed to look up the highlighted text in the chosen dictionary.
     * Request the URL and then show the dictionary plugin pop-up with loading animation.
     *
     * @return void
     **/
    onMenuItemCommand: function(e) {
        console.log("onMenuItemClicked ");
        console.log(e.dictionary);
        var url = '';
        /* Get the dictionary URL from preferences and append the string to lookup */
        url = e.dictionary.url;
        url += e.dictionary.url_append;
        url += e.word;

        console.log(url);

        /* Display the dictionary plugin pop-up window with a waiting animation */
        window.multidict_lookup.displayPopup(url, e);


        /* Request the URL from the dictionary's website */

        var header = new Headers();
        header.append('Content-Type', 'text/html');
        fetch(url, {
            method: 'GET',
            headers: header
        }).then(function (response) {
            console.log(response);
            response.text().then(function(text) {
                var parser = new DOMParser();
                var doc = parser.parseFromString(text, 'text/html');
                window.multidict_lookup.onDefinitionLoad(url, doc, e);
            });
        }).catch(function(error){
            console.error(error);
        });


        /* Display the dictionary plugin pop-up window with a waiting animation */
        //window.multidict_lookup.displayPopup(url);
    },

     /**
     * Construct the dictionary plugin pop-up window.
     *
     * @return void
     **/
    displayPopup: function(url, request) {

            /* define an outer container that will hold everything inside it */
        var outerDiv = document.getElementById('tfd');

        /* define an inner container to hold the definition retrieved from the dictionary */
        var definitionDiv = document.getElementById('tfd-lookup');

        /* define another inner container to hold the attribution to the dictionary */
        var attribution = null;

        /* create the outer div if it doesn't already exist */
        if(!definitionDiv) {

            outerDiv = document.createElement('div');
            outerDiv.id = "tfd";

            /* create the inner container for the word definition */
            definitionDiv = document.createElement('div');
            definitionDiv.id = 'tfd-lookup';

            /* create the attribution container */
            attribution = document.createElement('span');
            attribution.id = "attribution";

            /* use localised strings */
            //TODO: Localize
            var power = document.createTextNode("POWERED BY ");
            //var power = content.document.createTextNode('Powered by ');
            attribution.appendChild(power);

            /* create a link that holds the URL actually queried by the dictionary plugin */
            var aElement = document.createElement('a');
            aElement.id = "attribution-link";
            aElement.target = '_blank';

            window.multidict_lookup.aLinkTextNode = document.createTextNode('');
            aElement.appendChild(window.multidict_lookup.aLinkTextNode);

            attribution.appendChild(aElement);

            /* attach the stylesheet used to style the elements above */
            var styl = document.createElement('link');
            styl.href = browser.runtime.getURL("css/skin.css");
            //styl.href = 'skin.css';
            styl.rel = 'stylesheet';
            styl.type = 'text/css';

            outerDiv.appendChild(definitionDiv);
            outerDiv.appendChild(attribution);
            document.body.appendChild(outerDiv);
            document.body.appendChild(styl);
        }

        /* if the dictionary plugin pop-up has been shown before, clear it */
        while (definitionDiv.firstChild) {
            definitionDiv.removeChild(definitionDiv.firstChild);
        }

        /* show an animation while waiting for the dictionary URL to load */
        var loadingDiv = document.createElement('div');
        loadingDiv.id = 'tfd-loading';
        definitionDiv.appendChild(loadingDiv);

        /* show the correct dictionary icon in the attribution container */
        var attributionA = outerDiv.querySelector('#attribution-link');
        attributionA.href = url;

        /* use localised strings */
        //TODO: Localize
        attributionA.title = "LOOKUP" + ' "' + request.word + '"';
        //attributionA.title = 'Lookup "'+ window.multidict_lookup.getWordToLook() + '"';

        /*If aLinkTextNode has a parent, remove it from the parent tree*/
        if (window.multidict_lookup.aLinkTextNode.parentNode) {
            window.multidict_lookup.aLinkTextNode.parentNode.removeChild(window.multidict_lookup.aLinkTextNode);
        }
        window.multidict_lookup.aLinkTextNode.textContent = request.dictionary.title;
        attributionA.appendChild(window.multidict_lookup.aLinkTextNode);

        /* position the dictionary icon to the left of the attribution link */
        attribution = outerDiv.querySelector('#attribution');
        attribution.style.backgroundImage = "url("+ request.dictionary.icon +")";
        attribution.style.backgroundPosition = "left top";
        attribution.style.backgroundRepeat = "no-repeat";

        /* attempt to reset the scrollbar inside the dictionary plugin pop-up window */
        definitionDiv.scrollTop = 0;
        definitionDiv.scrollLeft = 0;


        /* position the dictionary plugin pop-up window */
        outerDiv.style.left = (window.multidict_lookup.clientX) + "px";
        outerDiv.style.top = (window.multidict_lookup.clientY) + "px";

        /* make visible the dictionary plugin pop-up window */
        outerDiv.style.display = 'block';
        definitionDiv.style.display = 'block';
    },

    /**
     * Show the word defintion in the dictionary plugin pop-up window.
     *
     * @return void
     **/
    onDefinitionLoad: function(url, doc, request) {
        /* the dictionary URL requested earlier has now loaded */
        console.log("onDefinitionLoad called");
        window.multidict_lookup.doc = doc;
        console.log("Dictionary URL requested: " + url);

        /* parse the dictionary page to get just the relevant info needed */
        var scrapedHtml = doc.querySelector(request.dictionary.selector);
        console.log("HTML Object of definition: " + scrapedHtml);

        /* Special Case: If the dictionary is the Technolgy Dictionary, parse its DOM */
        if((request.dictionary.title == "Technology Dictionary") && (scrapedHtml)) {
            console.log("Inside Special Case of Technology Dictionary");
            /* Parse DOM here */
            var tagsToRemove = new Array("img","h1","span","p","br");
            var tags = '';
            for (var i = 0; i < tagsToRemove.length; i++) {
                tags = scrapedHtml.getElementsByTagName(tagsToRemove[i]);
                for (var j = 0; j < tags.length; j++) {
                    console.log("Deleting node: " + tags[j] + " parent node: " + tags[j].parentNode
                            + " typeof: " + typeof(tags[j].parentNode));
                    try {
                        scrapedHtml.removeChild(tags[j]);
                    } catch (e) {
                        console.log("Error deleting node: " + tags[j] + " parent node: " + tags[j].parentNode
                            + " typeof: " + typeof(tags[j].parentNode));
                        if(tags[j].parentNode.constructor == window.HTMLUnknownElement) {}
                    }
                }
            }

            /* determine if the definition has been found */
            if (!scrapedHtml.innerHTML.match(request.word) ){
                scrapedHtml = null;
            }
        }

        /* get notified when the user clicks outside the dictionary plugin pop-up window */
        document.addEventListener("keydown", window.multidict_lookup.tfdKeyPress, false);
        document.addEventListener("click", window.multidict_lookup.tfdKeyPress, false);

        /* remove the loading animation */
        if (doc.nodeName == "#document") {
            var outerDiv = document.getElementById('tfd');
            var definitionDiv = document.getElementById('tfd-lookup');
        };

        while (definitionDiv.firstChild) {
            definitionDiv.removeChild(definitionDiv.firstChild);
        }

        /* check if a definition was retrieved */
        if(!scrapedHtml) {

            /* use localised strings */
            //TODO: Localize
            scrapedHtml = document.createTextNode("NOT FOUND");
            //scrapedHtml = content.document.createTextNode('No definition found.');
        }
        else {  /* definition was retrieved */

            //console.log("Scraped HTML of definition: " + scrapedHtml.innerHTML);

            /* process the links within the definition */
            var links = scrapedHtml.getElementsByTagName("a");
            for (var i = 0; i < links.length; i++) {

                /* ensure that all links within the definition open in a new window */
                 links[i].setAttribute("target", "_blank");

                /* check if the link is a relative URL */
                if (links[i].getAttribute("href") &&
                        links[i].getAttribute("href").indexOf('://') == -1  &&
                        links[i].getAttribute("href").indexOf('javascript') == -1) {

                    console.log("first character of relative URL: " + links[i].getAttribute("href").charAt(0));

                    var oldHref = links[i].getAttribute("href");
                    var newHref = '';

                    /* if the link is a relative URL starting with /, # or ?, construct an absolute URL */
                    if( links[i].getAttribute("href").indexOf('/')==0 )  {
                            newHref = request.dictionary.url + oldHref;
                    }
                    else if (links[i].getAttribute("href").indexOf('#')==0  ||
                             links[i].getAttribute("href").indexOf('?')==0 )  {
                        newHref = url + oldHref;
                    }
                    else  { /* relative URL starting with something other than /, # or ? */
                        newHref = request.dictionary.url + '/' +  oldHref;
                    }

                    /* convert to absolute URL */
                    links[i].setAttribute("href", newHref);
                    console.log("relative URL: " + oldHref);
                    console.log("absolute URL: " + newHref);
                }
            }
        }

        /* add the definition */
        definitionDiv.appendChild(scrapedHtml);
    },


    /**
     * Hide the dictionary plugin pop-up window when the user clicks outside.
     *
     * @return void
     **/
    tfdKeyPress:function(aEvent){
        document.getElementById("tfd").style.display = 'none';
        document.removeEventListener("keydown", window.multidict_lookup.tfdKeyPress, false);
        document.removeEventListener("click", window.multidict_lookup.tfdKeyPress, false);
    },
};
console.log(window);
console.log(document);
console.log(browser);
window.multidict_lookup.onLoad();
