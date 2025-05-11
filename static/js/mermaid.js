import mermaid from "https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.esm.min.mjs";

const this_js_script = document.getElementById("mermaid_script");

function runmermaid() {
	mermaid.initialize({
		startOnLoad: false,
		theme: "neutral",
	});
	const items = document.querySelectorAll(".mermaid");
	let counter = 0;
	for (const item of items) {
		const id = counter++;
		if (item.originalCode === undefined) {
			item.originalCode = item.textContent.trim();
		}
		mermaid.render("mermaid" + id, item.originalCode).then(
			(val) => {
				item.innerHTML = val.svg;
			},
			(err) => {
				console.log(err);
				// Workaround: move incorrectly placed error messages into their diagram
				item.innerHTML = "";
				item.appendChild(document.getElementById("mermaid" + id));
			},
		);
	}
}
document.addEventListener("DOMContentLoaded", runmermaid);
window
	.matchMedia("(prefers-color-scheme: light)")
	.addEventListener("change", runmermaid);
