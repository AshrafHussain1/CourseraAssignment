(() => {
	"use strict";

	const componentStyles = document.createElement("style");
	componentStyles.textContent = `
		.menu-toggle,
		.project-filters button {
			padding: 0.75rem 1.25rem;
			border: 0;
			border-radius: 6px;
			background-color: #168579;
			color: #fff;
			cursor: pointer;
			font: inherit;
			font-weight: 700;
		}

		.menu-toggle:hover,
		.menu-toggle:focus-visible,
		.project-filters button:hover,
		.project-filters button:focus-visible,
		.project-filters button[aria-pressed="true"] {
			background-color: #116b62;
		}

		.menu-toggle:focus-visible,
		.project-filters button:focus-visible {
			outline: 2px solid #168579;
			outline-offset: 2px;
		}

		.project-filters {
			display: flex;
			flex-wrap: wrap;
			gap: 0.75rem;
		}
	`;
	document.head.append(componentStyles);

	const nav = document.querySelector("header nav");
	const navList = nav?.querySelector("ul");
	if (nav && navList) {
		const menuButton = document.createElement("button");
		menuButton.type = "button";
		menuButton.className = "menu-toggle";
		menuButton.textContent = "☰ Menu";
		menuButton.setAttribute("aria-label", "Toggle navigation menu");
		menuButton.setAttribute("aria-expanded", "false");
		nav.insertBefore(menuButton, navList);

		function toggleMenu(open = menuButton.getAttribute("aria-expanded") !== "true") {
			menuButton.setAttribute("aria-expanded", String(open));
			navList.hidden = !open;
		}
		toggleMenu(false);
		menuButton.addEventListener("click", () => toggleMenu());
		navList.addEventListener("click", (event) => {
			if (event.target.closest('a[href^="#"]')) toggleMenu(false);
		});
	}

	document.addEventListener("click", (event) => {
		const link = event.target.closest('a[href^="#"]');
		if (!link || !link.hash) return;
		const target = document.getElementById(decodeURIComponent(link.hash.slice(1)));
		if (!target) return;
		event.preventDefault();
		target.scrollIntoView({
			behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
			block: "start"
		});
		history.replaceState(null, "", link.hash);
	});

	const projects = document.querySelector("#projects");
	const cards = projects ? [...projects.querySelectorAll("article")] : [];
	function filterProjects(category) {
		cards.forEach((card) => {
			card.hidden = category !== "all" && card.dataset.category !== category;
		});
		projects?.querySelectorAll("[data-filter]").forEach((button) => {
			button.setAttribute("aria-pressed", String(button.dataset.filter === category));
		});
	}

	if (projects && cards.length) {
		cards.forEach((card, index) => {
			card.dataset.category ||= index === 1 ? "productivity" : "web";
		});
		const filters = document.createElement("div");
		filters.className = "project-filters";
		filters.style.gridColumn = "1 / -1";
		filters.style.flex = "0 0 100%";
		filters.style.width = "100%";
		filters.style.boxSizing = "border-box";
		filters.setAttribute("aria-label", "Filter projects");
		["all", ...new Set(cards.map((card) => card.dataset.category))].forEach((category) => {
			const button = document.createElement("button");
			button.type = "button";
			button.dataset.filter = category;
			button.textContent = category === "all" ? "All" : category[0].toUpperCase() + category.slice(1);
			button.setAttribute("aria-pressed", String(category === "all"));
			button.addEventListener("click", () => filterProjects(category));
			filters.append(button);
		});
		projects.insertBefore(filters, cards[0]);

		if (typeof HTMLDialogElement !== "undefined") {
			const lightbox = document.createElement("dialog");
			lightbox.setAttribute("aria-label", "Project image preview");
			lightbox.innerHTML = '<button type="button" aria-label="Close image preview">×</button><img alt=""><p></p>';
			document.body.append(lightbox);
			const preview = lightbox.querySelector("img");
			const caption = lightbox.querySelector("p");
			projects.querySelectorAll("article img").forEach((image) => {
				image.tabIndex = 0;
				image.setAttribute("role", "button");
				image.setAttribute("aria-label", `Enlarge image: ${image.alt || "project image"}`);
				const open = () => {
					preview.src = image.currentSrc || image.src;
					preview.alt = image.alt;
					caption.textContent = image.closest("figure")?.querySelector("figcaption")?.textContent || image.alt;
					lightbox.showModal();
				};
				image.addEventListener("click", open);
				image.addEventListener("keydown", (event) => {
					if (event.key === "Enter" || event.key === " ") {
						event.preventDefault();
						open();
					}
				});
			});
			lightbox.querySelector("button").addEventListener("click", () => lightbox.close());
			lightbox.addEventListener("click", (event) => {
				if (event.target === lightbox) lightbox.close();
			});
		}
	}

	const form = document.querySelector("#contact form");
	if (form) {
		const fields = [
			{ input: form.elements.namedItem("name"), message: "Please enter your name." },
			{ input: form.elements.namedItem("email"), message: "Please enter a valid email address." },
			{ input: form.elements.namedItem("message"), message: "Please enter a message." }
		];
		const feedback = document.createElement("p");
		feedback.setAttribute("aria-live", "polite");
		form.append(feedback);

		function validateField({ input, message }) {
			const value = input.value.trim();
			const error = !value || (input.type === "email" && !input.validity.valid) ? message : "";
			input.setCustomValidity(error);
			input.setAttribute("aria-invalid", String(Boolean(error)));
			let errorText = form.querySelector(`[data-error-for="${input.id}"]`);
			if (!errorText) {
				errorText = document.createElement("span");
				errorText.dataset.errorFor = input.id;
				input.insertAdjacentElement("afterend", errorText);
			}
			errorText.textContent = error;
			return !error;
		}

		fields.forEach((field) => {
			field.input.addEventListener("input", () => validateField(field));
			field.input.addEventListener("blur", () => validateField(field));
		});
		form.addEventListener("submit", (event) => {
			event.preventDefault();
			if (!fields.map(validateField).every(Boolean)) {
				feedback.textContent = "Please correct the highlighted fields.";
				fields.find(({ input }) => input.getAttribute("aria-invalid") === "true")?.input.focus();
				return;
			}
			feedback.textContent = "Thanks! Your form is valid. Connect a form service to send your message.";
			form.reset();
			fields.forEach((field) => validateField(field));
		});
	}
})();
