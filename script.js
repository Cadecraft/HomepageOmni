// Homepage Omni
// Cadecraft
// v0.2.0; 2024/06/15

// TODO:
// Max height and scroll bar for the list of links
// Allow changing your search engine
// Tabbing from the bar doesn't work well
// Save the preferences (display_when_empty)
// Colors: change slightly?
// Test: in Chrome?
// Release: publish for Firefox?

// Data
// { key, href, priority }
// TODO: rename these without the "link_" prefix?
let links = [
	{ link_key: "Example Link", link_href: "https://example.com", link_priority: 0 },
	{ link_key: "Google", link_href: "https://google.com", link_priority: 0 },
	{ link_key: "Gmail", link_href: "https://mail.google.com", link_priority: 0 },
	{ link_key: "GitHub", link_href: "https://github.com", link_priority: 0 },
	{ link_key: "YouTube", link_href: "https://youtube.com/", link_priority: 0 },
	{ link_key: "LeetCode", link_href: "https://leetcode.com/problemset", link_priority: 0 }
];
let links_filtered = [];
let selectedi = 0; // The current index selected from links_filtered
let display_when_empty = true; // Whether to display when the box is empty
let error_text = "";

// Determine browser type
// TODO: better way of determining browser type?
let is_chrome = navigator.userAgent.includes("Chrome");

// Set a key and return whether successful
function setLink(new_key, new_href) {
	let foundIndex = -1;
	for (let i = 0; i < links.length; i++) {
		if (links[i].link_key.toLowerCase().trim() == new_key.toLowerCase().trim()) {
			foundIndex = i;
		}
	}
	if (foundIndex == -1) {
		// Add, if possible
		if (new_key.trim().length == 0) {
			error_text = "Name must not be empty";
			return false;
		} else if (new_key.trim().startsWith(":") || new_key.trim().startsWith("=") || new_key.trim().startsWith("-")) {
			error_text = "Name cannot start with ':', '=', or '-'";
			return false;
		} else if (new_href.includes(",")) {
			error_text = "URL cannot contain commas";
			return false;
		} else {
			links.push({
				link_key: new_key.trim(),
				link_href: new_href.trim()
			});
		}
	} else {
		// Found: set
		// TODO: other checks? Validate the value?
		links[foundIndex].link_href = new_href.trim();
	}
	saveLinks();
	return true;
}

// Delete a key and return whether successful
function deleteLink(new_key) {
	let foundIndex = -1;
	for (let i = 0; i < links.length; i++) {
		if (links[i].link_key.toLowerCase().trim() == new_key.toLowerCase().trim()) {
			foundIndex = i;
		}
	}
	if (foundIndex == -1) {
		// Does not exist
		error_text = "Link key not found; please provide the full name";
		return false;
	} else {
		// Found: set
		links.splice(foundIndex, 1);
	}
	saveLinks();
	return true;
}

// Process entered input and return whether successful
function processInput(new_value) {
	// Determine type by first character
	if (new_value.startsWith(":")) {
		// Command
		if (new_value == ":show") display_when_empty = true;
		else if (new_value == ":hide") display_when_empty = false;
		else if (new_value.startsWith(":delete")) {
			// Delete
			return deleteLink(new_value.substring(7).trim());
		} else if (new_value.startsWith(":set")) {
			// Set
			// Parse to find arguments
			let arguments_string = new_value.substring(4).trim();
			let key_value = "";
			let href_value = "";
			let foundSpace = false;
			for (let i = arguments_string.length - 1; i >= 0; i--) {
				let thischar = arguments_string.substring(i, i + 1);
				if (foundSpace) key_value = thischar + key_value;
				else if (thischar == ' ') foundSpace = true;
				else href_value = thischar + href_value;
			}
			key_value = key_value.trim();
			href_value = href_value.trim();
			return setLink(key_value, href_value);
		} else if (new_value.startsWith(":export")) {
			// Export as a .csv file
			exportFile();
			return true;
		} else if (new_value.startsWith(":import")) {
			// Import from a .csv file
			// Activate file select
			document.getElementById("file-uploader").click();
			return true;
		} else if (new_value.startsWith(":help")) {
			// Tell to read the README.md
			error_text = 'For help, check the included README.md file'
			return true;
		} else {
			// Not a command
			error_text = "Not a command";
			return false;
		}
		return true;
	} else if (new_value.startsWith("=")) {
		// Go to the address
		if (new_value.substring(1).startsWith("http")) window.location.href = new_value.substring(1).trim();
		else window.location.href = "https://" + new_value.substring(1).trim();
	} else if (new_value.startsWith("-")) {
		// Web search
		window.location.href = "https://google.com/search?q=" + new_value.substring(1).trim();
	} else {
		// Link: choose the selected one of the filtered
		if (links_filtered.length == 0) {
			// Cannot do anything
			error_text = "No matching links (did you mean to use a :command?)";
			return false;
		} else {
			// Go to the link
			if (selectedi < 0) selectedi = 0;
			else if (selectedi >= links_filtered.length) selectedi = links_filtered.length - 1;
			window.location.href = links_filtered[selectedi].link_href;
			return true;
		}
	}
}

