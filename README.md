# Homepage Omni

A custom homepage/new tab page extension for Firefox that let you create and access
quick links via an omnibar

- Productive: keyboard-based mouse-free interaction, available at any new tab page
- Customizable: add any links
- Private: nothing you type in the bar is recorded

<!-- TODO: images -->
:warning: This is a new in-progress project; not all of the commands and features listed are added yet.

## Commands

Type any string to filter through the list of links (described below)

<!-- TODO: impl all -->
Commands are prefixed with `:`.
- `:show` - Show all links by default (when the omnibar is empty)
- `:hide` - Hide all links by default
- `:set {link name} {link url}` - Add or change a link with the given name
- `:delete {link name}` - Delete the link with the given name
- `:export` - Export/save the list of links to a .csv file
- `:import` - Import/load the list of links from a .csv file

<!-- TODO: impl -->
Addresses are prefixed with `=`.
- `=example.com` - Go to example.com

<!-- TODO: impl -->
Web searches are prefixed with `-`.
- `-marsupials` - Google search for "marsupials"

## Filtering Method

The links are filtered using these rules:
- Only links that contain the inputted filter string
- Case insensitive
- Left and right trimmed for spaces

The links are sorted using these rules:
- All links *starting* with the filter come first
- Sorted alphabetically
- Example: when searching "list", "List of fruits" comes before "Apples and oranges list"
