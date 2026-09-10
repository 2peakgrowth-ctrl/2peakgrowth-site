/* ============================================================
   2Peak Growth — main.js
   Minimal JS: mobile nav toggle + intake form handling.
   ============================================================ */

document.addEventListener("DOMContentLoaded", function () {
  initMobileNav();
  initLeadForm();
});

/* ---------- Mobile nav ---------- */
function initMobileNav() {
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");

  if (!toggle || !links) return;

  toggle.addEventListener("click", function () {
    var isOpen = links.classList.toggle("is-open");
    toggle.classList.toggle("is-open", isOpen);
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  // Close menu when a nav link is tapped (mobile).
  links.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      links.classList.remove("is-open");
      toggle.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

/* ---------- Intake form (start.html) ---------- */

// TODO: insert Supabase anon (public) key before deploying.
// This is the project's public anon key, safe for client-side use
// as long as Row Level Security policies are configured on web_leads.
var SUPABASE_URL = "https://eihxkwbtjwzkadvjkxol.supabase.co/rest/v1/web_leads";
var SUPABASE_ANON_KEY = "sb_publishable_FWRT1cIb0mqMaMreuCPITg_vKhY5j_J"; // <-- replace before deploy

function initLeadForm() {
  var form = document.getElementById("lead-form");
  if (!form) return;

  var statusBox = document.getElementById("form-status");
  var submitBtn = form.querySelector("button[type='submit']");

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    hideStatus();

    var values = getFormValues(form);
    var isValid = validateForm(form, values);

    if (!isValid) {
      return;
    }

    setSubmitting(true);

    var payload = {
      name: values.name,
      business_name: values.business_name,
      phone: values.phone,
      email: values.email || null,
      city: values.city,
      interest: values.interest,
      current_website: values.current_website || null,
      review_count: values.review_count ? Number(values.review_count) : null,
      message: values.message || null,
      source: "website",
    };

    fetch(SUPABASE_URL, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: "Bearer " + SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(payload),
    })
      .then(function (response) {
        if (!response.ok) {
          return response.text().then(function (text) {
            throw new Error("Submission failed (" + response.status + "): " + text);
          });
        }
        form.hidden = true;
        showStatus(
          "success",
          "Thanks — we've got your info. We'll be in touch within 24 hours."
        );
      })
      .catch(function (err) {
        console.error("Lead form submission error:", err);
        showStatus(
          "error",
          "Something went wrong sending your info. Please try again, or call/email us directly."
        );
      })
      .finally(function () {
        setSubmitting(false);
      });
  });

  function setSubmitting(isSubmitting) {
    if (!submitBtn) return;
    submitBtn.disabled = isSubmitting;
    submitBtn.textContent = isSubmitting ? "Sending…" : "Submit";
  }

  function showStatus(type, message) {
    if (!statusBox) return;
    statusBox.textContent = message;
    statusBox.classList.remove("is-success", "is-error");
    statusBox.classList.add("is-visible", type === "success" ? "is-success" : "is-error");
    statusBox.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function hideStatus() {
    if (!statusBox) return;
    statusBox.classList.remove("is-visible", "is-success", "is-error");
    statusBox.textContent = "";
  }
}

function getFormValues(form) {
  var interestInput = form.querySelector("input[name='interest']:checked");
  return {
    name: form.querySelector("#name").value.trim(),
    business_name: form.querySelector("#business_name").value.trim(),
    phone: form.querySelector("#phone").value.trim(),
    email: form.querySelector("#email").value.trim(),
    city: form.querySelector("#city").value.trim(),
    interest: interestInput ? interestInput.value : "",
    current_website: form.querySelector("#current_website").value.trim(),
    review_count: form.querySelector("#review_count").value.trim(),
    message: form.querySelector("#message").value.trim(),
  };
}

function validateForm(form, values) {
  var isValid = true;

  isValid = requireField(form, "name", values.name.length > 0, "Please enter your name.") && isValid;
  isValid =
    requireField(
      form,
      "business_name",
      values.business_name.length > 0,
      "Please enter your business name."
    ) && isValid;

  var digitCount = values.phone.replace(/\D/g, "").length;
  isValid =
    requireField(
      form,
      "phone",
      digitCount >= 10,
      "Please enter a valid phone number (10+ digits)."
    ) && isValid;

  isValid = requireField(form, "city", values.city.length > 0, "Please enter your city.") && isValid;

  isValid =
    requireField(form, "interest", values.interest.length > 0, "Please choose one option.") &&
    isValid;

  if (values.email) {
    var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email);
    isValid = requireField(form, "email", emailOk, "Please enter a valid email address.") && isValid;
  } else {
    clearFieldError(form, "email");
  }

  return isValid;
}

function requireField(form, name, condition, message) {
  var fieldWrap = form.querySelector('[data-field="' + name + '"]');
  if (!fieldWrap) return condition;

  var errorEl = fieldWrap.querySelector(".field-error");

  if (condition) {
    fieldWrap.classList.remove("has-error");
    if (errorEl) errorEl.textContent = "";
    return true;
  }

  fieldWrap.classList.add("has-error");
  if (errorEl) errorEl.textContent = message;
  return false;
}

function clearFieldError(form, name) {
  var fieldWrap = form.querySelector('[data-field="' + name + '"]');
  if (!fieldWrap) return;
  fieldWrap.classList.remove("has-error");
  var errorEl = fieldWrap.querySelector(".field-error");
  if (errorEl) errorEl.textContent = "";
}
