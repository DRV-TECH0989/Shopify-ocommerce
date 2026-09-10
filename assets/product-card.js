(function () {
  'use strict';

  function initSwatches(card) {
    var swatches = card.querySelectorAll('[data-swatch]');
    var image = card.querySelector('[data-card-image]');
    var quickAdd = card.querySelector('[data-quick-add]');
    var currentPriceEl = card.querySelector('[data-current-price]');
    var comparePriceEl = card.querySelector('[data-compare-price]');
    var priceWrap = card.querySelector('[data-card-price]');

    swatches.forEach(function (swatch) {
      swatch.addEventListener('click', function () {
        swatches.forEach(function (s) {
          s.classList.remove('swatch--selected');
          s.setAttribute('aria-pressed', 'false');
        });
        swatch.classList.add('swatch--selected');
        swatch.setAttribute('aria-pressed', 'true');

        var variantId = swatch.getAttribute('data-variant-id');
        var variantImage = swatch.getAttribute('data-variant-image');
        var available = swatch.getAttribute('data-variant-available') === 'true';

        if (variantImage && image) {
          image.src = variantImage;
        }

        if (quickAdd && variantId) {
          quickAdd.setAttribute('data-variant-id', variantId);
          quickAdd.disabled = !available;
          quickAdd.classList.toggle('is-disabled', !available);
        }

        if (currentPriceEl) {
          var price = swatch.getAttribute('data-variant-price');
          if (price) currentPriceEl.textContent = price;
        }

        var hasCompare = swatch.getAttribute('data-variant-has-compare') === 'true';
        if (priceWrap) {
          if (hasCompare && comparePriceEl) {
            comparePriceEl.hidden = false;
            comparePriceEl.textContent = swatch.getAttribute('data-variant-compare-price');
            currentPriceEl && currentPriceEl.classList.add('product-card__price--sale');
          } else if (comparePriceEl) {
            comparePriceEl.hidden = true;
            currentPriceEl && currentPriceEl.classList.remove('product-card__price--sale');
          }
        }
      });
    });
  }

  function initQuickAdd(card) {
    var button = card.querySelector('[data-quick-add]');
    var status = card.querySelector('[data-quick-add-status]');
    if (!button) return;

    var pending = false;

    button.addEventListener('click', function () {
      // Guards against double-clicks / rapid repeat clicks firing
      // duplicate cart requests.
      if (pending) return;

      var variantId = button.getAttribute('data-variant-id');
      if (!variantId) return;

      pending = true;
      button.disabled = true;
      button.classList.add('is-loading');
      if (status) {
        status.hidden = true;
        status.textContent = '';
        status.classList.remove('is-error', 'is-success');
      }

      fetch(window.Shopify && window.Shopify.routes && window.Shopify.routes.root
        ? window.Shopify.routes.root + 'cart/add.js'
        : '/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ items: [{ id: variantId, quantity: 1 }] })
      })
        .then(function (response) {
          if (!response.ok) {
            return response.json().then(function (err) {
              throw new Error(err.description || 'Unable to add to cart');
            });
          }
          return response.json();
        })
        .then(function () {
          if (status) {
            status.hidden = false;
            status.textContent = 'Added to cart';
            status.classList.add('is-success');
          }
          // Let the rest of the theme know the cart changed, so the
          // cart drawer / icon bubble can refresh without a reload.
          document.dispatchEvent(new CustomEvent('cart:updated', { bubbles: true }));
        })
        .catch(function (error) {
          if (status) {
            status.hidden = false;
            status.textContent = error.message || 'Something went wrong. Please try again.';
            status.classList.add('is-error');
          }
        })
        .finally(function () {
          pending = false;
          button.disabled = false;
          button.classList.remove('is-loading');
        });
    });
  }

  function initCard(card) {
    initSwatches(card);
    initQuickAdd(card);
  }

  function initAll(root) {
    (root || document).querySelectorAll('[data-product-card]').forEach(initCard);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { initAll(); });
  } else {
    initAll();
  }

  document.addEventListener('shopify:section:load', function (evt) {
    initAll(evt.target);
  });
})();
