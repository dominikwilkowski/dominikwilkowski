document.addEventListener("DOMContentLoaded", () => {
	document.querySelectorAll(".highlight[data-fold]").forEach((container) => {
		const foldAttr = container.getAttribute("data-fold");
		let foldRanges = [];

		try {
			const jsonStr = foldAttr.replace(/'/g, '"');
			foldRanges = JSON.parse(jsonStr);
		} catch (e) {
			console.error("Code folding: Failed to parse data-fold attribute:", e);
			return;
		}

		const lineNumContainer = container.querySelector("td:first-child pre code");
		const codeContainer = container.querySelector("td:last-child pre code");

		if (!lineNumContainer || !codeContainer) {
			console.error(
				"Code folding: Could not find code or line number containers",
			);
			return;
		}

		const lineNumSpans = Array.from(
			lineNumContainer.querySelectorAll(":scope > span"),
		);
		const codeLines = Array.from(
			codeContainer.querySelectorAll(":scope > span"),
		);

		if (lineNumSpans.length === 0 || codeLines.length === 0) {
			console.error("Code folding: No code lines or line numbers found");
			return;
		}

		if (lineNumSpans.length != codeLines.length) {
			console.error(
				`Code folding: Line numbers (${lineNumSpans.length}) and code lines (${codeLines.length}) differ`,
			);
			return;
		}

		foldRanges.forEach((range) => {
			let startLine;
			let endLine;

			if (typeof range === "string" && range.includes("-")) {
				[startLine, endLine] = range.split("-").map((num) => parseInt(num, 10));
			} else {
				startLine = endLine =
					typeof range === "number" ? range : parseInt(range, 10);
			}

			const startIndex = startLine - 1;
			const endIndex = endLine - 1;

			if (
				startIndex < 0 ||
				endIndex >= codeLines.length ||
				endIndex >= lineNumSpans.length
			) {
				console.error(
					`Code folding: Invalid line range: ${startLine}-${endLine}`,
				);
				return;
			}

			const lineNumDetails = document.createElement("details");
			const codeDetails = document.createElement("details");

			const codeSummary = document.createElement("summary");
			codeSummary.textContent = `... ${endLine - startLine + 1} collapsed lines ...`;
			codeSummary.className = "code-folding-summary-code";
			codeDetails.appendChild(codeSummary);

			const lineNumSummary = document.createElement("summary");
			lineNumSummary.innerHTML = "&nbsp;";
			lineNumSummary.className = "code-folding-summary-linenumbers";
			lineNumDetails.appendChild(lineNumSummary);

			codeDetails.addEventListener("toggle", () => {
				if (codeDetails.open !== lineNumDetails.open) {
					lineNumDetails.open = codeDetails.open;
				}
			});

			lineNumDetails.addEventListener("toggle", () => {
				if (lineNumDetails.open !== codeDetails.open) {
					codeDetails.open = lineNumDetails.open;
				}
			});

			const firstLineNum = lineNumSpans[startIndex];
			const firstCodeLine = codeLines[startIndex];

			lineNumContainer.insertBefore(lineNumDetails, firstLineNum);
			codeContainer.insertBefore(codeDetails, firstCodeLine);

			for (let i = startIndex; i <= endIndex; i++) {
				if (lineNumSpans[i].parentNode === lineNumContainer) {
					lineNumDetails.appendChild(lineNumSpans[i]);
				}

				if (codeLines[i].parentNode === codeContainer) {
					codeDetails.appendChild(codeLines[i]);
				}
			}
		});
	});
});