// Compare two links
function compareLinks(a, b) {
	// First, priority
	if (a.link_priority > b.link_priority) return -1;
	else if (a.link_priority < b.link_priority) return 1;
	// Second, key
	if (a.link_key < b.link_key) return -1;
	else if (a.link_key > b.link_key) return 1;
	else return 0;
}

// Sort links alphabetically
function sortLinks() {
	links.sort(compareLinks);
	links_filtered.sort(compareLinks);
}

// Update the filter based on the new search query
const helptext = document.getElementById("helptext");
function updateFiltered(new_value) {
	helptext.className = "normal";
	helptext.innerText = "";
	// Based on the contents of the box
	let trimmed = new_value.trim().toLowerCase();
	let shouldFilter = true;
	let filterTo = trimmed;
	if (trimmed == "") {
		// Empty: show or hide, based on the setting
		if (display_when_empty) {
			links_filtered = links.slice();
		} else {
			links_filtered = [];
		}
		shouldFilter = false;
	} else if (trimmed.startsWith(":set") || trimmed.startsWith(":delete")) {
		// Command: trim and filter for some commands (ex. :set and :delete)
		filterTo = "";
		let foundSpace = false;
		for (let i = 0; i < trimmed.length; i++) {
			if (trimmed[i] == ' ' && !foundSpace) { foundSpace = true; }
			else if (foundSpace) { filterTo += trimmed[i]; }
		}
		shouldFilter = true;
		// Update help text
		if (trimmed.startsWith(":set")) {
			helptext.innerText = ":set {display name} {full URL}";
		} else if (trimmed.startsWith(":delete")) {
			helptext.innerText = ":delete {full name of link to delete}";
		}
	}
	if (shouldFilter) {
		// Not empty: filter
		links_filtered = [];
		for (const link of links) {
			// TODO: ignore all spaces for easier search?
			let matchesFilter = link.link_key.toLowerCase().includes(filterTo);
			if (matchesFilter) {
				links_filtered.push(structuredClone(link));
				if (link.link_key.toLowerCase().startsWith(filterTo)) {
					// First priority: starts with
					links_filtered[links_filtered.length - 1].link_priority = 1;
				}
			}
		}
	}
	sortLinks();
	// Add help text if needed
	if (error_text.length > 0) {
		helptext.className = "error";
		helptext.innerText = error_text;
	} else if (new_value.startsWith(":") && helptext.innerText == "") {
		helptext.className = "normal";
		helptext.innerText = "Enter a command (ex. :hide)";
	} else if (new_value.startsWith("=")) {
		helptext.className = "normal";
		helptext.innerText = "Enter an address (ex. =example.com)";
	} else if (new_value.startsWith("-")) {
		helptext.className = "normal";
		helptext.innerText = "Enter a web search (ex. -marsupials)";
	}
	// Handle selection
	if (selectedi >= links_filtered.length) selectedi = links_filtered.length - 1;
}

// Export to a file
function exportFile() {
	let text = "";
	for (const link of links) {
		text += link.link_key + ", " + link.link_href + "\n";
	}
	let elem = document.createElement("a");
	elem.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(text));
	elem.setAttribute("download", "links.csv");
	elem.style.display = "none";
	document.body.appendChild(elem);
	elem.click();
	document.body.removeChild(elem);
}

