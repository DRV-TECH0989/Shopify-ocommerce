(function () {
  'use strict';

  function pad(n) {
    return String(Math.max(0, n)).padStart(2, '0');
  }

  function setDigits(unitEl, value) {
    var str = pad(value);
    var d1 = unitEl.querySelector('[data-d1]');
    var d2 = unitEl.querySelector('[data-d2]');
    if (d1) d1.textContent = str.charAt(0);
    if (d2) d2.textContent = str.charAt(1);
  }

  function initCountdown(root) {
    var targetAttr = root.getAttribute('data-target');
    var zeroAction = root.getAttribute('data-zero-action') || 'message';
    var endedMessage = root.parentElement.querySelector('[data-countdown-ended]');

    if (!targetAttr) return;

    var target = new Date(targetAttr).getTime();
    if (isNaN(target)) return; // merchant left it blank / malformed — fail silently, no broken UI

    var daysUnit = root.querySelector('[data-unit="days"]');
    var hoursUnit = root.querySelector('[data-unit="hours"]');
    var minutesUnit = root.querySelector('[data-unit="minutes"]');
    var secondsUnit = root.querySelector('[data-unit="seconds"]');

    var intervalId = null;

    function tick() {
      var now = Date.now();
      var diff = target - now;

      if (diff <= 0) {
        setDigits(daysUnit, 0);
        setDigits(hoursUnit, 0);
        setDigits(minutesUnit, 0);
        setDigits(secondsUnit, 0);

        if (zeroAction === 'message') {
          root.hidden = true;
          if (endedMessage) endedMessage.hidden = false;
        }
        // 'freeze' just leaves the timer on 00:00:00:00, so nothing else to do.

        if (intervalId) clearInterval(intervalId);
        return;
      }

      var totalSeconds = Math.floor(diff / 1000);
      var days = Math.floor(totalSeconds / 86400);
      var hours = Math.floor((totalSeconds % 86400) / 3600);
      var minutes = Math.floor((totalSeconds % 3600) / 60);
      var seconds = totalSeconds % 60;

      setDigits(daysUnit, days);
      setDigits(hoursUnit, hours);
      setDigits(minutesUnit, minutes);
      setDigits(secondsUnit, seconds);
    }

    tick();
    intervalId = setInterval(tick, 1000);

    // Stop the interval if the section is removed in the theme editor,
    // to avoid leaking timers when merchants add/remove sections live.
    document.addEventListener('shopify:section:unload', function (evt) {
      if (evt.target.contains(root) && intervalId) clearInterval(intervalId);
    });
  }

  function initAll() {
    document.querySelectorAll('[data-countdown]').forEach(initCountdown);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  // Re-init when the section is re-rendered inside the theme editor
  document.addEventListener('shopify:section:load', function (evt) {
    var el = evt.target.querySelector('[data-countdown]');
    if (el) initCountdown(el);
  });

  // Move focus to the success/error message so screen reader users
  // hear the result of their submission.
  document.addEventListener('DOMContentLoaded', function () {
    var successMsg = document.querySelector('[data-form-success]');
    var errorMsg = document.querySelector('[data-form-error]');
    if (successMsg) successMsg.focus();
    if (errorMsg) errorMsg.focus();
  });
})();
