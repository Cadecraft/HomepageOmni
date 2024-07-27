// Homepage Omni
// Cadecraft
// v0.5.2; 2024/07/25

/* TODO:
	Feat: allow changing your search engine
	Feat: entire config file: search engine, colors (page bg, omnibar bg, link/flair color)
	Fix: timing countdowns after midnight
	Doc: fully document the config file syntax and available options
	Colors: change slightly? Allow customization?
	Test: test the day of the week schedule thing
	Test: clocks for different time zones
	Test: actually add my schedule to events and watch throughout the day
	Release: publish for Firefox?
*/

// Data
let links_filtered = [];
let selectedi = 0; // The current index selected from links_filtered
let display_when_empty = true; // Whether to display when the box is empty
let error_text = "";
// The default config
// TODO: set some sane, simple, minimal defaults
let config_default = {
	"display_when_empty": true,
	// Links: { key (display name), href (URL to go to), priority (should be 0) }
	"links": [
		{ key: "Example Link", href: "https://example.com", priority: 0 },
		{ key: "Google", href: "https://google.com", priority: 0 },
		{ key: "GitHub", href: "https://github.com", priority: 0 },
		{ key: "YouTube", href: "https://youtube.com/", priority: 0 },
	],
	// Events: { name (display name), hr (1-23), min (0-59) }
	"events": [

	],
	"event_display_duration_mins": 60,
	// Clocks
	// TODO: document these in README (value of "none" = do not show the clock)
	// TODO: by default, only show clock 1
	"clock1_name": "",
	"clock2_name": "hidden",
	"clock2_utc_offset": 0,
	"clock3_name": "hidden",
	"clock3_utc_offset": 0,
	"bar_placeholder": "Filter criteria, :command, =address, -search"
};
// The actual config
let config = structuredClone(config_default);

// Determine browser type
// TODO: better way of determining browser type?
let is_chrome = navigator.userAgent.includes("Chrome");

// Set a key and return whether successful
function setLink(new_key, new_href) {
	let foundIndex = -1;
	for (let i = 0; i < config.links.length; i++) {
		if (config.links[i].key.toLowerCase().trim() == new_key.toLowerCase().trim()) {
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
			config.links.push({
				key: new_key.trim(),
				href: new_href.trim()
			});
		}
	} else {
		// Found: set
		// TODO: other checks? Validate the value?
		config.links[foundIndex].href = new_href.trim();
	}
	saveConfig();
	return true;
}

// Delete a key and return whether successful
function deleteLink(new_key) {
	let foundIndex = -1;
	for (let i = 0; i < config.links.length; i++) {
		if (config.links[i].key.toLowerCase().trim() == new_key.toLowerCase().trim()) {
			foundIndex = i;
		}
	}
	if (foundIndex == -1) {
		// Does not exist
		error_text = "Link key not found; please provide the full name";
		return false;
	} else {
		// Found: set
		config.links.splice(foundIndex, 1);
	}
	saveConfig();
	return true;
}

// Process entered input and return whether successful
function processInput(new_value) {
	// Determine type by first character
	if (new_value.startsWith(":")) {
		// Command
		if (new_value == ":show") {
			config.display_when_empty = true;
			saveConfig();
		} else if (new_value == ":hide") {
			config.display_when_empty = false;
			saveConfig();
		} else if (new_value.startsWith(":delete")) {
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
			// Export as a .json file
			exportFile();
			return true;
		} else if (new_value.startsWith(":import")) {
			// Import from a .json file
			// Activate file select
			document.getElementById("file-uploader").click();
			return true;
		} else if (new_value.startsWith(":resetconfig")) {
			config = structuredClone(config_default);
			saveConfig();
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
			window.location.href = links_filtered[selectedi].href;
			return true;
		}
	}
}

// Compare two links
function compareLinks(a, b) {
	// First, priority
	if (a.priority > b.priority) return -1;
	else if (a.priority < b.priority) return 1;
	// Second, key
	if (a.key < b.key) return -1;
	else if (a.key > b.key) return 1;
	else return 0;
}

// Sort links alphabetically
function sortLinks() {
	config.links.sort(compareLinks);
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
		if (config.display_when_empty) {
			links_filtered = config.links.slice();
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
		for (const link of config.links) {
			// TODO: ignore all spaces for easier search?
			let matchesFilter = link.key.toLowerCase().includes(filterTo);
			if (matchesFilter) {
				links_filtered.push(structuredClone(link));
				if (link.key.toLowerCase().startsWith(filterTo)) {
					// First priority: starts with
					links_filtered[links_filtered.length - 1].priority = 1;
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
		helptext.innerText = "Enter a command (ex. :set, :delete)";
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
	// Simply export the config as a prettified JSON
	let text = JSON.stringify(config, null, 4);
	// Download the config
	let elem = document.createElement("a");
	elem.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(text));
	elem.setAttribute("download", "homepage_omni_config.json");
	elem.style.display = "none";
	document.body.appendChild(elem);
	elem.click();
	document.body.removeChild(elem);
}

// Import from raw text (the .json format that is exported)
function importFromString(theText) {
	// Simply parse the config from a JSON
	config = JSON.parse(theText);
	// Fill in any missing fields with the defaults using the ES6 spread operator
	config = { ...config_default, ...config };
	// TODO: Do not add a link if the URL or the key do not exist or are invalid (corrupted)
	// Update
	sortLinks();
	updateFiltered("");
	render();
	updateClock();
	// Save the links to storage after loading them (assuming no errors)
	// TODO: display result/error if needed?
	saveConfig();
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
		importFromString(textContent);
	});
	reader.readAsText(file);
});

