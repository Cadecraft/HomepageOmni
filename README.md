# Homepage Omni

A custom, lightweight homepage/new tab browser extension that lets
you create and access quick links via an omnibar

- Productive: keyboard-based mouse-free interaction, available at any new tab page
- Customizable: add any links, create events, etc. through a portable config file
- Simple: no complicated graphics or bulky UI elements
- Private: nothing you type in the bar is recorded until you hit enter

![A screenshot of HomepageOmni](screenshot.jpg "A screenshot of HomepageOmni")

## Installation

This extension works in both Firefox and Chrome, but is mostly tested in Firefox as my personal homepage.

To test out the extension on Firefox:
1. Download this source code
2. In Firefox, go to `about:debugging`
3. Go to the This Firefox section and click `Load Temporary Add-on...`
4. Upload this `manifest.json` file.

To add the extension to Chrome:
1. Download this source code
2. Go to `chrome://extensions`
3. Turn on Developer Mode in the top right
4. In the top left, Load Unpacked and upload this entire folder

Improved installation instructions will be added once this project becomes more complete. If you experience problems or have suggestions, feel free to create a GitHub issue.

Important breaking change: the names of keys for links has changed

## Commands

Type any string to filter through the list of links (described below); press enter to go to the link.

The up and down arrow keys can be used to switch between links from the filtered list.

Commands are prefixed with `:`.
- `:show` - Show all links by default (when the omnibar is empty)
- `:hide` - Hide all links by default
- `:set {link name} {link URL}` - Add or change a link with the given name
- `:delete {link name}` - Delete the link with the given name
- `:export` - Export/save the configuration to a .json file
- `:import` - Import/load the configuration from a .json file; be careful and only import files you trust
- `:resetconfig` - Reset the entire configuration

<!-- TODO: version command -->

Addresses are prefixed with `=`.
- `=example.com` - Go to https://example.com

Web searches are prefixed with `-`.
- `-marsupials` - Google search for "marsupials"

## Configuration file

<!-- TODO: document better -->

The configuration (the list of links, your settings, etc.) can be exported, edited, and imported as a `.json` file.
For some advanced configuration, you cannot use the omnibar commands and must edit the file manually.

Keys:
- `display_when_empty`: bool (default `true`)
- `links`: a list of link objects (see below)
- `events`: a list of event objects (see below)

Link object format example
```json
{
    "key": "Example Link",
    "href": "https://example.com",
    "priority": 0
}
```

Event object format example (creates an event Lunch Time at 12:25pm repeating each work weekday)

Note: hours are from 1 to 23; weekdays are 'Su', 'M', 'Tu', 'W', 'Th', 'F', and 'Sa'; if "rep" is not defined the event always repeats
```json
{
    "name": "Lunch Time",
    "hr": 12,
    "min": 25,
    "rep": "MTuWThF"
}
```

This configuration is also automatically locally stored in your browser whenever you import it, reset it, or make a change.

## Filtering Method

The links are filtered using these rules:
- Only links that contain the inputted filter string
- Case insensitive
- Left and right trimmed for spaces

The links are sorted using these rules:
- All links *starting* with the filter come first
- Sorted alphabetically
- Example: when searching "list", "List of fruits" comes before "Apples and oranges list"

## Permissions

This extension uses the following permissions:
- `webNavigation` - to follow links
- `storage` - to locally store only your configuration; nothing else is stored
