var preferenceItems = [
      'freeDict', 'urbanDict', 'beeDict', 'babylonThes', 'thesaurusThes', 'enWiki', 'techPedia', 'useSubmenu'
    ];

function saveOptions(e) {
  var prefStorage = {};
  preferenceItems.forEach(function(prefElem) {
    prefStorage[prefElem] = document.querySelector("input[name='" + prefElem + "']:checked").value;
  });
  browser.storage.sync.set(prefStorage)
  e.preventDefault();
  console.log("Options saved");
}

function onGot(item) {
  console.log(item);
}

function onError(error) {
  console.log("Error: ${error}");
}

function restoreOptions() {
  //if storage gets messed up
  //browser.storage.sync.clear();
  browser.storage.sync.get().then((prefStorage) => {
    for (prefElem in prefStorage) {
      prefVal = prefStorage[prefElem];
      if ("1" == prefVal) {
          var el = document.querySelector("input[id='" + prefElem + "On']");
          if (el == null) console.log(prefElem);
          else {
            el.setAttribute("checked", "1");
            document.querySelector("input[id='" + prefElem + "Off']").removeAttribute("checked");
          }
        } else {
          document.querySelector("input[id='" + prefElem + "On']").removeAttribute("checked");
          document.querySelector("input[id='" + prefElem + "Off']").setAttribute("checked", "1");
        }
    }
  });
}
document.addEventListener('DOMContentLoaded', restoreOptions);
document.querySelector("form[name='multidict_lookup_preferences_form']").addEventListener("submit", saveOptions);