// Import from raw text (the CSV format that is exported)
function importFromText(theText) {
	const lines = theText.split(/[\r\n]+/);
	links = [];
	for (const row of lines) {
		// Link key, link URL
		// Key can contain commas, but URL cannot, so parse from the back
		let thisURL = "";
		let thisKey = "";
		let reachedComma = false;
		for (let i = row.length - 1; i >= 0; i--) {
			if (!reachedComma) {
				if (row[i] == ',') reachedComma = true;
				else thisURL = row[i] + thisURL;
			} else {
				thisKey = row[i] + thisKey;
			}
		}
		thisURL = thisURL.trim();
		thisKey = thisKey.trim();
		console.log(thisKey + " : " + thisURL);
		// Do not add if the URL or the key do not exist or are invalid
		if (thisURL.length <= 0 || thisKey.length <= 0) continue;
		links.push({ link_key: thisKey, link_href: thisURL, link_priority: 0 });
	}
	sortLinks();
	updateFiltered("");
	render();
	// Save the links to storage after loading them (assuming no errors)
	// TODO: display result/error if needed?
	saveLinks();
}

// Upload a file
document.getElementById("file-uploader").addEventListener("change", () => {
	// File must exist
	if (document.getElementById("file-uploader").files.length <= 0) return;
	// Try to parse the value
	const file = document.getElementById("file-uploader").files[0];
	let reader = new FileReader();
	reader.addEventListener("load", function() {
		// Loaded the text content
		const textContent = reader.result;
		// Update from the text
		importFromText(textContent);
	});
	reader.readAsText(file);
});

// Render
const listbox = document.getElementById("listbox");
function render() {
	// Clear the list
	while (listbox.firstChild) {
		listbox.removeChild(listbox.lastChild);
	}
	// Based on the links which have been filtered
	let first_item = true;
	for (let i = 0; i < links_filtered.length; i++) {
		// Render the link
		const new_div = document.createElement("div");
		if (i == selectedi) new_div.className = "linkitem_selected";
		else new_div.className = "linkitem_normal";
		const new_a = document.createElement("a");
		new_a.href = links_filtered[i].link_href;
		new_a.innerText = links_filtered[i].link_key;
		new_div.appendChild(new_a);
		listbox.appendChild(new_div);
		first_item = false;
	}
}

// On updating
const omnibar = document.getElementById("omnibar");
omnibar.addEventListener("change", () => {
	let new_value = omnibar.value;
	updateFiltered(new_value);
	render();
});
omnibar.addEventListener("keydown", (e) => {
	// Arrows
	if (e.key === "ArrowUp") {
		// Move selection up
		selectedi--;
		if (selectedi < 0) selectedi = links_filtered.length - 1;
		render();
	} else if (e.key === "ArrowDown") {
		// Move selection down
		selectedi++;
		if (selectedi >= links_filtered.length) selectedi = 0;
		render();
	}
});
omnibar.addEventListener("keyup", (e) => {
	let new_value = omnibar.value;
	// Update
	updateFiltered(new_value);
	render();
});
// On entering or updating
omnibar.addEventListener("keypress", (e) => {
	let new_value = omnibar.value;
	if (e.key === "Enter") {
		// Enter
		let success = processInput(new_value);
		if (success) {
			// Clear the box
			omnibar.value = "";
		}
		updateFiltered(omnibar.value);
	} else {
		error_text = "";
	}
});

// Save links to storage, if possible
async function saveLinks() {
	if (is_chrome) {
		// Use chrome storage
		// TODO: test in chrome
		chrome.storage.local.set({
			"userlinks": links
		});
	} else {
		// Use cross-browser storage
		let settingItem = browser.storage.local.set({
			"userlinks": links
		});
	}
}

// Load links from storage, if possible, and render
async function loadLinks() {
	if (is_chrome) {
		// Use chrome storage
		// TODO: test in chrome
		chrome.storage.local.get("userlinks", (result) => {
			// Based on result
			if (
				result != null && result != undefined
				&& Object.keys(result).length !== 0
				&& "userlinks" in result
			) {
				// Update to result
				links = [];
				for (const value of result["userlinks"]) {
					links.push(value); // Value should be a link object { link_key: "", ... }
				}
				// Update
				sortLinks();
				updateFiltered("");
				render();
			}
		});
	} else {
		// Use cross-browser storage
		let result = await browser.storage.local.get("userlinks");
		// Based on result
		if (
			result != null && result != undefined
			&& Object.keys(result).length !== 0
			&& "userlinks" in result
		) {
			// Update to result
			links = [];
			for (const value of result["userlinks"]) {
				links.push(value); // Value should be a link object { link_key: "", ... }
			}
			// Update
			sortLinks();
			updateFiltered("");
			render();
		}
	}
}

// First time loading the page
sortLinks();
updateFiltered("");
render();
// Load links from storage, if possible
loadLinks();
