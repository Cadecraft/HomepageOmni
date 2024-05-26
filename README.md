# Homepage Omni

A custom homepage/new tab page extension for Firefox that let you create and access
quick links via an omnibar

- Productive: keyboard-based mouse-free interaction, available at any new tab page
- Customizable: add any links

:warning: This is a new in-progress project; not all of the commands and features listed are added yet.

## Commands

Type any string to filter through the list of links (described below)

<!-- TODO: impl all -->
Commands are prefixed with `:`.
- `:show` - Show all links by default (when the omnibar is empty)
- `:hide` - Hide all links by default

<!-- TODO: impl -->
Addresses are prefixed with `=`.
- `=example.com` - Go to example.com

<!-- TODO: impl -->
Searches are prefixed with `-`.
- `-rocks` - Google search for "rocks"

## Filtering Method

The links are filtered using these rules:
- Only links that contain the inputted filter string
- Case insensitive
- Left and right trimmed for spaces

The links are sorted using these rules:
- All links *starting* with the filter come first
- Sorted alphabetically
