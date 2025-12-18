(function () {
	'use strict';

	var tinyslider = function () {
		var el = document.querySelectorAll('.testimonial-slider');

		if (el.length > 0) {
			var slider = tns({
				container: '.testimonial-slider',
				items: 1,
				axis: "horizontal",
				controlsContainer: "#testimonial-nav",
				swipeAngle: false,
				speed: 700,
				nav: true,
				controls: true,
				autoplay: true,
				autoplayHoverPause: true,
				autoplayTimeout: 3500,
				autoplayButtonOutput: false
			});
		}

		// Inicializar slider de produtos
		var productEl = document.querySelectorAll('.product-slider');
		if (productEl.length > 0) {
			var productSlider = tns({
				container: '.product-slider',
				items: 1,
				slideBy: 1,
				autoplay: true,
				autoplayHoverPause: true,
				autoplayTimeout: 4000,
				autoplayButtonOutput: false,
				controls: false, // Vamos usar botões customizados se necessário, ou true
				nav: true,
				gutter: 30,
				responsive: {
					0: { items: 1 },
					768: { items: 2 },
					992: { items: 3 } // Desktop mostra 3 produtos
				}
			});
		}
	};
	tinyslider();




	var sitePlusMinus = function () {

		var value,
			quantity = document.getElementsByClassName('quantity-container');

		function createBindings(quantityContainer) {
			var quantityAmount = quantityContainer.getElementsByClassName('quantity-amount')[0];
			var increase = quantityContainer.getElementsByClassName('increase')[0];
			var decrease = quantityContainer.getElementsByClassName('decrease')[0];
			increase.addEventListener('click', function (e) { increaseValue(e, quantityAmount); });
			decrease.addEventListener('click', function (e) { decreaseValue(e, quantityAmount); });
		}

		function init() {
			for (var i = 0; i < quantity.length; i++) {
				createBindings(quantity[i]);
			}
		};

		function increaseValue(event, quantityAmount) {
			value = parseInt(quantityAmount.value, 10);

			console.log(quantityAmount, quantityAmount.value);

			value = isNaN(value) ? 0 : value;
			value++;
			quantityAmount.value = value;
		}

		function decreaseValue(event, quantityAmount) {
			value = parseInt(quantityAmount.value, 10);

			value = isNaN(value) ? 0 : value;
			if (value > 0) value--;

			quantityAmount.value = value;
		}

		init();

	};
	sitePlusMinus();




	// Inicializar Lundev Slider (Custom)
	function initLundevSlider() {
		let sliderEl = document.querySelector('.lundev-slider');
		if (!sliderEl) return;

		let items = document.querySelectorAll('.lundev-slider .list .item');
		let next = document.getElementById('next');
		let prev = document.getElementById('prev');
		let thumbnails = document.querySelectorAll('.lundev-slider .thumbnail .item');

		let countItem = items.length;
		let itemActive = 0;

		if (next) {
			next.onclick = function () {
				itemActive = itemActive + 1;
				if (itemActive >= countItem) {
					itemActive = 0;
				}
				showSlider();
			}
		}

		if (prev) {
			prev.onclick = function () {
				itemActive = itemActive - 1;
				if (itemActive < 0) {
					itemActive = countItem - 1;
				}
				showSlider();
			}
		}

		let refreshInterval = setInterval(() => {
			if (next) next.click();
		}, 5000)

		function showSlider() {
			let itemActiveOld = document.querySelector('.lundev-slider .list .item.active');
			let thumbnailActiveOld = document.querySelector('.lundev-slider .thumbnail .item.active');
			if (itemActiveOld) itemActiveOld.classList.remove('active');
			if (thumbnailActiveOld) thumbnailActiveOld.classList.remove('active');

			if (items[itemActive]) items[itemActive].classList.add('active');
			if (thumbnails[itemActive]) {
				thumbnails[itemActive].classList.add('active');
				// Removed scrollIntoView to prevent page jumping/scrolling user back to slider
			}

			clearInterval(refreshInterval);
			refreshInterval = setInterval(() => {
				if (next) next.click();
			}, 5000)
		}

		thumbnails.forEach((thumbnail, index) => {
			thumbnail.addEventListener('click', () => {
				itemActive = index;
				showSlider();
			})
		})
	}
	initLundevSlider();

})()

	/* New Menu JS */
	(function () {
		const buttons = document.querySelectorAll(".menu__item");
		let activeButton = document.querySelector(".menu__item.active");

		function updateLineWidth() {
			buttons.forEach(item => {
				const text = item.querySelector(".menu__text");
				if (text) setLineWidth(text, item);
			});
		}

		window.addEventListener("resize", updateLineWidth);
		// Run once on load
		setTimeout(updateLineWidth, 100);

		buttons.forEach(item => {
			const text = item.querySelector(".menu__text");
			if (!text) return;

			// Initialize
			setLineWidth(text, item);

			item.addEventListener("click", function () {
				if (this.classList.contains("active")) return;

				this.classList.add("active");

				if (activeButton) {
					activeButton.classList.remove("active");
					let activeText = activeButton.querySelector(".menu__text");
					if (activeText) activeText.classList.remove("active");
				}

				// Activate text with a slight delay to allow flex-grow to start,
				// or use transitionEnd. We'll use a timeout as fallback.
				handleTransition(this, text);
				activeButton = this;
			});
		});

		function setLineWidth(text, item) {
			if (text && item) {
				const lineWidth = text.offsetWidth + "px";
				item.style.setProperty("--lineWidth", lineWidth);
			}
		}

		function handleTransition(item, text) {
			let transitionFinished = false;
			const onTransitionEnd = (e) => {
				if (e.propertyName !== "flex-grow" || !item.classList.contains("active")) return;
				transitionFinished = true;
				text.classList.add("active");
				item.removeEventListener("transitionend", onTransitionEnd);
			};

			item.addEventListener("transitionend", onTransitionEnd);

			// Fallback in case transitionEnd doesn't fire (e.g. if tab invalid or styles overridden)
			setTimeout(() => {
				if (!transitionFinished && item.classList.contains("active")) {
					text.classList.add("active");
					item.removeEventListener("transitionend", onTransitionEnd);
				}
			}, 500); // slightly longer than .45s
		}
	})();