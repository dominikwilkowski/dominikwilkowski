document.addEventListener("DOMContentLoaded", function () {
	document
		.querySelectorAll('code.language-diff span[style*="display:flex"]')
		.forEach((line) => {
			const txt = line.textContent.trim();
			if (txt.startsWith("+")) {
				line.classList.add("diff-add");
			} else if (txt.startsWith("-")) {
				line.classList.add("diff-del");
			}
		});

	const codeBlocks = document.querySelectorAll(".highlight");

	codeBlocks.forEach((codeBlock) => {
		if (codeBlock.className == "mermaid") return;
		const copyButton = document.createElement("button");
		copyButton.className = "copy-code-button";
		copyButton.textContent = "copy";

		// Insert the button inside the <pre> block
		codeBlock.appendChild(copyButton);

		copyButton.addEventListener("click", function () {
			const code = codeBlock.querySelector("td + td code");
			// Get the code content
			const textToCopy = code.textContent || code.innerText;

			// Use the Clipboard API to copy the text
			navigator.clipboard
				.writeText(textToCopy)
				.then(() => {
					// Change button text to "Copied"
					copyButton.textContent = "copied";

					setTimeout(() => {
						copyButton.textContent = "copy";
					}, 2000); // Reset the button text after 2 seconds
				})
				.catch((err) => {
					console.error("Unable to copy text:", err);
				});
		});
	});
});
