// Homepage Omni
// Cadecraft
// v0.1.0; 2024/05/25

// TODO:
// Make into extension
// Implement all commands
// Create git and repo
// Max height and scroll bar for the link list
// Filesystem/exporting/importing/saving links
// Save config setting of display_when_empty
// Allow changing your search engine
// Tabbing from the bar doesn't work well

// Data
// { key, href, priority }
// TODO: rename these without the "link_" prefix?
let links = [
	{ link_key: "Example Link", link_href: "https://example.com", link_priority: 0 },
	{ link_key: "1. Link 1", link_href: "https://mail.google.com", link_priority: 0 },
	{ link_key: "2. Link 5", link_href: "https://mail.google.com", link_priority: 0 },
	{ link_key: "3. Link 3", link_href: "https://google.com", link_priority: 0 },
	{ link_key: "4. Link 4", link_href: "https://google.com", link_priority: 0 },
	{ link_key: "5. Link 9", link_href: "https://google.com", link_priority: 0 },
	{ link_key: "4. Link 4", link_href: "https://google.com", link_priority: 0 }
];
let links_filtered = [];
let display_when_empty = true; // Whether to display when the box is empty
let error_text = "";

// Process entered input and return whether successful
function processInput(new_value) {
	// Determine type by first character
	if (!new_value || new_value.length == 0) return false; // Invalid
	if (new_value.startsWith(":")) {
		// Command
		// TODO: impl
		if (new_value == ":show") display_when_empty = true;
		else if (new_value == ":hide") display_when_empty = false;
		else {
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
		// Link: choose the first filtered
		if (links_filtered.length == 0) {
			// Cannot do anything
			error_text = "No matching links";
			return false;
		} else {
			// Go to the link
			window.location.href = links_filtered[0].link_href;
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
	// Based on the contents of the box
	let trimmed = new_value.trim().toLowerCase();
	if (trimmed == "") {
		// Empty: show or hide, based on the setting
		if (display_when_empty) {
			links_filtered = links.slice();
		} else {
			links_filtered = [];
		}
	} else {
		// Not empty: filter
		links_filtered = [];
		for (const link of links) {
			if (link.link_key.toLowerCase().includes(trimmed)) {
				links_filtered.push(structuredClone(link));
				if (link.link_key.toLowerCase().startsWith(trimmed)) {
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
	} else if (new_value.startsWith(":")) {
		helptext.className = "normal";
		helptext.innerText = "Enter a command (ex. :hide)";
	} else if (new_value.startsWith("=")) {
		helptext.className = "normal";
		helptext.innerText = "Enter an address (ex. =example.com)";
	} else if (new_value.startsWith("-")) {
		helptext.className = "normal";
		helptext.innerText = "Enter a web search (ex. -marsupials)";
	} else {
		helptext.className = "normal";
		helptext.innerText = "";
	}
}

// Render
const listbox = document.getElementById("listbox");
function render() {
	// Clear the list
	while (listbox.firstChild) {
		listbox.removeChild(listbox.lastChild);
	}
	// Based on the links which have been filtered
	let first_item = true;
	for (const link of links_filtered) {
		// Render the link
		const new_div = document.createElement("div");
		if (first_item) new_div.className = "linkitem_selected";
		else new_div.className = "linkitem_normal";
		const new_a = document.createElement("a");
		new_a.href = link.link_href;
		new_a.innerText = link.link_key;
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

// First time loading the page
sortLinks();
updateFiltered("");
render();