// Render
const omnibar = document.getElementById("omnibar");
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
		if (i == selectedi) {
			new_div.className = "linkitem_selected";
		}
		else new_div.className = "linkitem_normal";
		const new_a = document.createElement("a");
		new_a.href = links_filtered[i].href;
		new_a.innerText = links_filtered[i].key;
		new_div.appendChild(new_a);
		listbox.appendChild(new_div);
		first_item = false;
		if (i == selectedi) {
			// Make sure it is visible
			new_div.scrollIntoView();
		}
	}
	// Update the clock
	updateClock();
	// Update the placeholder
	omnibar.placeholder = config.bar_placeholder;
}

// On updating
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

// Save config to storage, if possible
async function saveConfig() {
	if (is_chrome) {
		// Use chrome storage
		chrome.storage.local.set({
			"config": config
		});
	} else {
		// Use cross-browser storage
		browser.storage.local.set({
			"config": config
		});
	}
}

// Load config from storage, if possible, and render
async function loadConfig() {
	if (is_chrome) {
		// Use chrome storage
		// TODO: test more in chrome
		chrome.storage.local.get(["config"], (result) => {
			// Based on result
			if (
				result != null && result != undefined
				&& Object.keys(result).length !== 0
				&& "config" in result
			) {
				// Update to result
				config = result["config"];
				// Fill in any missing fields with the defaults using the ES6 spread operator
				config = { ...config_default, ...config };
				// Update
				sortLinks();
				updateFiltered("");
				render();
				updateClock();
			}
		});
	} else {
		// Use cross-browser storage
		let result = await browser.storage.local.get(["config"]);
		// Based on result
		if (
			result != null && result != undefined
			&& Object.keys(result).length !== 0
			&& "config" in result
		) {
			// Update to result
			config = result["config"];
			// Fill in any missing fields with the defaults using the ES6 spread operator
			config = { ...config_default, ...config };
			// Update
			sortLinks();
			updateFiltered("");
			render();
			updateClock();
		}
	}
}

// Time and date utilities
const weekdays = ["Sun.", "Mon.", "Tues.", "Wed.", "Thurs.", "Fri.", "Sat."];
const weekdaysChar = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'];
function padTime(time) {
	let res = "" + time;
	if (res.length < 2) res = "0" + res;
	return res;
}

// Render a specific clock given its ID, a date, a region name, and whether to use UTC (for global clocks)
function renderClock(clockid, d, region, useUTC) {
	document.getElementById("clockitem" + clockid).style.display = "inline";
	if (useUTC) {
		document.getElementById("clocktext" + clockid).innerText = padTime(d.getUTCHours()) + ":" + padTime(d.getUTCMinutes());
		document.getElementById("datetext" + clockid).innerText = d.getUTCFullYear() + "/" + padTime(d.getUTCMonth() + 1) + "/" + padTime(d.getUTCDate()) + " - " + weekdays[d.getUTCDay()];
	} else {
		document.getElementById("clocktext" + clockid).innerText = padTime(d.getHours()) + ":" + padTime(d.getMinutes());
		document.getElementById("datetext" + clockid).innerText = d.getFullYear() + "/" + padTime(d.getMonth() + 1) + "/" + padTime(d.getDate()) + " - " + weekdays[d.getDay()];
	}
	document.getElementById("regiontext" + clockid).innerText = region;
}

// Update clock and time
const eventbox = document.getElementById("eventbox");
function updateClock() {
	// Current time and date
	let d = new Date();
	let currHr = d.getHours();
	let currMin = d.getMinutes();
	let currSec = d.getSeconds();
	let currWeekday = d.getDay();
	let currWeekdayChar = weekdaysChar[currWeekday];
	// Display all clocks
	if (config.clock1_name == "hidden") {
		document.getElementById("clockitem1").style.display = "none";
	} else {
		renderClock("1", d, config.clock1_name, false);
	}
	if (config.clock2_name == "hidden") {
		document.getElementById("clockitem2").style.display = "none";
	} else {
		let d2 = new Date(new Date().getTime() + config.clock2_utc_offset * 3600 * 1000);
		renderClock("2", d2, config.clock2_name, true);
	}
	if (config.clock3_name == "hidden") {
		document.getElementById("clockitem3").style.display = "none";
	} else {
		let d3 = new Date(new Date().getTime() + config.clock3_utc_offset * 3600 * 1000);
		renderClock("3", d3, config.clock3_name, true);
	}
	// Events timers
	while (eventbox.firstChild) {
		eventbox.removeChild(eventbox.lastChild);
	}
	for (ev of config.events) {
		// { name, hr, min }
		if (("rep" in ev) && !(ev.rep.includes(currWeekdayChar))) {
			// Not the right weekday
			// TODO: test more
			continue;
		}
		let totalDiffMin = (ev.hr * 60 + ev.min) - (currHr * 60 + currMin + 1);
		let diffHr = Math.floor(totalDiffMin / 60);
		let diffMin = totalDiffMin % 60;
		let diffSec = 60 - currSec;
		if (totalDiffMin < config.event_display_duration_mins && totalDiffMin >= 0) {
			let evdisp = document.createElement("span");
			evdisp.className = "event";
			if (diffHr == 0) {
				evdisp.innerText = ev.name + " in " + padTime(diffMin) + " min " + padTime(diffSec) + " sec";
			} else {
				evdisp.innerText = ev.name + " in " + padTime(diffHr) + " hr " + padTime(diffMin) + " min " + padTime(diffSec) + " sec";
			}
			eventbox.appendChild(evdisp);
			let newbr = document.createElement("br");
			eventbox.appendChild(newbr);
		}
	}
}

// Update each second (only if the page is visible)
setInterval(() => {
	if (!document.hidden) {
		updateClock();
	}
}, 1000);

// First time loading the page
sortLinks();
updateFiltered("");
render();
updateClock();
// Load config from storage, if possible
loadConfig();
