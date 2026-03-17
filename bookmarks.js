function validateBookmarkPrefix(prefixArgument) {
    if (prefixArgument.length === 0) {
        return {
            valid: false,
            message: 'Omni prefix is required'
        };
    }
	if (prefixArgument.includes(" ")) {
		return {
			valid: false,
			message: `Omni prefix cannot contain spaces`
		};
	}
	if (native_bookmark_prefixes.includes(prefixArgument)) {
		return {
			valid: false,
			message: `Cannot use any existing bookmark prefixes: ${native_bookmark_prefixes.reduce((a, b) => a + ", " + b)}`
		};
	}
	return {
		valid: true,
		value: prefixArgument
	};
}

async function createBookmark(title, url) {
	const folderId = await ensureBookmarkFolder();
	await extension_api.bookmarks.create({
		parentId: folderId,
		title,
		url
	});
}

async function ensureBookmarkFolder() {
	const existing = await extension_api.bookmarks.search("Homepage Omni");
	const matchingFolder = existing.find((bookmark) => bookmark.title === "Homepage Omni" && typeof bookmark.url !== "string");
	if (matchingFolder) {
  		return matchingFolder.id;
	}

	const folder = await extension_api.bookmarks.create({
		title: "Homepage Omni"
	});
	return folder.id;
}
async function createBookmarkShortcuts(rawPrefixArgument) {
    if (is_chrome || !extension_api?.runtime?.getURL) {
		throw new Error("Bookmark keywords are only supported in Firefox");
	}

	const trimmedArgument = rawPrefixArgument.trim();
    const validation = validateBookmarkPrefix(trimmedArgument);
    if (!validation.valid) {
        throw new Error(validation.message);
    }
    const omniPrefix = validation.value;

    await browser.permissions.request({ permissions: ["bookmarks"] }).catch();
    const granted = await browser.permissions.getAll().then((permissions) => permissions?.permissions?.includes("bookmarks"));
    if (!granted || !extension_api?.bookmarks?.create) {
        updateFiltered(omnibar.value);
        throw new Error("Permission to create bookmarks was denied.");
    }

	const folderId = await ensureBookmarkFolder();
	const children = await extension_api.bookmarks.getChildren(folderId);
	for (const child of children) {
		await extension_api.bookmarks.remove(child.id);
	}

	const runtimeUrl = extension_api.runtime.getURL("homepage.html?q=%s");
	const createdPrefixes = [];
	const skippedPrefixes = [];

	for (const prefix of native_bookmark_prefixes) {
		const bookmarkUrl = runtimeUrl.replace("%s", `${encodeURIComponent(prefix)}%s`);
		try {
			await createBookmark(`Homepage Omni (${prefix})`, bookmarkUrl);
			createdPrefixes.push(prefix);
		} catch (_error) {
			skippedPrefixes.push(prefix);
		}
	}

	try {
		await createBookmark(`Homepage Omni (${omniPrefix})`, runtimeUrl);
		createdPrefixes.push(omniPrefix);
	} catch (_error) {
		skippedPrefixes.push(omniPrefix);
	}

	if (createdPrefixes.length === 0) {
		error_text = "Could not create bookmarks in Firefox.";
		updateFiltered(omnibar.value);
		return false;
	}

	let message = `Bookmarks created in the Homepage Omni folder for: ${createdPrefixes.join(", ")}. Assign Firefox keywords manually in bookmark properties.`;
	if (skippedPrefixes.length > 0) {
		message += `; skipped: ${skippedPrefixes.join(", ")}`;
	}
	error_text = message;
	updateFiltered(omnibar.value);
	return true;
}
