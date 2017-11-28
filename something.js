/*! signup-form-widget - v1.0.79 - 2017-11-16 */(function(root, factory) {
    function isES5Compliant(Obj, Arr) {
        return Obj.seal && Obj.create && Arr.isArray && 'x'[0] === 'x';
    }

    // If ES5 is poorly supported in this browser, we will not load.
    if (!isES5Compliant(Object, Array)) return;

    function hasLocalStorage() {
        return window.localStorage && typeof window.localStorage.getItem === 'function' && typeof window.localStorage.setItem === 'function' && typeof window.localStorage.removeItem === 'function';
    }

    // if local storage is not present, do not load
    if (!hasLocalStorage()) return;

    var jquery_lib, jquery_url, underscore_url, css_link, recaptcha_url,
        ctctLibs = {},
        jquery_major = 1,
        jquery_minor = 7,
        underscore_major = 1,
        underscore_minor = 5;

    jquery_url = 'https://cdnjs.cloudflare.com/ajax/libs/jquery/2.1.4/jquery.js';
    underscore_url = 'https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.8.3/underscore-min.js';
    recaptcha_url = 'https://www.google.com/recaptcha/api.js?onload=ctctOnLoadCallback&render=explicit';

    /*
     * SUPPORTED BROWSERS
     * Chrome (Last 3), Firefox (Last 3), Safari (10+), Edge (Last 2), IE11, Samsung
     *
     * WORKING BROWSERS:
     * Chrome (1+), Firefox (21+), Safari (5+), Edge (13+), IE10+, Samsung
     *
     * Q: Why is there a discrepancy?
     * A: Most browsers (Chrome, Firefox, Safari, Edge) are EverGreen, meaning they update
     *    themselves. The vast majority of clients using EverGreen browsers are using
     *    one of the most recent 2 releases of that browser.
     *
     *    We won't block older versions if they work, though, because it would mean more
     *    unnecessary checking just to make our product less universally usable.
      */
    function isSafeBrowser(root) {
        // Matches IE 8+
        var isIE = !!document.documentMode;

        // Matches Edge 13+
        var isEdge = !isIE && !!root.StyleMedia;

        // Matches IE 10+, including Edge
        var isIETenPlus = isEdge || (isIE && root.atob);

        // Matches Chrome 1+
        var isChrome = !!root.chrome && !!root.chrome.webstore;

        // Matches Firefox 21+
        var isFirefox = !!root.InstallTrigger && !!root.location && !!root.location.origin;

        // Check Safari Push Notifications object string representation
        var pushCheck = function(p) { return p.toString() === "[object SafariRemoteNotification]"; };
        var safariNotifications = !root.safari || root.safari.pushNotification;
        var isMobileSafari = typeof root.navigator.standalone !== 'undefined';

        // Matches Safari 3.0+ "[object HTMLElementConstructor]"
        // This serves as our "is this safari?" check: our ES5 check verifies the version.
        var isSafari = /constructor/i.test(window.HTMLElement)
                        || pushCheck(safariNotifications)
                        || isMobileSafari;

        // Matches Browsers powered by Blink engine: it is probably ok to load
        var isBlink = isChrome || (!!root.Intl && !!root.Intl.v8BreakIterator && !!root.CSS);

        // Matches Samsung browser (Stock on galaxy phones)
        var isSamsung = !!root.navigator && /SamsungBrowser/i.test(root.navigator.userAgent);

        // EverGreen browsers update themselves
        var isEverGreen = isFirefox || isSafari || isChrome;

        // Browser must be evergreen, powered by blink, samsung, windows phone, or IE 10+
        return isEverGreen || isSamsung || isBlink || isIETenPlus;
    }

    function semanticVersionIsCorrect(ver, reqMajor, reqMinor) {
        var splitVer = ver.toString().split('.');
        var major = splitVer[0] || 0;
        var minor = splitVer[1] || 0;

        if (major > reqMajor) {
            return true;
        }
        if (major == reqMajor && minor >= reqMinor) {
            return true;
        }

        return false;
    }

    function jQueryIsValid(jQueryOnPage) {
        if (typeof jQueryOnPage !== 'function') {
            return false;
        }

        var j = jQueryOnPage();

        /*
         * a semantic version must have at least (major).(minor)
         * if major version is greater than 1, we're ok
         */
        return (
            j &&
            j.jquery &&
            semanticVersionIsCorrect(j.jquery, jquery_major, jquery_minor)
        );
    }

    function underscoreIsValid(underscoreOnPage) {
        return (
            /*
             * _.VERSION is a private property, so it may be removed in future versions.
             * However, if it is removed, we are clearly in the wrong version.
             * So fail the check.
             */
            underscoreOnPage &&
            underscoreOnPage.VERSION &&
            semanticVersionIsCorrect(underscoreOnPage.VERSION, underscore_major, underscore_minor) &&
            underscoreOnPage.contains &&
            underscoreOnPage.each &&
            underscoreOnPage.findWhere &&
            underscoreOnPage.isEmpty &&
            underscoreOnPage.map &&
            underscoreOnPage.sortBy
        );
    }

    function grecaptchaScriptTagIsOnPage() {
        var grecaptchaScriptTagOnPage = false;

        ctctLibs._.each(document.getElementsByTagName('script'), function(scriptTag) {
            if (!grecaptchaScriptTagOnPage) {
                grecaptchaScriptTagOnPage = (
                    /(google.com\/recaptcha|gstatic.com\/recaptcha)/.test(scriptTag.src) &&
                    (scriptTag.async || scriptTag.defer)
                );
            }
        });

        return grecaptchaScriptTagOnPage;
    }

    function grecaptchaObjectIsValid(grecaptchaOnPage) {
        return (
            grecaptchaOnPage &&
            typeof grecaptchaOnPage.render === 'function' &&
            typeof grecaptchaOnPage.reset === 'function' &&
            typeof grecaptchaOnPage.getResponse === 'function' &&
            typeof grecaptchaOnPage.execute === 'function'
        );
    }

    function grecaptchaIsValid(grecaptchaOnPage) {
        /*
         * We have to detect if the page already has recaptcha v2 on it
         * because recaptcha will break if there are two copies loaded
         *
         * the grecaptcha object on window indicates the library is loaded
         * but sometimes the library takes a while before the object is on window
         *
         * that can lead to collisions if we only check for the grecaptcha object.
         *
         * therefore, we loop over all script tags on the page and see if any of them
         * have 'google.com/recaptcha' or 'gstatic.com/recaptcha' in the src.
         *
         * only if there are no such script tags do we inspect the grecaptcha object.
         */

        return grecaptchaScriptTagIsOnPage() || grecaptchaObjectIsValid(grecaptchaOnPage);
    }

    function loadRecaptchaScript() {
        /**
         * If we're in the product, then we're in previewMode.
         * Not only do we have no need for recaptcha when we are in
         * preview mode, we should never delay the return of the
         * SignUpFormWidget object in wrapper_post by waiting on the
         * result of AJAX calls for dependencies.
         *
         * If we delay the return of the SignUpFormWidget object in
         * wrapper_post, Listgrowth-static will find the SignUpFormWidget
         * object to be undefined when it tries to instantiate the
         * preview API, and the experience will crash.
         */
        ctctLibs.previewMode = window.ListGrowthStaticUI !== undefined;

        if (ctctLibs.previewMode || grecaptchaIsValid(window.grecaptcha)) {
            ctctOnLoadCallback();
        }
        else {
            ctctLibs.$.ajax({
                url: recaptcha_url, // contains onload callback via recaptcha api
                dataType: 'script',
                cache: true
            })
            .fail(function() {
                window.console.error('ERROR: Failed to load ReCaptcha for sign up form script');
            })
        }
    }

    window.ctctOnLoadCallback = function ctctOnLoadCallback() {
        ctctLibs.root.SignUpFormWidget = factory(ctctLibs.root, ctctLibs.$, ctctLibs._, window.grecaptcha, ctctLibs.previewMode);
    };

    /*
     * @param Object event auto-passed this function is an onload callback to $ script
     * this event evaluates to true, so we can't just pass a "skipNoConflict" param
     * for simple boolean checking
     */
    function loadScripts(event) {
        var skipNoConflict = event.skipNoConflict;
        if (!root.jQuery) {
            window.console.error('ERROR: Failed to load jQuery for sign up form script');
            return;
        }

        ctctLibs.$ = skipNoConflict ? root.jQuery : root.jQuery.noConflict();

        if (underscoreIsValid(root._)) {
            ctctLibs._ = root._;
            loadRecaptchaScript();
        } else {
            ctctLibs.$.ajax({
                url: underscore_url,
                dataType: 'script',
                cache: true
            })
            .done(function() {
                ctctLibs._ = root._.noConflict();
                loadRecaptchaScript();
            })
            .fail(function() {
                window.console.error('ERROR: Failed to load underscore dependency');
            });
        }
        return;
    }

    if (isSafeBrowser(root)) {
        var SignUpFormWidget = window.SignUpFormWidget || {};
        ctctLibs.root = root;
        if (jQueryIsValid(root.jQuery)) {
            window.SignUpFormWidget = new jQuery.Deferred();
            loadScripts({ skipNoConflict: true });
        } else {
            jquery_lib = document.createElement('script');
            document.head.appendChild(jquery_lib);
            jquery_lib.async = true;
            jquery_lib.defer = true;
            jquery_lib.onload = loadScripts;
            jquery_lib.src = jquery_url;
        }
    }
}(this, function(root, $, _, grecaptcha, previewMode) {
    'use strict';

var SignUpFormWidget = window.SignUpFormWidget || {};

SignUpFormWidget.previewMode = previewMode;

var _ctct_m = window._ctct_m || undefined;

/** @namespace SignUpFormWidget.Helpers */
SignUpFormWidget.Helpers = SignUpFormWidget.Helpers || {};
/** @namespace SignUpFormWidget.Validation */
SignUpFormWidget.Validation = SignUpFormWidget.Validation || {};
/** @namespace SignUpFormWidget.Errors */
SignUpFormWidget.Errors = SignUpFormWidget.Errors || {};
/** @namespace SignUpFormWidget.Handlers */
SignUpFormWidget.Handlers = SignUpFormWidget.Handlers || {};
/** @namespace SignUpFormWidget.Render */
SignUpFormWidget.Render = SignUpFormWidget.Render || {};

/** @private */
SignUpFormWidget._instances = SignUpFormWidget._instances || {};
/** @namespace SignUpFormWidget.Instance */
SignUpFormWidget.Instance = SignUpFormWidget.Instance || {};
/** @namespace SignUpFormWidget.Api */
SignUpFormWidget.Api = SignUpFormWidget.Api || {};
/**
 * @namespace SignUpFormWidget.RenderedCaptchas
 * Used to map captcha IDs to form indices
*/
SignUpFormWidget.RenderedCaptchas = SignUpFormWidget.RenderedCaptchas || {};

SignUpFormWidget = SignUpFormWidget || {};
SignUpFormWidget["JST"] = SignUpFormWidget["JST"] || {};

SignUpFormWidget["JST"]["dist/templates/da/inline_form.html"] = function(data) {
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
__p += '<div class="ctct-form-container ctct-form-embed form_' +
__e( data.form_index ) +
'">\n    <div class="ctct-form-defaults" data-qe-id="form-background">\n        <div id="success_message_' +
__e( data.form_index ) +
'" class="ctct-form-success" style="display:none;" data-qe-id="success-message">\n            <h2 class="ctct-form-header">Tak for tilmeldingen!</h2>\n            <p class="ctct-form-text">Du kan nÃ¥r som helst framelde dig via linket Frameld mig nederst i hver e-mail.</p>\n        </div>\n        <form class="ctct-form-custom" id="ctct_form_' +
__e( data.form_index ) +
'" autocomplete="on" data-qe-id="form-data">\n            ';
 if(!_.isEmpty(data.titleText)) { ;
__p += '\n            <h2 data-qe-id="form-title" class="ctct-form-header">' +
__e( data.titleText ) +
'</h2>\n            ';
 } ;
__p += '\n            ';
 if(!_.isEmpty(data.descriptionText)) { ;
__p += '\n            <p data-qe-id="form-description" class="ctct-form-text">' +
__e( data.descriptionText ) +
'</p>\n            ';
 } ;
__p += '\n\n            <div id="email_address_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-email" id="email_address_label_' +
__e( data.form_index ) +
'" for="email_address_' +
__e( data.form_index ) +
'" class="ctct-form-label ctct-form-required">E-mail-adresse</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-email" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-email" id="email_address_' +
__e( data.form_index ) +
'" type="email" name="email_address" value="" maxlength="80">\n            </div>\n\n            ';
 if(_.contains(data.contact_fields, 'first_name')) { ;
__p += '\n            <div id="first_name_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-first-name" id="first_name_label_' +
__e( data.form_index ) +
'" for="first_name_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Fornavn</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-first-name" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-first-name" id="first_name_' +
__e( data.form_index ) +
'" type="text" name="first_name" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'last_name')) { ;
__p += '\n            <div id="last_name_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-last-name" id="last_name_label_' +
__e( data.form_index ) +
'" for="last_name_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Efternavn</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-last-name" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-last-name" id="last_name_' +
__e( data.form_index ) +
'" type="text" name="last_name" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'phone')) { ;
__p += '\n            <div id="phone_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-phone" id="phone_label_' +
__e( data.form_index ) +
'" for="phone_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Telefonnummer</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-phone" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-phone" id="phone_' +
__e( data.form_index ) +
'" type="tel" name="phone" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'country')) { ;
__p += '\n            <div id="country_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-country" id="country_label_' +
__e( data.form_index ) +
'" for="country_' +
__e( data.form_index ) +
'" class="ctct-form-label ">VÃ¦lg et land</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-country" style="display: none;"></div>\n                <select class="ctct-select-element" data-qe-id="form-select-country-' +
__e( data.form_index ) +
'" id="country_' +
__e( data.form_index ) +
'" name="country">\n                    <option value="">--</option>\n                    ';
 _.each(data._defaults.countries, function(country) { ;
__p += '\n                        ';
 if (country.countryCode === data.selectedCountry) { ;
__p += '\n                            <option value="' +
__e( country.countryCode ) +
'" selected>' +
__e( country.display ) +
'</option>\n                        ';
 } else { ;
__p += '\n                            <option value="' +
__e( country.countryCode ) +
'">' +
__e( country.display ) +
'</option>\n                        ';
 } ;
__p += '\n                    ';
 }); ;
__p += '\n                </select>\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'street')) { ;
__p += '\n            <div id="street_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-street" id="street_label_' +
__e( data.form_index ) +
'" for="street_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Gade/vej</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-street" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-street" id="street_' +
__e( data.form_index ) +
'" type="text" name="street" value="" maxlength="255">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'city')) { ;
__p += '\n            <div id="city_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-city" id="city_label_' +
__e( data.form_index ) +
'" for="city_' +
__e( data.form_index ) +
'" class="ctct-form-label ">By</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-city" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-city" id="city_' +
__e( data.form_index ) +
'" type="text" name="city" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'state')) { ;
__p += '\n            <div id="state_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-state" id="state_label_' +
__e( data.form_index ) +
'" for="state_' +
__e( data.form_index ) +
'" class="ctct-form-label ">VÃ¦lg en region/landsdel</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-state" style="display: none;"></div>\n                <input data-qe-id="form-input-state" class="state_' +
__e( data.form_index ) +
' ctct-form-element" id="state_' +
__e( data.form_index ) +
'" type="text" name="state" value="" maxlength="50">\n                <select data-qe-id="form-select-state-' +
__e( data.form_index ) +
'" class="state_' +
__e( data.form_index ) +
' ctct-select-element" id="state_' +
__e( data.form_index ) +
'" style="display: none;" name="state">\n                </select>\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'postal_code')) { ;
__p += '\n            <div id="postal_code_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-postal-code" id="postal_code_label_' +
__e( data.form_index ) +
'" for="postal_code_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Postnummer</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-postal-code" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-postal-code" id="postal_code_' +
__e( data.form_index ) +
'" type="text" name="postal_code" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'company')) { ;
__p += '\n            <div id="company_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-company" id="company_label_' +
__e( data.form_index ) +
'" for="company_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Firma</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-company" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-company" id="company_' +
__e( data.form_index ) +
'" type="text" name="company" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'job_title')) { ;
__p += '\n            <div id="job_title_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-title" id="job_title_label_' +
__e( data.form_index ) +
'" for="job_title_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Jobtitel</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-job-title" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-title" id="job_title_' +
__e( data.form_index ) +
'" type="text" name="job_title" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'birthday')) { ;
__p += '\n            <div id="birthday_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-birthday" id="birthday_label_' +
__e( data.form_index ) +
'" for="birthday_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">FÃ¸dselsdato</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-birthday" style="display: none;"></div>\n                <input data-qe-id="form-input-birthday-month" id="birthday_month_' +
__e( data.form_index ) +
'" type="number" name="birthday_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" min="1" max="12" maxlength="2" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('birthday_aria_label_month') ) +
'"> / <input data-qe-id="form-input-birthday-day" id="birthday_day_' +
__e( data.form_index ) +
'" type="number" name="birthday_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('birthday_aria_label_day') ) +
'">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'anniversary')) { ;
__p += '\n            <div id="anniversary_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-anniversary" id="anniversary_label_' +
__e( data.form_index ) +
'" for="anniversary_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Ã…rsdag</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-anniversary" style="display: none;"></div>\n                <input data-qe-id="form-input-anniversary-month" id="anniversary_month_' +
__e( data.form_index ) +
'" type="number" name="anniversary_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="12" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_month') ) +
'"> / <input data-qe-id="form-input-anniversary-day" id="anniversary_day_' +
__e( data.form_index ) +
'" type="number" name="anniversary_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_day') ) +
'"> / <input data-qe-id="form-input-anniversary-year" id="anniversary_year_' +
__e( data.form_index ) +
'" type="number" name="anniversary_year" value="" placeholder="YYYY" class="ctct-form-element ctct-form-date-field-4" maxlength="4" min="1900" max="' +
__e( data.max_anniversary_year ) +
'" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_year') ) +
'">\n            </div>\n            ';
 } ;
__p += '\n\n        ';
 _.each(data._customFields, function(customField) { ;
__p += '\n            ';
 if(customField.type === 'custom_field_string') { ;
__p += '\n            <div id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_label_' +
__e( data.form_index ) +
'" for="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_' +
__e( data.form_index ) +
'" class="ctct-form-label ctct-form-label ">' +
__e( customField.label ) +
'</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-custom-field-' +
__e( customField.label ) +
'" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_' +
__e( data.form_index ) +
'" type="text" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'" value="" maxlength="255">\n            </div>\n            ';
 } ;
__p += '\n            ';
 if(customField.type === 'custom_field_date') { ;
__p += '\n            <div id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_label_' +
__e( data.form_index ) +
'" for="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">' +
__e( customField.label ) +
'</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-custom-field-' +
__e( customField.label ) +
'" style="display: none;"></div>\n                <input data-qe-id="form-input-custom-field-month-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="12" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_month') ) +
'"> / <input data-qe-id="form-input-custom-field-day-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_day_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_day') ) +
'"> / <input data-qe-id="form-input-custom-field-year-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_year_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_year" value="" placeholder="YYYY" class="ctct-form-element ctct-form-date-field-4" maxlength="4" min="1900" max="9999" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_year') ) +
'">\n            </div>\n            ';
 } ;
__p += '\n        ';
 }); ;
__p += '\n\n            ';
 if (data.list_ids.length > 1) { ;
__p += '\n            <fieldset id="list_memberships_field_' +
__e( data.form_index ) +
'" class="ctct-form-lists">\n                <legend id="list_memberships_label_' +
__e( data.form_index ) +
'" class="ctct-form-required ctct-form-lists-legend">E-mail-lister</legend>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-list_memberships" style="display: none;"></div>\n                ';
 _.each(data._emailLists, function(emailList, index) { ;
__p += '\n                    <div class="ctct-form-listitem">\n                        <input class="ctct-form-checkbox" data-qe-id="form-input-list-' +
__e( emailList.label ) +
'" id="email_list_' +
__e( index ) +
'_' +
__e( data.form_index ) +
'" type="checkbox" name="emailList" value="' +
__e( emailList.id ) +
'">\n                        <label data-qe-id="form-label-list-' +
__e( emailList.label ) +
'" for="email_list_' +
__e( index ) +
'_' +
__e( data.form_index ) +
'" class="ctct-form-listname ctct-form-checkbox-label">' +
__e( emailList.label ) +
'</label>\n                    </div>\n                ';
 }); ;
__p += '\n            </fieldset>\n            ';
 } ;
__p += '\n\n            <div id="error_message_' +
__e( data.form_index ) +
'" class="ctct-form-error" style="display:none;">\n                <p class="ctct-form-errorMessage">Vi beklager, vi kunne ikke gennemfÃ¸re din tilmelding. Kontakt os, sÃ¥ vi kan lÃ¸se problemet.</p>\n            </div>\n            <div id="network_error_message_' +
__e( data.form_index ) +
'" class="ctct-form-error" style="display:none;">\n                <p class="ctct-form-errorMessage">Operation timed out, please try again.</p>\n            </div>\n\n\n            <button data-qe-id="form-button" type="button" class="ctct-form-button">' +
__e( data.buttonText ) +
'</button>\n\n            ';
 if (data.recaptchaKey) { ;
__p += '\n            <div class="g-recaptcha" id="ctct_recaptcha_' +
__e( data.form_index ) +
'" data-sitekey="' +
__e( data.recaptchaKey ) +
'" data-size="invisible">\n            </div>\n            ';
 } ;
__p += '\n        </form>\n        <p class="ctct-form-footer">\n            ';
 if (!data.hideBranding) { ;
__p += '\n            <span data-qe-id="form-branding">\n                 <a href="http://www.constantcontact.com/index.jsp?cc=forms_inline" rel="nofollow" target="_blank" class="ctct-form-footer-link">Constant Contact</a> |\n            </span>\n            ';
 } ;
__p += '\n            <a href="' +
__e( data._defaults.privacyUrl ) +
'" target="_blank" data-qe-id="form-privacy-link" class="ctct-form-footer-link">Privatlivspolitik</a>\n        </p>\n    </div>\n</div>\n';
return __p
};

SignUpFormWidget["JST"]["dist/templates/da/popup_form.html"] = function(data) {
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
__p += '<div class="ctct-form-defaults" data-qe-id="form-background">\n    <div id="success_message_' +
__e( data.form_index ) +
'" class="ctct-form-success" style="display:none;" data-qe-id="success-message">\n        <h2 class="ctct-form-header">Tak for tilmeldingen!</h2>\n        <p class="ctct-form-text">Du kan nÃ¥r som helst framelde dig via linket Frameld mig nederst i hver e-mail.</p>\n    </div>\n    <form class="ctct-form-custom" id="ctct_form_' +
__e( data.form_index ) +
'" autocomplete="on" data-qe-id="form-data">\n        ';
 if(!_.isEmpty(data.titleText)) { ;
__p += '\n        <h2 data-qe-id="form-title" class="ctct-form-header">' +
__e( data.titleText ) +
'</h2>\n        ';
 } ;
__p += '\n        ';
 if(!_.isEmpty(data.descriptionText)) { ;
__p += '\n        <p data-qe-id="form-description" class="ctct-form-text">' +
__e( data.descriptionText ) +
'</p>\n        ';
 } ;
__p += '\n\n        <div id="email_address_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-email" id="email_address_label_' +
__e( data.form_index ) +
'" for="email_address_' +
__e( data.form_index ) +
'" class="ctct-form-label ctct-form-required">E-mail-adresse</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-email" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-email" id="email_address_' +
__e( data.form_index ) +
'" type="email" name="email_address" value="" maxlength="80">\n        </div>\n\n        ';
 if(_.contains(data.contact_fields, 'first_name')) { ;
__p += '\n        <div id="first_name_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-first-name" id="first_name_label_' +
__e( data.form_index ) +
'" for="first_name_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Fornavn</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-first-name" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-first-name" id="first_name_' +
__e( data.form_index ) +
'" type="text" name="first_name" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'last_name')) { ;
__p += '\n        <div id="last_name_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-last-name" id="last_name_label_' +
__e( data.form_index ) +
'" for="last_name_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Efternavn</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-last-name" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-last-name" id="last_name_' +
__e( data.form_index ) +
'" type="text" name="last_name" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'phone')) { ;
__p += '\n        <div id="phone_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-phone" id="phone_label_' +
__e( data.form_index ) +
'" for="phone_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Telefonnummer</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-phone" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-phone" id="phone_' +
__e( data.form_index ) +
'" type="tel" name="phone" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'country')) { ;
__p += '\n        <div id="country_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-country" id="country_label_' +
__e( data.form_index ) +
'" for="country_' +
__e( data.form_index ) +
'" class="ctct-form-label ">VÃ¦lg et land</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-country" style="display: none;"></div>\n            <select class="ctct-select-element" data-qe-id="form-select-country-' +
__e( data.form_index ) +
'" id="country_' +
__e( data.form_index ) +
'" name="country">\n                <option value="">--</option>\n                ';
 _.each(data._defaults.countries, function(country) { ;
__p += '\n                    ';
 if (country.countryCode === data.selectedCountry) { ;
__p += '\n                        <option value="' +
__e( country.countryCode ) +
'" selected>' +
__e( country.display ) +
'</option>\n                    ';
 } else { ;
__p += '\n                        <option value="' +
__e( country.countryCode ) +
'">' +
__e( country.display ) +
'</option>\n                    ';
 } ;
__p += '\n                ';
 }); ;
__p += '\n            </select>\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'street')) { ;
__p += '\n        <div id="street_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-street" id="street_label_' +
__e( data.form_index ) +
'" for="street_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Gade/vej</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-street" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-street" id="street_' +
__e( data.form_index ) +
'" type="text" name="street" value="" maxlength="255">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'city')) { ;
__p += '\n        <div id="city_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-city" id="city_label_' +
__e( data.form_index ) +
'" for="city_' +
__e( data.form_index ) +
'" class="ctct-form-label ">By</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-city" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-city" id="city_' +
__e( data.form_index ) +
'" type="text" name="city" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'state')) { ;
__p += '\n        <div id="state_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-state" id="state_label_' +
__e( data.form_index ) +
'" for="state_' +
__e( data.form_index ) +
'" class="ctct-form-label ">VÃ¦lg en region/landsdel</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-state" style="display: none;"></div>\n            <input data-qe-id="form-input-state" class="state_' +
__e( data.form_index ) +
' ctct-form-element" id="state_' +
__e( data.form_index ) +
'" type="text" name="state" value="" maxlength="50">\n            <select data-qe-id="form-select-state-' +
__e( data.form_index ) +
'" class="state_' +
__e( data.form_index ) +
' ctct-select-element" id="state_' +
__e( data.form_index ) +
'" style="display: none;" name="state">\n            </select>\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'postal_code')) { ;
__p += '\n        <div id="postal_code_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-postal-code" id="postal_code_label_' +
__e( data.form_index ) +
'" for="postal_code_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Postnummer</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-postal-code" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-postal-code" id="postal_code_' +
__e( data.form_index ) +
'" type="text" name="postal_code" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'company')) { ;
__p += '\n        <div id="company_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-company" id="company_label_' +
__e( data.form_index ) +
'" for="company_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Firma</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-company" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-company" id="company_' +
__e( data.form_index ) +
'" type="text" name="company" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'job_title')) { ;
__p += '\n        <div id="job_title_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-title" id="job_title_label_' +
__e( data.form_index ) +
'" for="job_title_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Jobtitel</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-job-title" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-title" id="job_title_' +
__e( data.form_index ) +
'" type="text" name="job_title" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'birthday')) { ;
__p += '\n        <div id="birthday_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-birthday" id="birthday_label_' +
__e( data.form_index ) +
'" for="birthday_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">FÃ¸dselsdato</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-birthday" style="display: none;"></div>\n            <input data-qe-id="form-input-birthday-month" id="birthday_month_' +
__e( data.form_index ) +
'" type="number" name="birthday_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" min="1" max="12" maxlength="2" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('birthday_aria_label_month') ) +
'"> / <input data-qe-id="form-input-birthday-day" id="birthday_day_' +
__e( data.form_index ) +
'" type="number" name="birthday_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('birthday_aria_label_day') ) +
'">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'anniversary')) { ;
__p += '\n        <div id="anniversary_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-anniversary" id="anniversary_label_' +
__e( data.form_index ) +
'" for="anniversary_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Ã…rsdag</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-anniversary" style="display: none;"></div>\n            <input data-qe-id="form-input-anniversary-month" id="anniversary_month_' +
__e( data.form_index ) +
'" type="number" name="anniversary_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="12" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_month') ) +
'"> / <input data-qe-id="form-input-anniversary-day" id="anniversary_day_' +
__e( data.form_index ) +
'" type="number" name="anniversary_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_day') ) +
'"> / <input data-qe-id="form-input-anniversary-year" id="anniversary_year_' +
__e( data.form_index ) +
'" type="number" name="anniversary_year" value="" placeholder="YYYY" class="ctct-form-element ctct-form-date-field-4" maxlength="4" min="1900" max="' +
__e( data.max_anniversary_year ) +
'" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_year') ) +
'">\n        </div>\n        ';
 } ;
__p += '\n\n    ';
 _.each(data._customFields, function(customField) { ;
__p += '\n        ';
 if(customField.type === 'custom_field_string') { ;
__p += '\n        <div id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_label_' +
__e( data.form_index ) +
'" for="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_' +
__e( data.form_index ) +
'" class="ctct-form-label ctct-form-label ">' +
__e( customField.label ) +
'</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-custom-field-' +
__e( customField.label ) +
'" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_' +
__e( data.form_index ) +
'" type="text" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'" value="" maxlength="255">\n        </div>\n        ';
 } ;
__p += '\n        ';
 if(customField.type === 'custom_field_date') { ;
__p += '\n        <div id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_label_' +
__e( data.form_index ) +
'" for="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">' +
__e( customField.label ) +
'</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-custom-field-' +
__e( customField.label ) +
'" style="display: none;"></div>\n            <input data-qe-id="form-input-custom-field-month-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="12" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_month') ) +
'"> / <input data-qe-id="form-input-custom-field-day-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_day_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_day') ) +
'"> / <input data-qe-id="form-input-custom-field-year-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_year_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_year" value="" placeholder="YYYY" class="ctct-form-element ctct-form-date-field-4" maxlength="4" min="1900" max="9999" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_year') ) +
'">\n        </div>\n        ';
 } ;
__p += '\n    ';
 }); ;
__p += '\n\n        ';
 if (data.list_ids.length > 1) { ;
__p += '\n        <fieldset id="list_memberships_field_' +
__e( data.form_index ) +
'" class="ctct-form-lists">\n            <legend id="list_memberships_label_' +
__e( data.form_index ) +
'" class="ctct-form-required ctct-form-lists-legend">E-mail-lister</legend>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-list_memberships" style="display: none;"></div>\n            ';
 _.each(data._emailLists, function(emailList, index) { ;
__p += '\n                <div class="ctct-form-listitem">\n                    <input class="ctct-form-checkbox" data-qe-id="form-input-list-' +
__e( emailList.label ) +
'" id="email_list_' +
__e( index ) +
'_' +
__e( data.form_index ) +
'" type="checkbox" name="emailList" value="' +
__e( emailList.id ) +
'">\n                    <label data-qe-id="form-label-list-' +
__e( emailList.label ) +
'" for="email_list_' +
__e( index ) +
'_' +
__e( data.form_index ) +
'" class="ctct-form-listname ctct-form-checkbox-label">' +
__e( emailList.label ) +
'</label>\n                </div>\n            ';
 }); ;
__p += '\n        </fieldset>\n        ';
 } ;
__p += '\n\n        <div id="error_message_' +
__e( data.form_index ) +
'" class="ctct-form-error" style="display:none;">\n            <p class="ctct-form-errorMessage">Vi beklager, vi kunne ikke gennemfÃ¸re din tilmelding. Kontakt os, sÃ¥ vi kan lÃ¸se problemet.</p>\n        </div>\n        <div id="network_error_message_' +
__e( data.form_index ) +
'" class="ctct-form-error" style="display:none;">\n            <p class="ctct-form-errorMessage">Operation timed out, please try again.</p>\n        </div>\n\n\n        <button data-qe-id="form-button" type="button" class="ctct-form-button">' +
__e( data.buttonText ) +
'</button>\n    </form>\n    <p class="ctct-form-footer">\n        ';
 if(!data.hideBranding) { ;
__p += '\n        <span data-qe-id="form-branding">\n             <a href="http://www.constantcontact.com/index.jsp?cc=forms_popup" rel="nofollow" target="_blank" class="ctct-form-footer-link">Constant Contact</a> |\n        </span>\n        ';
 } ;
__p += '\n        <a href="' +
__e( data._defaults.privacyUrl ) +
'" target="_blank" data-qe-id="form-privacy-link" class="ctct-form-footer-link">Privatlivspolitik</a>\n    </p>\n</div>\n\n';
return __p
};

SignUpFormWidget["JST"]["dist/templates/da/popup_wrapper.html"] = function(data) {
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
__p += '<div class="ctct-popup-wrapper form_' +
__e( data.form_index ) +
'">\n    <div class="ctct-popup-overlay"></div>\n    <div class="ctct-popup-inner">\n      <div class="ctct-popup-content">\n        <button type="button" class="ctct-popup-close js-popup-close" title="Close">\n            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" class="undefined">\n                <polygon points="14 11 11 14 8 11 5 14 2 11 5 8 2 5 5 2 8 5 11 2 14 5 11 8 " class="undefined"/>\n            </svg>\n        </button>\n        <div class="ctct-form-container ctct-form-popup form_' +
__e( data.form_index ) +
'"></div>\n      </div>\n    </div>\n\n    ';
 if (data.recaptchaKey) { ;
__p += '\n    <div class="g-recaptcha" id="ctct_recaptcha_' +
__e( data.form_index ) +
'" data-sitekey="' +
__e( data.recaptchaKey ) +
'" data-size="invisible"></div>\n    ';
 } ;
__p += '\n</div>\n';
return __p
};

SignUpFormWidget["JST"]["dist/templates/de/inline_form.html"] = function(data) {
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
__p += '<div class="ctct-form-container ctct-form-embed form_' +
__e( data.form_index ) +
'">\n    <div class="ctct-form-defaults" data-qe-id="form-background">\n        <div id="success_message_' +
__e( data.form_index ) +
'" class="ctct-form-success" style="display:none;" data-qe-id="success-message">\n            <h2 class="ctct-form-header">Vielen Dank fÃ¼r Ihre Anmeldung!</h2>\n            <p class="ctct-form-text">Ãœber den Link zur Austragung aus der Mailingliste in jeder E-Mail kÃ¶nnen Sie sich jederzeit austragen.</p>\n        </div>\n        <form class="ctct-form-custom" id="ctct_form_' +
__e( data.form_index ) +
'" autocomplete="on" data-qe-id="form-data">\n            ';
 if(!_.isEmpty(data.titleText)) { ;
__p += '\n            <h2 data-qe-id="form-title" class="ctct-form-header">' +
__e( data.titleText ) +
'</h2>\n            ';
 } ;
__p += '\n            ';
 if(!_.isEmpty(data.descriptionText)) { ;
__p += '\n            <p data-qe-id="form-description" class="ctct-form-text">' +
__e( data.descriptionText ) +
'</p>\n            ';
 } ;
__p += '\n\n            <div id="email_address_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-email" id="email_address_label_' +
__e( data.form_index ) +
'" for="email_address_' +
__e( data.form_index ) +
'" class="ctct-form-label ctct-form-required">E-Mail-Adresse</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-email" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-email" id="email_address_' +
__e( data.form_index ) +
'" type="email" name="email_address" value="" maxlength="80">\n            </div>\n\n            ';
 if(_.contains(data.contact_fields, 'first_name')) { ;
__p += '\n            <div id="first_name_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-first-name" id="first_name_label_' +
__e( data.form_index ) +
'" for="first_name_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Vorname</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-first-name" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-first-name" id="first_name_' +
__e( data.form_index ) +
'" type="text" name="first_name" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'last_name')) { ;
__p += '\n            <div id="last_name_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-last-name" id="last_name_label_' +
__e( data.form_index ) +
'" for="last_name_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Nachname</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-last-name" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-last-name" id="last_name_' +
__e( data.form_index ) +
'" type="text" name="last_name" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'phone')) { ;
__p += '\n            <div id="phone_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-phone" id="phone_label_' +
__e( data.form_index ) +
'" for="phone_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Telefonnummer</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-phone" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-phone" id="phone_' +
__e( data.form_index ) +
'" type="tel" name="phone" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'country')) { ;
__p += '\n            <div id="country_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-country" id="country_label_' +
__e( data.form_index ) +
'" for="country_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Land auswÃ¤hlen</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-country" style="display: none;"></div>\n                <select class="ctct-select-element" data-qe-id="form-select-country-' +
__e( data.form_index ) +
'" id="country_' +
__e( data.form_index ) +
'" name="country">\n                    <option value="">--</option>\n                    ';
 _.each(data._defaults.countries, function(country) { ;
__p += '\n                        ';
 if (country.countryCode === data.selectedCountry) { ;
__p += '\n                            <option value="' +
__e( country.countryCode ) +
'" selected>' +
__e( country.display ) +
'</option>\n                        ';
 } else { ;
__p += '\n                            <option value="' +
__e( country.countryCode ) +
'">' +
__e( country.display ) +
'</option>\n                        ';
 } ;
__p += '\n                    ';
 }); ;
__p += '\n                </select>\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'street')) { ;
__p += '\n            <div id="street_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-street" id="street_label_' +
__e( data.form_index ) +
'" for="street_' +
__e( data.form_index ) +
'" class="ctct-form-label ">StraÃŸe</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-street" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-street" id="street_' +
__e( data.form_index ) +
'" type="text" name="street" value="" maxlength="255">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'city')) { ;
__p += '\n            <div id="city_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-city" id="city_label_' +
__e( data.form_index ) +
'" for="city_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Stadt</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-city" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-city" id="city_' +
__e( data.form_index ) +
'" type="text" name="city" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'state')) { ;
__p += '\n            <div id="state_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-state" id="state_label_' +
__e( data.form_index ) +
'" for="state_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Bundesland/Kanton auswÃ¤hlen</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-state" style="display: none;"></div>\n                <input data-qe-id="form-input-state" class="state_' +
__e( data.form_index ) +
' ctct-form-element" id="state_' +
__e( data.form_index ) +
'" type="text" name="state" value="" maxlength="50">\n                <select data-qe-id="form-select-state-' +
__e( data.form_index ) +
'" class="state_' +
__e( data.form_index ) +
' ctct-select-element" id="state_' +
__e( data.form_index ) +
'" style="display: none;" name="state">\n                </select>\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'postal_code')) { ;
__p += '\n            <div id="postal_code_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-postal-code" id="postal_code_label_' +
__e( data.form_index ) +
'" for="postal_code_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Postleitzahl</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-postal-code" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-postal-code" id="postal_code_' +
__e( data.form_index ) +
'" type="text" name="postal_code" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'company')) { ;
__p += '\n            <div id="company_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-company" id="company_label_' +
__e( data.form_index ) +
'" for="company_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Unternehmen</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-company" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-company" id="company_' +
__e( data.form_index ) +
'" type="text" name="company" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'job_title')) { ;
__p += '\n            <div id="job_title_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-title" id="job_title_label_' +
__e( data.form_index ) +
'" for="job_title_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Position</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-job-title" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-title" id="job_title_' +
__e( data.form_index ) +
'" type="text" name="job_title" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'birthday')) { ;
__p += '\n            <div id="birthday_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-birthday" id="birthday_label_' +
__e( data.form_index ) +
'" for="birthday_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Geburtsdatum</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-birthday" style="display: none;"></div>\n                <input data-qe-id="form-input-birthday-month" id="birthday_month_' +
__e( data.form_index ) +
'" type="number" name="birthday_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" min="1" max="12" maxlength="2" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('birthday_aria_label_month') ) +
'"> / <input data-qe-id="form-input-birthday-day" id="birthday_day_' +
__e( data.form_index ) +
'" type="number" name="birthday_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('birthday_aria_label_day') ) +
'">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'anniversary')) { ;
__p += '\n            <div id="anniversary_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-anniversary" id="anniversary_label_' +
__e( data.form_index ) +
'" for="anniversary_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">JubilÂŠumsdatum</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-anniversary" style="display: none;"></div>\n                <input data-qe-id="form-input-anniversary-month" id="anniversary_month_' +
__e( data.form_index ) +
'" type="number" name="anniversary_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="12" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_month') ) +
'"> / <input data-qe-id="form-input-anniversary-day" id="anniversary_day_' +
__e( data.form_index ) +
'" type="number" name="anniversary_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_day') ) +
'"> / <input data-qe-id="form-input-anniversary-year" id="anniversary_year_' +
__e( data.form_index ) +
'" type="number" name="anniversary_year" value="" placeholder="YYYY" class="ctct-form-element ctct-form-date-field-4" maxlength="4" min="1900" max="' +
__e( data.max_anniversary_year ) +
'" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_year') ) +
'">\n            </div>\n            ';
 } ;
__p += '\n\n        ';
 _.each(data._customFields, function(customField) { ;
__p += '\n            ';
 if(customField.type === 'custom_field_string') { ;
__p += '\n            <div id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_label_' +
__e( data.form_index ) +
'" for="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_' +
__e( data.form_index ) +
'" class="ctct-form-label ctct-form-label ">' +
__e( customField.label ) +
'</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-custom-field-' +
__e( customField.label ) +
'" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_' +
__e( data.form_index ) +
'" type="text" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'" value="" maxlength="255">\n            </div>\n            ';
 } ;
__p += '\n            ';
 if(customField.type === 'custom_field_date') { ;
__p += '\n            <div id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_label_' +
__e( data.form_index ) +
'" for="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">' +
__e( customField.label ) +
'</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-custom-field-' +
__e( customField.label ) +
'" style="display: none;"></div>\n                <input data-qe-id="form-input-custom-field-month-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="12" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_month') ) +
'"> / <input data-qe-id="form-input-custom-field-day-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_day_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_day') ) +
'"> / <input data-qe-id="form-input-custom-field-year-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_year_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_year" value="" placeholder="YYYY" class="ctct-form-element ctct-form-date-field-4" maxlength="4" min="1900" max="9999" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_year') ) +
'">\n            </div>\n            ';
 } ;
__p += '\n        ';
 }); ;
__p += '\n\n            ';
 if (data.list_ids.length > 1) { ;
__p += '\n            <fieldset id="list_memberships_field_' +
__e( data.form_index ) +
'" class="ctct-form-lists">\n                <legend id="list_memberships_label_' +
__e( data.form_index ) +
'" class="ctct-form-required ctct-form-lists-legend">E-Mail-Listen</legend>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-list_memberships" style="display: none;"></div>\n                ';
 _.each(data._emailLists, function(emailList, index) { ;
__p += '\n                    <div class="ctct-form-listitem">\n                        <input class="ctct-form-checkbox" data-qe-id="form-input-list-' +
__e( emailList.label ) +
'" id="email_list_' +
__e( index ) +
'_' +
__e( data.form_index ) +
'" type="checkbox" name="emailList" value="' +
__e( emailList.id ) +
'">\n                        <label data-qe-id="form-label-list-' +
__e( emailList.label ) +
'" for="email_list_' +
__e( index ) +
'_' +
__e( data.form_index ) +
'" class="ctct-form-listname ctct-form-checkbox-label">' +
__e( emailList.label ) +
'</label>\n                    </div>\n                ';
 }); ;
__p += '\n            </fieldset>\n            ';
 } ;
__p += '\n\n            <div id="error_message_' +
__e( data.form_index ) +
'" class="ctct-form-error" style="display:none;">\n                <p class="ctct-form-errorMessage">Der Anmeldevorgang konnte nicht abgeschlossen werden. Bitte wenden Sie sich an uns, damit dieses Problem behoben wird.</p>\n            </div>\n            <div id="network_error_message_' +
__e( data.form_index ) +
'" class="ctct-form-error" style="display:none;">\n                <p class="ctct-form-errorMessage">Operation timed out, please try again.</p>\n            </div>\n\n\n            <button data-qe-id="form-button" type="button" class="ctct-form-button">' +
__e( data.buttonText ) +
'</button>\n\n            ';
 if (data.recaptchaKey) { ;
__p += '\n            <div class="g-recaptcha" id="ctct_recaptcha_' +
__e( data.form_index ) +
'" data-sitekey="' +
__e( data.recaptchaKey ) +
'" data-size="invisible">\n            </div>\n            ';
 } ;
__p += '\n        </form>\n        <p class="ctct-form-footer">\n            ';
 if (!data.hideBranding) { ;
__p += '\n            <span data-qe-id="form-branding">\n                 <a href="http://www.constantcontact.com/index.jsp?cc=forms_inline" rel="nofollow" target="_blank" class="ctct-form-footer-link">Constant Contact</a> |\n            </span>\n            ';
 } ;
__p += '\n            <a href="' +
__e( data._defaults.privacyUrl ) +
'" target="_blank" data-qe-id="form-privacy-link" class="ctct-form-footer-link">Datenschutz</a>\n        </p>\n    </div>\n</div>\n';
return __p
};

SignUpFormWidget["JST"]["dist/templates/de/popup_form.html"] = function(data) {
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
__p += '<div class="ctct-form-defaults" data-qe-id="form-background">\n    <div id="success_message_' +
__e( data.form_index ) +
'" class="ctct-form-success" style="display:none;" data-qe-id="success-message">\n        <h2 class="ctct-form-header">Vielen Dank fÃ¼r Ihre Anmeldung!</h2>\n        <p class="ctct-form-text">Ãœber den Link zur Austragung aus der Mailingliste in jeder E-Mail kÃ¶nnen Sie sich jederzeit austragen.</p>\n    </div>\n    <form class="ctct-form-custom" id="ctct_form_' +
__e( data.form_index ) +
'" autocomplete="on" data-qe-id="form-data">\n        ';
 if(!_.isEmpty(data.titleText)) { ;
__p += '\n        <h2 data-qe-id="form-title" class="ctct-form-header">' +
__e( data.titleText ) +
'</h2>\n        ';
 } ;
__p += '\n        ';
 if(!_.isEmpty(data.descriptionText)) { ;
__p += '\n        <p data-qe-id="form-description" class="ctct-form-text">' +
__e( data.descriptionText ) +
'</p>\n        ';
 } ;
__p += '\n\n        <div id="email_address_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-email" id="email_address_label_' +
__e( data.form_index ) +
'" for="email_address_' +
__e( data.form_index ) +
'" class="ctct-form-label ctct-form-required">E-Mail-Adresse</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-email" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-email" id="email_address_' +
__e( data.form_index ) +
'" type="email" name="email_address" value="" maxlength="80">\n        </div>\n\n        ';
 if(_.contains(data.contact_fields, 'first_name')) { ;
__p += '\n        <div id="first_name_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-first-name" id="first_name_label_' +
__e( data.form_index ) +
'" for="first_name_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Vorname</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-first-name" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-first-name" id="first_name_' +
__e( data.form_index ) +
'" type="text" name="first_name" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'last_name')) { ;
__p += '\n        <div id="last_name_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-last-name" id="last_name_label_' +
__e( data.form_index ) +
'" for="last_name_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Nachname</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-last-name" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-last-name" id="last_name_' +
__e( data.form_index ) +
'" type="text" name="last_name" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'phone')) { ;
__p += '\n        <div id="phone_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-phone" id="phone_label_' +
__e( data.form_index ) +
'" for="phone_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Telefonnummer</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-phone" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-phone" id="phone_' +
__e( data.form_index ) +
'" type="tel" name="phone" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'country')) { ;
__p += '\n        <div id="country_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-country" id="country_label_' +
__e( data.form_index ) +
'" for="country_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Land auswÃ¤hlen</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-country" style="display: none;"></div>\n            <select class="ctct-select-element" data-qe-id="form-select-country-' +
__e( data.form_index ) +
'" id="country_' +
__e( data.form_index ) +
'" name="country">\n                <option value="">--</option>\n                ';
 _.each(data._defaults.countries, function(country) { ;
__p += '\n                    ';
 if (country.countryCode === data.selectedCountry) { ;
__p += '\n                        <option value="' +
__e( country.countryCode ) +
'" selected>' +
__e( country.display ) +
'</option>\n                    ';
 } else { ;
__p += '\n                        <option value="' +
__e( country.countryCode ) +
'">' +
__e( country.display ) +
'</option>\n                    ';
 } ;
__p += '\n                ';
 }); ;
__p += '\n            </select>\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'street')) { ;
__p += '\n        <div id="street_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-street" id="street_label_' +
__e( data.form_index ) +
'" for="street_' +
__e( data.form_index ) +
'" class="ctct-form-label ">StraÃŸe</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-street" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-street" id="street_' +
__e( data.form_index ) +
'" type="text" name="street" value="" maxlength="255">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'city')) { ;
__p += '\n        <div id="city_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-city" id="city_label_' +
__e( data.form_index ) +
'" for="city_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Stadt</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-city" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-city" id="city_' +
__e( data.form_index ) +
'" type="text" name="city" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'state')) { ;
__p += '\n        <div id="state_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-state" id="state_label_' +
__e( data.form_index ) +
'" for="state_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Bundesland/Kanton auswÃ¤hlen</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-state" style="display: none;"></div>\n            <input data-qe-id="form-input-state" class="state_' +
__e( data.form_index ) +
' ctct-form-element" id="state_' +
__e( data.form_index ) +
'" type="text" name="state" value="" maxlength="50">\n            <select data-qe-id="form-select-state-' +
__e( data.form_index ) +
'" class="state_' +
__e( data.form_index ) +
' ctct-select-element" id="state_' +
__e( data.form_index ) +
'" style="display: none;" name="state">\n            </select>\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'postal_code')) { ;
__p += '\n        <div id="postal_code_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-postal-code" id="postal_code_label_' +
__e( data.form_index ) +
'" for="postal_code_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Postleitzahl</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-postal-code" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-postal-code" id="postal_code_' +
__e( data.form_index ) +
'" type="text" name="postal_code" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'company')) { ;
__p += '\n        <div id="company_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-company" id="company_label_' +
__e( data.form_index ) +
'" for="company_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Unternehmen</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-company" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-company" id="company_' +
__e( data.form_index ) +
'" type="text" name="company" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'job_title')) { ;
__p += '\n        <div id="job_title_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-title" id="job_title_label_' +
__e( data.form_index ) +
'" for="job_title_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Position</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-job-title" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-title" id="job_title_' +
__e( data.form_index ) +
'" type="text" name="job_title" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'birthday')) { ;
__p += '\n        <div id="birthday_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-birthday" id="birthday_label_' +
__e( data.form_index ) +
'" for="birthday_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Geburtsdatum</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-birthday" style="display: none;"></div>\n            <input data-qe-id="form-input-birthday-month" id="birthday_month_' +
__e( data.form_index ) +
'" type="number" name="birthday_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" min="1" max="12" maxlength="2" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('birthday_aria_label_month') ) +
'"> / <input data-qe-id="form-input-birthday-day" id="birthday_day_' +
__e( data.form_index ) +
'" type="number" name="birthday_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('birthday_aria_label_day') ) +
'">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'anniversary')) { ;
__p += '\n        <div id="anniversary_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-anniversary" id="anniversary_label_' +
__e( data.form_index ) +
'" for="anniversary_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">JubilÂŠumsdatum</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-anniversary" style="display: none;"></div>\n            <input data-qe-id="form-input-anniversary-month" id="anniversary_month_' +
__e( data.form_index ) +
'" type="number" name="anniversary_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="12" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_month') ) +
'"> / <input data-qe-id="form-input-anniversary-day" id="anniversary_day_' +
__e( data.form_index ) +
'" type="number" name="anniversary_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_day') ) +
'"> / <input data-qe-id="form-input-anniversary-year" id="anniversary_year_' +
__e( data.form_index ) +
'" type="number" name="anniversary_year" value="" placeholder="YYYY" class="ctct-form-element ctct-form-date-field-4" maxlength="4" min="1900" max="' +
__e( data.max_anniversary_year ) +
'" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_year') ) +
'">\n        </div>\n        ';
 } ;
__p += '\n\n    ';
 _.each(data._customFields, function(customField) { ;
__p += '\n        ';
 if(customField.type === 'custom_field_string') { ;
__p += '\n        <div id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_label_' +
__e( data.form_index ) +
'" for="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_' +
__e( data.form_index ) +
'" class="ctct-form-label ctct-form-label ">' +
__e( customField.label ) +
'</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-custom-field-' +
__e( customField.label ) +
'" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_' +
__e( data.form_index ) +
'" type="text" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'" value="" maxlength="255">\n        </div>\n        ';
 } ;
__p += '\n        ';
 if(customField.type === 'custom_field_date') { ;
__p += '\n        <div id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_label_' +
__e( data.form_index ) +
'" for="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">' +
__e( customField.label ) +
'</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-custom-field-' +
__e( customField.label ) +
'" style="display: none;"></div>\n            <input data-qe-id="form-input-custom-field-month-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="12" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_month') ) +
'"> / <input data-qe-id="form-input-custom-field-day-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_day_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_day') ) +
'"> / <input data-qe-id="form-input-custom-field-year-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_year_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_year" value="" placeholder="YYYY" class="ctct-form-element ctct-form-date-field-4" maxlength="4" min="1900" max="9999" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_year') ) +
'">\n        </div>\n        ';
 } ;
__p += '\n    ';
 }); ;
__p += '\n\n        ';
 if (data.list_ids.length > 1) { ;
__p += '\n        <fieldset id="list_memberships_field_' +
__e( data.form_index ) +
'" class="ctct-form-lists">\n            <legend id="list_memberships_label_' +
__e( data.form_index ) +
'" class="ctct-form-required ctct-form-lists-legend">E-Mail-Listen</legend>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-list_memberships" style="display: none;"></div>\n            ';
 _.each(data._emailLists, function(emailList, index) { ;
__p += '\n                <div class="ctct-form-listitem">\n                    <input class="ctct-form-checkbox" data-qe-id="form-input-list-' +
__e( emailList.label ) +
'" id="email_list_' +
__e( index ) +
'_' +
__e( data.form_index ) +
'" type="checkbox" name="emailList" value="' +
__e( emailList.id ) +
'">\n                    <label data-qe-id="form-label-list-' +
__e( emailList.label ) +
'" for="email_list_' +
__e( index ) +
'_' +
__e( data.form_index ) +
'" class="ctct-form-listname ctct-form-checkbox-label">' +
__e( emailList.label ) +
'</label>\n                </div>\n            ';
 }); ;
__p += '\n        </fieldset>\n        ';
 } ;
__p += '\n\n        <div id="error_message_' +
__e( data.form_index ) +
'" class="ctct-form-error" style="display:none;">\n            <p class="ctct-form-errorMessage">Der Anmeldevorgang konnte nicht abgeschlossen werden. Bitte wenden Sie sich an uns, damit dieses Problem behoben wird.</p>\n        </div>\n        <div id="network_error_message_' +
__e( data.form_index ) +
'" class="ctct-form-error" style="display:none;">\n            <p class="ctct-form-errorMessage">Operation timed out, please try again.</p>\n        </div>\n\n\n        <button data-qe-id="form-button" type="button" class="ctct-form-button">' +
__e( data.buttonText ) +
'</button>\n    </form>\n    <p class="ctct-form-footer">\n        ';
 if(!data.hideBranding) { ;
__p += '\n        <span data-qe-id="form-branding">\n             <a href="http://www.constantcontact.com/index.jsp?cc=forms_popup" rel="nofollow" target="_blank" class="ctct-form-footer-link">Constant Contact</a> |\n        </span>\n        ';
 } ;
__p += '\n        <a href="' +
__e( data._defaults.privacyUrl ) +
'" target="_blank" data-qe-id="form-privacy-link" class="ctct-form-footer-link">Datenschutz</a>\n    </p>\n</div>\n\n';
return __p
};

SignUpFormWidget["JST"]["dist/templates/de/popup_wrapper.html"] = function(data) {
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
__p += '<div class="ctct-popup-wrapper form_' +
__e( data.form_index ) +
'">\n    <div class="ctct-popup-overlay"></div>\n    <div class="ctct-popup-inner">\n      <div class="ctct-popup-content">\n        <button type="button" class="ctct-popup-close js-popup-close" title="Close">\n            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" class="undefined">\n                <polygon points="14 11 11 14 8 11 5 14 2 11 5 8 2 5 5 2 8 5 11 2 14 5 11 8 " class="undefined"/>\n            </svg>\n        </button>\n        <div class="ctct-form-container ctct-form-popup form_' +
__e( data.form_index ) +
'"></div>\n      </div>\n    </div>\n\n    ';
 if (data.recaptchaKey) { ;
__p += '\n    <div class="g-recaptcha" id="ctct_recaptcha_' +
__e( data.form_index ) +
'" data-sitekey="' +
__e( data.recaptchaKey ) +
'" data-size="invisible"></div>\n    ';
 } ;
__p += '\n</div>\n';
return __p
};

SignUpFormWidget["JST"]["dist/templates/en_US/inline_form.html"] = function(data) {
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
__p += '<div class="ctct-form-container ctct-form-embed form_' +
__e( data.form_index ) +
'">\n    <div class="ctct-form-defaults" data-qe-id="form-background">\n        <div id="success_message_' +
__e( data.form_index ) +
'" class="ctct-form-success" style="display:none;" data-qe-id="success-message">\n            <h2 class="ctct-form-header">Thanks for signing up!</h2>\n            <p class="ctct-form-text">You can unsubscribe at any time using the Unsubscribe link at the bottom of every email.</p>\n        </div>\n        <form class="ctct-form-custom" id="ctct_form_' +
__e( data.form_index ) +
'" autocomplete="on" data-qe-id="form-data">\n            ';
 if(!_.isEmpty(data.titleText)) { ;
__p += '\n            <h2 data-qe-id="form-title" class="ctct-form-header">' +
__e( data.titleText ) +
'</h2>\n            ';
 } ;
__p += '\n            ';
 if(!_.isEmpty(data.descriptionText)) { ;
__p += '\n            <p data-qe-id="form-description" class="ctct-form-text">' +
__e( data.descriptionText ) +
'</p>\n            ';
 } ;
__p += '\n\n            <div id="email_address_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-email" id="email_address_label_' +
__e( data.form_index ) +
'" for="email_address_' +
__e( data.form_index ) +
'" class="ctct-form-label ctct-form-required">Email</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-email" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-email" id="email_address_' +
__e( data.form_index ) +
'" type="email" name="email_address" value="" maxlength="80">\n            </div>\n\n            ';
 if(_.contains(data.contact_fields, 'first_name')) { ;
__p += '\n            <div id="first_name_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-first-name" id="first_name_label_' +
__e( data.form_index ) +
'" for="first_name_' +
__e( data.form_index ) +
'" class="ctct-form-label ">First Name</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-first-name" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-first-name" id="first_name_' +
__e( data.form_index ) +
'" type="text" name="first_name" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'last_name')) { ;
__p += '\n            <div id="last_name_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-last-name" id="last_name_label_' +
__e( data.form_index ) +
'" for="last_name_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Last Name</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-last-name" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-last-name" id="last_name_' +
__e( data.form_index ) +
'" type="text" name="last_name" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'phone')) { ;
__p += '\n            <div id="phone_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-phone" id="phone_label_' +
__e( data.form_index ) +
'" for="phone_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Phone</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-phone" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-phone" id="phone_' +
__e( data.form_index ) +
'" type="tel" name="phone" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'country')) { ;
__p += '\n            <div id="country_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-country" id="country_label_' +
__e( data.form_index ) +
'" for="country_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Country</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-country" style="display: none;"></div>\n                <select class="ctct-select-element" data-qe-id="form-select-country-' +
__e( data.form_index ) +
'" id="country_' +
__e( data.form_index ) +
'" name="country">\n                    <option value="">--</option>\n                    ';
 _.each(data._defaults.countries, function(country) { ;
__p += '\n                        ';
 if (country.countryCode === data.selectedCountry) { ;
__p += '\n                            <option value="' +
__e( country.countryCode ) +
'" selected>' +
__e( country.display ) +
'</option>\n                        ';
 } else { ;
__p += '\n                            <option value="' +
__e( country.countryCode ) +
'">' +
__e( country.display ) +
'</option>\n                        ';
 } ;
__p += '\n                    ';
 }); ;
__p += '\n                </select>\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'street')) { ;
__p += '\n            <div id="street_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-street" id="street_label_' +
__e( data.form_index ) +
'" for="street_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Street</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-street" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-street" id="street_' +
__e( data.form_index ) +
'" type="text" name="street" value="" maxlength="255">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'city')) { ;
__p += '\n            <div id="city_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-city" id="city_label_' +
__e( data.form_index ) +
'" for="city_' +
__e( data.form_index ) +
'" class="ctct-form-label ">City</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-city" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-city" id="city_' +
__e( data.form_index ) +
'" type="text" name="city" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'state')) { ;
__p += '\n            <div id="state_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-state" id="state_label_' +
__e( data.form_index ) +
'" for="state_' +
__e( data.form_index ) +
'" class="ctct-form-label ">State/Province</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-state" style="display: none;"></div>\n                <input data-qe-id="form-input-state" class="state_' +
__e( data.form_index ) +
' ctct-form-element" id="state_' +
__e( data.form_index ) +
'" type="text" name="state" value="" maxlength="50">\n                <select data-qe-id="form-select-state-' +
__e( data.form_index ) +
'" class="state_' +
__e( data.form_index ) +
' ctct-select-element" id="state_' +
__e( data.form_index ) +
'" style="display: none;" name="state">\n                </select>\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'postal_code')) { ;
__p += '\n            <div id="postal_code_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-postal-code" id="postal_code_label_' +
__e( data.form_index ) +
'" for="postal_code_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Postal Code</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-postal-code" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-postal-code" id="postal_code_' +
__e( data.form_index ) +
'" type="text" name="postal_code" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'company')) { ;
__p += '\n            <div id="company_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-company" id="company_label_' +
__e( data.form_index ) +
'" for="company_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Company</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-company" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-company" id="company_' +
__e( data.form_index ) +
'" type="text" name="company" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'job_title')) { ;
__p += '\n            <div id="job_title_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-title" id="job_title_label_' +
__e( data.form_index ) +
'" for="job_title_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Job Title</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-job-title" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-title" id="job_title_' +
__e( data.form_index ) +
'" type="text" name="job_title" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'birthday')) { ;
__p += '\n            <div id="birthday_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-birthday" id="birthday_label_' +
__e( data.form_index ) +
'" for="birthday_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Birthday</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-birthday" style="display: none;"></div>\n                <input data-qe-id="form-input-birthday-month" id="birthday_month_' +
__e( data.form_index ) +
'" type="number" name="birthday_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" min="1" max="12" maxlength="2" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('birthday_aria_label_month') ) +
'"> / <input data-qe-id="form-input-birthday-day" id="birthday_day_' +
__e( data.form_index ) +
'" type="number" name="birthday_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('birthday_aria_label_day') ) +
'">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'anniversary')) { ;
__p += '\n            <div id="anniversary_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-anniversary" id="anniversary_label_' +
__e( data.form_index ) +
'" for="anniversary_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Anniversary</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-anniversary" style="display: none;"></div>\n                <input data-qe-id="form-input-anniversary-month" id="anniversary_month_' +
__e( data.form_index ) +
'" type="number" name="anniversary_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="12" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_month') ) +
'"> / <input data-qe-id="form-input-anniversary-day" id="anniversary_day_' +
__e( data.form_index ) +
'" type="number" name="anniversary_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_day') ) +
'"> / <input data-qe-id="form-input-anniversary-year" id="anniversary_year_' +
__e( data.form_index ) +
'" type="number" name="anniversary_year" value="" placeholder="YYYY" class="ctct-form-element ctct-form-date-field-4" maxlength="4" min="1900" max="' +
__e( data.max_anniversary_year ) +
'" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_year') ) +
'">\n            </div>\n            ';
 } ;
__p += '\n\n        ';
 _.each(data._customFields, function(customField) { ;
__p += '\n            ';
 if(customField.type === 'custom_field_string') { ;
__p += '\n            <div id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_label_' +
__e( data.form_index ) +
'" for="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_' +
__e( data.form_index ) +
'" class="ctct-form-label ctct-form-label ">' +
__e( customField.label ) +
'</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-custom-field-' +
__e( customField.label ) +
'" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_' +
__e( data.form_index ) +
'" type="text" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'" value="" maxlength="255">\n            </div>\n            ';
 } ;
__p += '\n            ';
 if(customField.type === 'custom_field_date') { ;
__p += '\n            <div id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_label_' +
__e( data.form_index ) +
'" for="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">' +
__e( customField.label ) +
'</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-custom-field-' +
__e( customField.label ) +
'" style="display: none;"></div>\n                <input data-qe-id="form-input-custom-field-month-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="12" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_month') ) +
'"> / <input data-qe-id="form-input-custom-field-day-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_day_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_day') ) +
'"> / <input data-qe-id="form-input-custom-field-year-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_year_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_year" value="" placeholder="YYYY" class="ctct-form-element ctct-form-date-field-4" maxlength="4" min="1900" max="9999" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_year') ) +
'">\n            </div>\n            ';
 } ;
__p += '\n        ';
 }); ;
__p += '\n\n            ';
 if (data.list_ids.length > 1) { ;
__p += '\n            <fieldset id="list_memberships_field_' +
__e( data.form_index ) +
'" class="ctct-form-lists">\n                <legend id="list_memberships_label_' +
__e( data.form_index ) +
'" class="ctct-form-required ctct-form-lists-legend">Email Lists</legend>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-list_memberships" style="display: none;"></div>\n                ';
 _.each(data._emailLists, function(emailList, index) { ;
__p += '\n                    <div class="ctct-form-listitem">\n                        <input class="ctct-form-checkbox" data-qe-id="form-input-list-' +
__e( emailList.label ) +
'" id="email_list_' +
__e( index ) +
'_' +
__e( data.form_index ) +
'" type="checkbox" name="emailList" value="' +
__e( emailList.id ) +
'">\n                        <label data-qe-id="form-label-list-' +
__e( emailList.label ) +
'" for="email_list_' +
__e( index ) +
'_' +
__e( data.form_index ) +
'" class="ctct-form-listname ctct-form-checkbox-label">' +
__e( emailList.label ) +
'</label>\n                    </div>\n                ';
 }); ;
__p += '\n            </fieldset>\n            ';
 } ;
__p += '\n\n            <div id="error_message_' +
__e( data.form_index ) +
'" class="ctct-form-error" style="display:none;">\n                <p class="ctct-form-errorMessage">Sorry, we could not complete your sign-up. Please contact us to resolve this.</p>\n            </div>\n            <div id="network_error_message_' +
__e( data.form_index ) +
'" class="ctct-form-error" style="display:none;">\n                <p class="ctct-form-errorMessage">Operation timed out, please try again.</p>\n            </div>\n\n\n            <button data-qe-id="form-button" type="button" class="ctct-form-button">' +
__e( data.buttonText ) +
'</button>\n\n            ';
 if (data.recaptchaKey) { ;
__p += '\n            <div class="g-recaptcha" id="ctct_recaptcha_' +
__e( data.form_index ) +
'" data-sitekey="' +
__e( data.recaptchaKey ) +
'" data-size="invisible">\n            </div>\n            ';
 } ;
__p += '\n        </form>\n        <p class="ctct-form-footer">\n            ';
 if (!data.hideBranding) { ;
__p += '\n            <span data-qe-id="form-branding">\n                Powered by <a href="http://www.constantcontact.com/index.jsp?cc=forms_inline" rel="nofollow" target="_blank" class="ctct-form-footer-link">Constant Contact</a> |\n            </span>\n            ';
 } ;
__p += '\n            <a href="' +
__e( data._defaults.privacyUrl ) +
'" target="_blank" data-qe-id="form-privacy-link" class="ctct-form-footer-link">Privacy</a>\n        </p>\n    </div>\n</div>\n';
return __p
};

SignUpFormWidget["JST"]["dist/templates/en_US/popup_form.html"] = function(data) {
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
__p += '<div class="ctct-form-defaults" data-qe-id="form-background">\n    <div id="success_message_' +
__e( data.form_index ) +
'" class="ctct-form-success" style="display:none;" data-qe-id="success-message">\n        <h2 class="ctct-form-header">Thanks for signing up!</h2>\n        <p class="ctct-form-text">You can unsubscribe at any time using the Unsubscribe link at the bottom of every email.</p>\n    </div>\n    <form class="ctct-form-custom" id="ctct_form_' +
__e( data.form_index ) +
'" autocomplete="on" data-qe-id="form-data">\n        ';
 if(!_.isEmpty(data.titleText)) { ;
__p += '\n        <h2 data-qe-id="form-title" class="ctct-form-header">' +
__e( data.titleText ) +
'</h2>\n        ';
 } ;
__p += '\n        ';
 if(!_.isEmpty(data.descriptionText)) { ;
__p += '\n        <p data-qe-id="form-description" class="ctct-form-text">' +
__e( data.descriptionText ) +
'</p>\n        ';
 } ;
__p += '\n\n        <div id="email_address_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-email" id="email_address_label_' +
__e( data.form_index ) +
'" for="email_address_' +
__e( data.form_index ) +
'" class="ctct-form-label ctct-form-required">Email</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-email" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-email" id="email_address_' +
__e( data.form_index ) +
'" type="email" name="email_address" value="" maxlength="80">\n        </div>\n\n        ';
 if(_.contains(data.contact_fields, 'first_name')) { ;
__p += '\n        <div id="first_name_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-first-name" id="first_name_label_' +
__e( data.form_index ) +
'" for="first_name_' +
__e( data.form_index ) +
'" class="ctct-form-label ">First Name</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-first-name" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-first-name" id="first_name_' +
__e( data.form_index ) +
'" type="text" name="first_name" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'last_name')) { ;
__p += '\n        <div id="last_name_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-last-name" id="last_name_label_' +
__e( data.form_index ) +
'" for="last_name_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Last Name</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-last-name" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-last-name" id="last_name_' +
__e( data.form_index ) +
'" type="text" name="last_name" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'phone')) { ;
__p += '\n        <div id="phone_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-phone" id="phone_label_' +
__e( data.form_index ) +
'" for="phone_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Phone</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-phone" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-phone" id="phone_' +
__e( data.form_index ) +
'" type="tel" name="phone" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'country')) { ;
__p += '\n        <div id="country_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-country" id="country_label_' +
__e( data.form_index ) +
'" for="country_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Country</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-country" style="display: none;"></div>\n            <select class="ctct-select-element" data-qe-id="form-select-country-' +
__e( data.form_index ) +
'" id="country_' +
__e( data.form_index ) +
'" name="country">\n                <option value="">--</option>\n                ';
 _.each(data._defaults.countries, function(country) { ;
__p += '\n                    ';
 if (country.countryCode === data.selectedCountry) { ;
__p += '\n                        <option value="' +
__e( country.countryCode ) +
'" selected>' +
__e( country.display ) +
'</option>\n                    ';
 } else { ;
__p += '\n                        <option value="' +
__e( country.countryCode ) +
'">' +
__e( country.display ) +
'</option>\n                    ';
 } ;
__p += '\n                ';
 }); ;
__p += '\n            </select>\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'street')) { ;
__p += '\n        <div id="street_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-street" id="street_label_' +
__e( data.form_index ) +
'" for="street_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Street</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-street" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-street" id="street_' +
__e( data.form_index ) +
'" type="text" name="street" value="" maxlength="255">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'city')) { ;
__p += '\n        <div id="city_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-city" id="city_label_' +
__e( data.form_index ) +
'" for="city_' +
__e( data.form_index ) +
'" class="ctct-form-label ">City</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-city" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-city" id="city_' +
__e( data.form_index ) +
'" type="text" name="city" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'state')) { ;
__p += '\n        <div id="state_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-state" id="state_label_' +
__e( data.form_index ) +
'" for="state_' +
__e( data.form_index ) +
'" class="ctct-form-label ">State/Province</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-state" style="display: none;"></div>\n            <input data-qe-id="form-input-state" class="state_' +
__e( data.form_index ) +
' ctct-form-element" id="state_' +
__e( data.form_index ) +
'" type="text" name="state" value="" maxlength="50">\n            <select data-qe-id="form-select-state-' +
__e( data.form_index ) +
'" class="state_' +
__e( data.form_index ) +
' ctct-select-element" id="state_' +
__e( data.form_index ) +
'" style="display: none;" name="state">\n            </select>\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'postal_code')) { ;
__p += '\n        <div id="postal_code_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-postal-code" id="postal_code_label_' +
__e( data.form_index ) +
'" for="postal_code_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Postal Code</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-postal-code" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-postal-code" id="postal_code_' +
__e( data.form_index ) +
'" type="text" name="postal_code" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'company')) { ;
__p += '\n        <div id="company_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-company" id="company_label_' +
__e( data.form_index ) +
'" for="company_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Company</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-company" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-company" id="company_' +
__e( data.form_index ) +
'" type="text" name="company" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'job_title')) { ;
__p += '\n        <div id="job_title_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-title" id="job_title_label_' +
__e( data.form_index ) +
'" for="job_title_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Job Title</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-job-title" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-title" id="job_title_' +
__e( data.form_index ) +
'" type="text" name="job_title" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'birthday')) { ;
__p += '\n        <div id="birthday_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-birthday" id="birthday_label_' +
__e( data.form_index ) +
'" for="birthday_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Birthday</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-birthday" style="display: none;"></div>\n            <input data-qe-id="form-input-birthday-month" id="birthday_month_' +
__e( data.form_index ) +
'" type="number" name="birthday_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" min="1" max="12" maxlength="2" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('birthday_aria_label_month') ) +
'"> / <input data-qe-id="form-input-birthday-day" id="birthday_day_' +
__e( data.form_index ) +
'" type="number" name="birthday_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('birthday_aria_label_day') ) +
'">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'anniversary')) { ;
__p += '\n        <div id="anniversary_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-anniversary" id="anniversary_label_' +
__e( data.form_index ) +
'" for="anniversary_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Anniversary</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-anniversary" style="display: none;"></div>\n            <input data-qe-id="form-input-anniversary-month" id="anniversary_month_' +
__e( data.form_index ) +
'" type="number" name="anniversary_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="12" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_month') ) +
'"> / <input data-qe-id="form-input-anniversary-day" id="anniversary_day_' +
__e( data.form_index ) +
'" type="number" name="anniversary_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_day') ) +
'"> / <input data-qe-id="form-input-anniversary-year" id="anniversary_year_' +
__e( data.form_index ) +
'" type="number" name="anniversary_year" value="" placeholder="YYYY" class="ctct-form-element ctct-form-date-field-4" maxlength="4" min="1900" max="' +
__e( data.max_anniversary_year ) +
'" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_year') ) +
'">\n        </div>\n        ';
 } ;
__p += '\n\n    ';
 _.each(data._customFields, function(customField) { ;
__p += '\n        ';
 if(customField.type === 'custom_field_string') { ;
__p += '\n        <div id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_label_' +
__e( data.form_index ) +
'" for="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_' +
__e( data.form_index ) +
'" class="ctct-form-label ctct-form-label ">' +
__e( customField.label ) +
'</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-custom-field-' +
__e( customField.label ) +
'" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_' +
__e( data.form_index ) +
'" type="text" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'" value="" maxlength="255">\n        </div>\n        ';
 } ;
__p += '\n        ';
 if(customField.type === 'custom_field_date') { ;
__p += '\n        <div id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_label_' +
__e( data.form_index ) +
'" for="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">' +
__e( customField.label ) +
'</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-custom-field-' +
__e( customField.label ) +
'" style="display: none;"></div>\n            <input data-qe-id="form-input-custom-field-month-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="12" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_month') ) +
'"> / <input data-qe-id="form-input-custom-field-day-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_day_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_day') ) +
'"> / <input data-qe-id="form-input-custom-field-year-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_year_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_year" value="" placeholder="YYYY" class="ctct-form-element ctct-form-date-field-4" maxlength="4" min="1900" max="9999" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_year') ) +
'">\n        </div>\n        ';
 } ;
__p += '\n    ';
 }); ;
__p += '\n\n        ';
 if (data.list_ids.length > 1) { ;
__p += '\n        <fieldset id="list_memberships_field_' +
__e( data.form_index ) +
'" class="ctct-form-lists">\n            <legend id="list_memberships_label_' +
__e( data.form_index ) +
'" class="ctct-form-required ctct-form-lists-legend">Email Lists</legend>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-list_memberships" style="display: none;"></div>\n            ';
 _.each(data._emailLists, function(emailList, index) { ;
__p += '\n                <div class="ctct-form-listitem">\n                    <input class="ctct-form-checkbox" data-qe-id="form-input-list-' +
__e( emailList.label ) +
'" id="email_list_' +
__e( index ) +
'_' +
__e( data.form_index ) +
'" type="checkbox" name="emailList" value="' +
__e( emailList.id ) +
'">\n                    <label data-qe-id="form-label-list-' +
__e( emailList.label ) +
'" for="email_list_' +
__e( index ) +
'_' +
__e( data.form_index ) +
'" class="ctct-form-listname ctct-form-checkbox-label">' +
__e( emailList.label ) +
'</label>\n                </div>\n            ';
 }); ;
__p += '\n        </fieldset>\n        ';
 } ;
__p += '\n\n        <div id="error_message_' +
__e( data.form_index ) +
'" class="ctct-form-error" style="display:none;">\n            <p class="ctct-form-errorMessage">Sorry, we could not complete your sign-up. Please contact us to resolve this.</p>\n        </div>\n        <div id="network_error_message_' +
__e( data.form_index ) +
'" class="ctct-form-error" style="display:none;">\n            <p class="ctct-form-errorMessage">Operation timed out, please try again.</p>\n        </div>\n\n\n        <button data-qe-id="form-button" type="button" class="ctct-form-button">' +
__e( data.buttonText ) +
'</button>\n    </form>\n    <p class="ctct-form-footer">\n        ';
 if(!data.hideBranding) { ;
__p += '\n        <span data-qe-id="form-branding">\n            Powered by <a href="http://www.constantcontact.com/index.jsp?cc=forms_popup" rel="nofollow" target="_blank" class="ctct-form-footer-link">Constant Contact</a> |\n        </span>\n        ';
 } ;
__p += '\n        <a href="' +
__e( data._defaults.privacyUrl ) +
'" target="_blank" data-qe-id="form-privacy-link" class="ctct-form-footer-link">Privacy</a>\n    </p>\n</div>\n\n';
return __p
};

SignUpFormWidget["JST"]["dist/templates/en_US/popup_wrapper.html"] = function(data) {
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
__p += '<div class="ctct-popup-wrapper form_' +
__e( data.form_index ) +
'">\n    <div class="ctct-popup-overlay"></div>\n    <div class="ctct-popup-inner">\n      <div class="ctct-popup-content">\n        <button type="button" class="ctct-popup-close js-popup-close" title="Close">\n            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" class="undefined">\n                <polygon points="14 11 11 14 8 11 5 14 2 11 5 8 2 5 5 2 8 5 11 2 14 5 11 8 " class="undefined"/>\n            </svg>\n        </button>\n        <div class="ctct-form-container ctct-form-popup form_' +
__e( data.form_index ) +
'"></div>\n      </div>\n    </div>\n\n    ';
 if (data.recaptchaKey) { ;
__p += '\n    <div class="g-recaptcha" id="ctct_recaptcha_' +
__e( data.form_index ) +
'" data-sitekey="' +
__e( data.recaptchaKey ) +
'" data-size="invisible"></div>\n    ';
 } ;
__p += '\n</div>\n';
return __p
};

SignUpFormWidget["JST"]["dist/templates/es/inline_form.html"] = function(data) {
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
__p += '<div class="ctct-form-container ctct-form-embed form_' +
__e( data.form_index ) +
'">\n    <div class="ctct-form-defaults" data-qe-id="form-background">\n        <div id="success_message_' +
__e( data.form_index ) +
'" class="ctct-form-success" style="display:none;" data-qe-id="success-message">\n            <h2 class="ctct-form-header">Â¡Gracias por suscribirse!</h2>\n            <p class="ctct-form-text">Puede cancelar la suscripciÃ³n en cualquier momento si pulsa el enlace para cancelar la suscripciÃ³n situado al final de cada correo electrÃ³nico.</p>\n        </div>\n        <form class="ctct-form-custom" id="ctct_form_' +
__e( data.form_index ) +
'" autocomplete="on" data-qe-id="form-data">\n            ';
 if(!_.isEmpty(data.titleText)) { ;
__p += '\n            <h2 data-qe-id="form-title" class="ctct-form-header">' +
__e( data.titleText ) +
'</h2>\n            ';
 } ;
__p += '\n            ';
 if(!_.isEmpty(data.descriptionText)) { ;
__p += '\n            <p data-qe-id="form-description" class="ctct-form-text">' +
__e( data.descriptionText ) +
'</p>\n            ';
 } ;
__p += '\n\n            <div id="email_address_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-email" id="email_address_label_' +
__e( data.form_index ) +
'" for="email_address_' +
__e( data.form_index ) +
'" class="ctct-form-label ctct-form-required">DirecciÃ³n de correo electrÃ³nico</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-email" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-email" id="email_address_' +
__e( data.form_index ) +
'" type="email" name="email_address" value="" maxlength="80">\n            </div>\n\n            ';
 if(_.contains(data.contact_fields, 'first_name')) { ;
__p += '\n            <div id="first_name_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-first-name" id="first_name_label_' +
__e( data.form_index ) +
'" for="first_name_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Nombre</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-first-name" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-first-name" id="first_name_' +
__e( data.form_index ) +
'" type="text" name="first_name" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'last_name')) { ;
__p += '\n            <div id="last_name_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-last-name" id="last_name_label_' +
__e( data.form_index ) +
'" for="last_name_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Apellidos</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-last-name" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-last-name" id="last_name_' +
__e( data.form_index ) +
'" type="text" name="last_name" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'phone')) { ;
__p += '\n            <div id="phone_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-phone" id="phone_label_' +
__e( data.form_index ) +
'" for="phone_' +
__e( data.form_index ) +
'" class="ctct-form-label ">TelÃ©fono</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-phone" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-phone" id="phone_' +
__e( data.form_index ) +
'" type="tel" name="phone" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'country')) { ;
__p += '\n            <div id="country_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-country" id="country_label_' +
__e( data.form_index ) +
'" for="country_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Seleccione un paÃ­s</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-country" style="display: none;"></div>\n                <select class="ctct-select-element" data-qe-id="form-select-country-' +
__e( data.form_index ) +
'" id="country_' +
__e( data.form_index ) +
'" name="country">\n                    <option value="">--</option>\n                    ';
 _.each(data._defaults.countries, function(country) { ;
__p += '\n                        ';
 if (country.countryCode === data.selectedCountry) { ;
__p += '\n                            <option value="' +
__e( country.countryCode ) +
'" selected>' +
__e( country.display ) +
'</option>\n                        ';
 } else { ;
__p += '\n                            <option value="' +
__e( country.countryCode ) +
'">' +
__e( country.display ) +
'</option>\n                        ';
 } ;
__p += '\n                    ';
 }); ;
__p += '\n                </select>\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'street')) { ;
__p += '\n            <div id="street_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-street" id="street_label_' +
__e( data.form_index ) +
'" for="street_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Calle</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-street" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-street" id="street_' +
__e( data.form_index ) +
'" type="text" name="street" value="" maxlength="255">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'city')) { ;
__p += '\n            <div id="city_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-city" id="city_label_' +
__e( data.form_index ) +
'" for="city_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Ciudad</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-city" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-city" id="city_' +
__e( data.form_index ) +
'" type="text" name="city" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'state')) { ;
__p += '\n            <div id="state_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-state" id="state_label_' +
__e( data.form_index ) +
'" for="state_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Seleccione un estado/provincia</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-state" style="display: none;"></div>\n                <input data-qe-id="form-input-state" class="state_' +
__e( data.form_index ) +
' ctct-form-element" id="state_' +
__e( data.form_index ) +
'" type="text" name="state" value="" maxlength="50">\n                <select data-qe-id="form-select-state-' +
__e( data.form_index ) +
'" class="state_' +
__e( data.form_index ) +
' ctct-select-element" id="state_' +
__e( data.form_index ) +
'" style="display: none;" name="state">\n                </select>\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'postal_code')) { ;
__p += '\n            <div id="postal_code_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-postal-code" id="postal_code_label_' +
__e( data.form_index ) +
'" for="postal_code_' +
__e( data.form_index ) +
'" class="ctct-form-label ">CÃ³digo postal</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-postal-code" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-postal-code" id="postal_code_' +
__e( data.form_index ) +
'" type="text" name="postal_code" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'company')) { ;
__p += '\n            <div id="company_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-company" id="company_label_' +
__e( data.form_index ) +
'" for="company_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Empresa</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-company" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-company" id="company_' +
__e( data.form_index ) +
'" type="text" name="company" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'job_title')) { ;
__p += '\n            <div id="job_title_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-title" id="job_title_label_' +
__e( data.form_index ) +
'" for="job_title_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Cargo laboral</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-job-title" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-title" id="job_title_' +
__e( data.form_index ) +
'" type="text" name="job_title" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'birthday')) { ;
__p += '\n            <div id="birthday_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-birthday" id="birthday_label_' +
__e( data.form_index ) +
'" for="birthday_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">CumpleaÃ±os</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-birthday" style="display: none;"></div>\n                <input data-qe-id="form-input-birthday-month" id="birthday_month_' +
__e( data.form_index ) +
'" type="number" name="birthday_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" min="1" max="12" maxlength="2" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('birthday_aria_label_month') ) +
'"> / <input data-qe-id="form-input-birthday-day" id="birthday_day_' +
__e( data.form_index ) +
'" type="number" name="birthday_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('birthday_aria_label_day') ) +
'">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'anniversary')) { ;
__p += '\n            <div id="anniversary_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-anniversary" id="anniversary_label_' +
__e( data.form_index ) +
'" for="anniversary_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Aniversario</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-anniversary" style="display: none;"></div>\n                <input data-qe-id="form-input-anniversary-month" id="anniversary_month_' +
__e( data.form_index ) +
'" type="number" name="anniversary_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="12" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_month') ) +
'"> / <input data-qe-id="form-input-anniversary-day" id="anniversary_day_' +
__e( data.form_index ) +
'" type="number" name="anniversary_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_day') ) +
'"> / <input data-qe-id="form-input-anniversary-year" id="anniversary_year_' +
__e( data.form_index ) +
'" type="number" name="anniversary_year" value="" placeholder="YYYY" class="ctct-form-element ctct-form-date-field-4" maxlength="4" min="1900" max="' +
__e( data.max_anniversary_year ) +
'" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_year') ) +
'">\n            </div>\n            ';
 } ;
__p += '\n\n        ';
 _.each(data._customFields, function(customField) { ;
__p += '\n            ';
 if(customField.type === 'custom_field_string') { ;
__p += '\n            <div id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_label_' +
__e( data.form_index ) +
'" for="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_' +
__e( data.form_index ) +
'" class="ctct-form-label ctct-form-label ">' +
__e( customField.label ) +
'</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-custom-field-' +
__e( customField.label ) +
'" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_' +
__e( data.form_index ) +
'" type="text" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'" value="" maxlength="255">\n            </div>\n            ';
 } ;
__p += '\n            ';
 if(customField.type === 'custom_field_date') { ;
__p += '\n            <div id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_label_' +
__e( data.form_index ) +
'" for="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">' +
__e( customField.label ) +
'</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-custom-field-' +
__e( customField.label ) +
'" style="display: none;"></div>\n                <input data-qe-id="form-input-custom-field-month-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="12" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_month') ) +
'"> / <input data-qe-id="form-input-custom-field-day-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_day_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_day') ) +
'"> / <input data-qe-id="form-input-custom-field-year-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_year_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_year" value="" placeholder="YYYY" class="ctct-form-element ctct-form-date-field-4" maxlength="4" min="1900" max="9999" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_year') ) +
'">\n            </div>\n            ';
 } ;
__p += '\n        ';
 }); ;
__p += '\n\n            ';
 if (data.list_ids.length > 1) { ;
__p += '\n            <fieldset id="list_memberships_field_' +
__e( data.form_index ) +
'" class="ctct-form-lists">\n                <legend id="list_memberships_label_' +
__e( data.form_index ) +
'" class="ctct-form-required ctct-form-lists-legend">Listas de correo electrÃ³nico</legend>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-list_memberships" style="display: none;"></div>\n                ';
 _.each(data._emailLists, function(emailList, index) { ;
__p += '\n                    <div class="ctct-form-listitem">\n                        <input class="ctct-form-checkbox" data-qe-id="form-input-list-' +
__e( emailList.label ) +
'" id="email_list_' +
__e( index ) +
'_' +
__e( data.form_index ) +
'" type="checkbox" name="emailList" value="' +
__e( emailList.id ) +
'">\n                        <label data-qe-id="form-label-list-' +
__e( emailList.label ) +
'" for="email_list_' +
__e( index ) +
'_' +
__e( data.form_index ) +
'" class="ctct-form-listname ctct-form-checkbox-label">' +
__e( emailList.label ) +
'</label>\n                    </div>\n                ';
 }); ;
__p += '\n            </fieldset>\n            ';
 } ;
__p += '\n\n            <div id="error_message_' +
__e( data.form_index ) +
'" class="ctct-form-error" style="display:none;">\n                <p class="ctct-form-errorMessage">Lo sentimos, no hemos podido completar el registro. PÃ³ngase en contacto con nosotros para solucionarlo.</p>\n            </div>\n            <div id="network_error_message_' +
__e( data.form_index ) +
'" class="ctct-form-error" style="display:none;">\n                <p class="ctct-form-errorMessage">Operation timed out, please try again.</p>\n            </div>\n\n\n            <button data-qe-id="form-button" type="button" class="ctct-form-button">' +
__e( data.buttonText ) +
'</button>\n\n            ';
 if (data.recaptchaKey) { ;
__p += '\n            <div class="g-recaptcha" id="ctct_recaptcha_' +
__e( data.form_index ) +
'" data-sitekey="' +
__e( data.recaptchaKey ) +
'" data-size="invisible">\n            </div>\n            ';
 } ;
__p += '\n        </form>\n        <p class="ctct-form-footer">\n            ';
 if (!data.hideBranding) { ;
__p += '\n            <span data-qe-id="form-branding">\n                 <a href="http://www.constantcontact.com/index.jsp?cc=forms_inline" rel="nofollow" target="_blank" class="ctct-form-footer-link">Constant Contact</a> |\n            </span>\n            ';
 } ;
__p += '\n            <a href="' +
__e( data._defaults.privacyUrl ) +
'" target="_blank" data-qe-id="form-privacy-link" class="ctct-form-footer-link">Privacidad</a>\n        </p>\n    </div>\n</div>\n';
return __p
};

SignUpFormWidget["JST"]["dist/templates/es/popup_form.html"] = function(data) {
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
__p += '<div class="ctct-form-defaults" data-qe-id="form-background">\n    <div id="success_message_' +
__e( data.form_index ) +
'" class="ctct-form-success" style="display:none;" data-qe-id="success-message">\n        <h2 class="ctct-form-header">Â¡Gracias por suscribirse!</h2>\n        <p class="ctct-form-text">Puede cancelar la suscripciÃ³n en cualquier momento si pulsa el enlace para cancelar la suscripciÃ³n situado al final de cada correo electrÃ³nico.</p>\n    </div>\n    <form class="ctct-form-custom" id="ctct_form_' +
__e( data.form_index ) +
'" autocomplete="on" data-qe-id="form-data">\n        ';
 if(!_.isEmpty(data.titleText)) { ;
__p += '\n        <h2 data-qe-id="form-title" class="ctct-form-header">' +
__e( data.titleText ) +
'</h2>\n        ';
 } ;
__p += '\n        ';
 if(!_.isEmpty(data.descriptionText)) { ;
__p += '\n        <p data-qe-id="form-description" class="ctct-form-text">' +
__e( data.descriptionText ) +
'</p>\n        ';
 } ;
__p += '\n\n        <div id="email_address_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-email" id="email_address_label_' +
__e( data.form_index ) +
'" for="email_address_' +
__e( data.form_index ) +
'" class="ctct-form-label ctct-form-required">DirecciÃ³n de correo electrÃ³nico</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-email" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-email" id="email_address_' +
__e( data.form_index ) +
'" type="email" name="email_address" value="" maxlength="80">\n        </div>\n\n        ';
 if(_.contains(data.contact_fields, 'first_name')) { ;
__p += '\n        <div id="first_name_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-first-name" id="first_name_label_' +
__e( data.form_index ) +
'" for="first_name_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Nombre</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-first-name" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-first-name" id="first_name_' +
__e( data.form_index ) +
'" type="text" name="first_name" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'last_name')) { ;
__p += '\n        <div id="last_name_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-last-name" id="last_name_label_' +
__e( data.form_index ) +
'" for="last_name_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Apellidos</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-last-name" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-last-name" id="last_name_' +
__e( data.form_index ) +
'" type="text" name="last_name" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'phone')) { ;
__p += '\n        <div id="phone_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-phone" id="phone_label_' +
__e( data.form_index ) +
'" for="phone_' +
__e( data.form_index ) +
'" class="ctct-form-label ">TelÃ©fono</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-phone" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-phone" id="phone_' +
__e( data.form_index ) +
'" type="tel" name="phone" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'country')) { ;
__p += '\n        <div id="country_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-country" id="country_label_' +
__e( data.form_index ) +
'" for="country_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Seleccione un paÃ­s</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-country" style="display: none;"></div>\n            <select class="ctct-select-element" data-qe-id="form-select-country-' +
__e( data.form_index ) +
'" id="country_' +
__e( data.form_index ) +
'" name="country">\n                <option value="">--</option>\n                ';
 _.each(data._defaults.countries, function(country) { ;
__p += '\n                    ';
 if (country.countryCode === data.selectedCountry) { ;
__p += '\n                        <option value="' +
__e( country.countryCode ) +
'" selected>' +
__e( country.display ) +
'</option>\n                    ';
 } else { ;
__p += '\n                        <option value="' +
__e( country.countryCode ) +
'">' +
__e( country.display ) +
'</option>\n                    ';
 } ;
__p += '\n                ';
 }); ;
__p += '\n            </select>\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'street')) { ;
__p += '\n        <div id="street_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-street" id="street_label_' +
__e( data.form_index ) +
'" for="street_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Calle</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-street" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-street" id="street_' +
__e( data.form_index ) +
'" type="text" name="street" value="" maxlength="255">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'city')) { ;
__p += '\n        <div id="city_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-city" id="city_label_' +
__e( data.form_index ) +
'" for="city_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Ciudad</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-city" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-city" id="city_' +
__e( data.form_index ) +
'" type="text" name="city" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'state')) { ;
__p += '\n        <div id="state_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-state" id="state_label_' +
__e( data.form_index ) +
'" for="state_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Seleccione un estado/provincia</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-state" style="display: none;"></div>\n            <input data-qe-id="form-input-state" class="state_' +
__e( data.form_index ) +
' ctct-form-element" id="state_' +
__e( data.form_index ) +
'" type="text" name="state" value="" maxlength="50">\n            <select data-qe-id="form-select-state-' +
__e( data.form_index ) +
'" class="state_' +
__e( data.form_index ) +
' ctct-select-element" id="state_' +
__e( data.form_index ) +
'" style="display: none;" name="state">\n            </select>\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'postal_code')) { ;
__p += '\n        <div id="postal_code_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-postal-code" id="postal_code_label_' +
__e( data.form_index ) +
'" for="postal_code_' +
__e( data.form_index ) +
'" class="ctct-form-label ">CÃ³digo postal</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-postal-code" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-postal-code" id="postal_code_' +
__e( data.form_index ) +
'" type="text" name="postal_code" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'company')) { ;
__p += '\n        <div id="company_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-company" id="company_label_' +
__e( data.form_index ) +
'" for="company_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Empresa</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-company" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-company" id="company_' +
__e( data.form_index ) +
'" type="text" name="company" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'job_title')) { ;
__p += '\n        <div id="job_title_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-title" id="job_title_label_' +
__e( data.form_index ) +
'" for="job_title_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Cargo laboral</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-job-title" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-title" id="job_title_' +
__e( data.form_index ) +
'" type="text" name="job_title" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'birthday')) { ;
__p += '\n        <div id="birthday_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-birthday" id="birthday_label_' +
__e( data.form_index ) +
'" for="birthday_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">CumpleaÃ±os</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-birthday" style="display: none;"></div>\n            <input data-qe-id="form-input-birthday-month" id="birthday_month_' +
__e( data.form_index ) +
'" type="number" name="birthday_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" min="1" max="12" maxlength="2" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('birthday_aria_label_month') ) +
'"> / <input data-qe-id="form-input-birthday-day" id="birthday_day_' +
__e( data.form_index ) +
'" type="number" name="birthday_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('birthday_aria_label_day') ) +
'">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'anniversary')) { ;
__p += '\n        <div id="anniversary_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-anniversary" id="anniversary_label_' +
__e( data.form_index ) +
'" for="anniversary_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Aniversario</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-anniversary" style="display: none;"></div>\n            <input data-qe-id="form-input-anniversary-month" id="anniversary_month_' +
__e( data.form_index ) +
'" type="number" name="anniversary_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="12" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_month') ) +
'"> / <input data-qe-id="form-input-anniversary-day" id="anniversary_day_' +
__e( data.form_index ) +
'" type="number" name="anniversary_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_day') ) +
'"> / <input data-qe-id="form-input-anniversary-year" id="anniversary_year_' +
__e( data.form_index ) +
'" type="number" name="anniversary_year" value="" placeholder="YYYY" class="ctct-form-element ctct-form-date-field-4" maxlength="4" min="1900" max="' +
__e( data.max_anniversary_year ) +
'" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_year') ) +
'">\n        </div>\n        ';
 } ;
__p += '\n\n    ';
 _.each(data._customFields, function(customField) { ;
__p += '\n        ';
 if(customField.type === 'custom_field_string') { ;
__p += '\n        <div id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_label_' +
__e( data.form_index ) +
'" for="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_' +
__e( data.form_index ) +
'" class="ctct-form-label ctct-form-label ">' +
__e( customField.label ) +
'</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-custom-field-' +
__e( customField.label ) +
'" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_' +
__e( data.form_index ) +
'" type="text" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'" value="" maxlength="255">\n        </div>\n        ';
 } ;
__p += '\n        ';
 if(customField.type === 'custom_field_date') { ;
__p += '\n        <div id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_label_' +
__e( data.form_index ) +
'" for="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">' +
__e( customField.label ) +
'</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-custom-field-' +
__e( customField.label ) +
'" style="display: none;"></div>\n            <input data-qe-id="form-input-custom-field-month-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="12" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_month') ) +
'"> / <input data-qe-id="form-input-custom-field-day-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_day_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_day') ) +
'"> / <input data-qe-id="form-input-custom-field-year-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_year_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_year" value="" placeholder="YYYY" class="ctct-form-element ctct-form-date-field-4" maxlength="4" min="1900" max="9999" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_year') ) +
'">\n        </div>\n        ';
 } ;
__p += '\n    ';
 }); ;
__p += '\n\n        ';
 if (data.list_ids.length > 1) { ;
__p += '\n        <fieldset id="list_memberships_field_' +
__e( data.form_index ) +
'" class="ctct-form-lists">\n            <legend id="list_memberships_label_' +
__e( data.form_index ) +
'" class="ctct-form-required ctct-form-lists-legend">Listas de correo electrÃ³nico</legend>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-list_memberships" style="display: none;"></div>\n            ';
 _.each(data._emailLists, function(emailList, index) { ;
__p += '\n                <div class="ctct-form-listitem">\n                    <input class="ctct-form-checkbox" data-qe-id="form-input-list-' +
__e( emailList.label ) +
'" id="email_list_' +
__e( index ) +
'_' +
__e( data.form_index ) +
'" type="checkbox" name="emailList" value="' +
__e( emailList.id ) +
'">\n                    <label data-qe-id="form-label-list-' +
__e( emailList.label ) +
'" for="email_list_' +
__e( index ) +
'_' +
__e( data.form_index ) +
'" class="ctct-form-listname ctct-form-checkbox-label">' +
__e( emailList.label ) +
'</label>\n                </div>\n            ';
 }); ;
__p += '\n        </fieldset>\n        ';
 } ;
__p += '\n\n        <div id="error_message_' +
__e( data.form_index ) +
'" class="ctct-form-error" style="display:none;">\n            <p class="ctct-form-errorMessage">Lo sentimos, no hemos podido completar el registro. PÃ³ngase en contacto con nosotros para solucionarlo.</p>\n        </div>\n        <div id="network_error_message_' +
__e( data.form_index ) +
'" class="ctct-form-error" style="display:none;">\n            <p class="ctct-form-errorMessage">Operation timed out, please try again.</p>\n        </div>\n\n\n        <button data-qe-id="form-button" type="button" class="ctct-form-button">' +
__e( data.buttonText ) +
'</button>\n    </form>\n    <p class="ctct-form-footer">\n        ';
 if(!data.hideBranding) { ;
__p += '\n        <span data-qe-id="form-branding">\n             <a href="http://www.constantcontact.com/index.jsp?cc=forms_popup" rel="nofollow" target="_blank" class="ctct-form-footer-link">Constant Contact</a> |\n        </span>\n        ';
 } ;
__p += '\n        <a href="' +
__e( data._defaults.privacyUrl ) +
'" target="_blank" data-qe-id="form-privacy-link" class="ctct-form-footer-link">Privacidad</a>\n    </p>\n</div>\n\n';
return __p
};

SignUpFormWidget["JST"]["dist/templates/es/popup_wrapper.html"] = function(data) {
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
__p += '<div class="ctct-popup-wrapper form_' +
__e( data.form_index ) +
'">\n    <div class="ctct-popup-overlay"></div>\n    <div class="ctct-popup-inner">\n      <div class="ctct-popup-content">\n        <button type="button" class="ctct-popup-close js-popup-close" title="Close">\n            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" class="undefined">\n                <polygon points="14 11 11 14 8 11 5 14 2 11 5 8 2 5 5 2 8 5 11 2 14 5 11 8 " class="undefined"/>\n            </svg>\n        </button>\n        <div class="ctct-form-container ctct-form-popup form_' +
__e( data.form_index ) +
'"></div>\n      </div>\n    </div>\n\n    ';
 if (data.recaptchaKey) { ;
__p += '\n    <div class="g-recaptcha" id="ctct_recaptcha_' +
__e( data.form_index ) +
'" data-sitekey="' +
__e( data.recaptchaKey ) +
'" data-size="invisible"></div>\n    ';
 } ;
__p += '\n</div>\n';
return __p
};

SignUpFormWidget["JST"]["dist/templates/es_CO/inline_form.html"] = function(data) {
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
__p += '<div class="ctct-form-container ctct-form-embed form_' +
__e( data.form_index ) +
'">\n    <div class="ctct-form-defaults" data-qe-id="form-background">\n        <div id="success_message_' +
__e( data.form_index ) +
'" class="ctct-form-success" style="display:none;" data-qe-id="success-message">\n            <h2 class="ctct-form-header">Â¡Gracias por suscribirse!</h2>\n            <p class="ctct-form-text">Puede cancelar su suscripciÃ³n en cualquier momento a travÃ©s del enlace Cancelar suscripciÃ³n al final de cada correo electrÃ³nico.</p>\n        </div>\n        <form class="ctct-form-custom" id="ctct_form_' +
__e( data.form_index ) +
'" autocomplete="on" data-qe-id="form-data">\n            ';
 if(!_.isEmpty(data.titleText)) { ;
__p += '\n            <h2 data-qe-id="form-title" class="ctct-form-header">' +
__e( data.titleText ) +
'</h2>\n            ';
 } ;
__p += '\n            ';
 if(!_.isEmpty(data.descriptionText)) { ;
__p += '\n            <p data-qe-id="form-description" class="ctct-form-text">' +
__e( data.descriptionText ) +
'</p>\n            ';
 } ;
__p += '\n\n            <div id="email_address_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-email" id="email_address_label_' +
__e( data.form_index ) +
'" for="email_address_' +
__e( data.form_index ) +
'" class="ctct-form-label ctct-form-required">DirecciÃ³n de correo electrÃ³nico</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-email" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-email" id="email_address_' +
__e( data.form_index ) +
'" type="email" name="email_address" value="" maxlength="80">\n            </div>\n\n            ';
 if(_.contains(data.contact_fields, 'first_name')) { ;
__p += '\n            <div id="first_name_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-first-name" id="first_name_label_' +
__e( data.form_index ) +
'" for="first_name_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Nombre</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-first-name" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-first-name" id="first_name_' +
__e( data.form_index ) +
'" type="text" name="first_name" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'last_name')) { ;
__p += '\n            <div id="last_name_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-last-name" id="last_name_label_' +
__e( data.form_index ) +
'" for="last_name_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Apellido</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-last-name" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-last-name" id="last_name_' +
__e( data.form_index ) +
'" type="text" name="last_name" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'phone')) { ;
__p += '\n            <div id="phone_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-phone" id="phone_label_' +
__e( data.form_index ) +
'" for="phone_' +
__e( data.form_index ) +
'" class="ctct-form-label ">NÃºmero de telÃ©fono</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-phone" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-phone" id="phone_' +
__e( data.form_index ) +
'" type="tel" name="phone" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'country')) { ;
__p += '\n            <div id="country_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-country" id="country_label_' +
__e( data.form_index ) +
'" for="country_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Seleccione un paÃ­s</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-country" style="display: none;"></div>\n                <select class="ctct-select-element" data-qe-id="form-select-country-' +
__e( data.form_index ) +
'" id="country_' +
__e( data.form_index ) +
'" name="country">\n                    <option value="">--</option>\n                    ';
 _.each(data._defaults.countries, function(country) { ;
__p += '\n                        ';
 if (country.countryCode === data.selectedCountry) { ;
__p += '\n                            <option value="' +
__e( country.countryCode ) +
'" selected>' +
__e( country.display ) +
'</option>\n                        ';
 } else { ;
__p += '\n                            <option value="' +
__e( country.countryCode ) +
'">' +
__e( country.display ) +
'</option>\n                        ';
 } ;
__p += '\n                    ';
 }); ;
__p += '\n                </select>\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'street')) { ;
__p += '\n            <div id="street_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-street" id="street_label_' +
__e( data.form_index ) +
'" for="street_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Calle</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-street" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-street" id="street_' +
__e( data.form_index ) +
'" type="text" name="street" value="" maxlength="255">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'city')) { ;
__p += '\n            <div id="city_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-city" id="city_label_' +
__e( data.form_index ) +
'" for="city_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Ciudad</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-city" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-city" id="city_' +
__e( data.form_index ) +
'" type="text" name="city" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'state')) { ;
__p += '\n            <div id="state_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-state" id="state_label_' +
__e( data.form_index ) +
'" for="state_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Seleccione un estado/una provincia</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-state" style="display: none;"></div>\n                <input data-qe-id="form-input-state" class="state_' +
__e( data.form_index ) +
' ctct-form-element" id="state_' +
__e( data.form_index ) +
'" type="text" name="state" value="" maxlength="50">\n                <select data-qe-id="form-select-state-' +
__e( data.form_index ) +
'" class="state_' +
__e( data.form_index ) +
' ctct-select-element" id="state_' +
__e( data.form_index ) +
'" style="display: none;" name="state">\n                </select>\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'postal_code')) { ;
__p += '\n            <div id="postal_code_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-postal-code" id="postal_code_label_' +
__e( data.form_index ) +
'" for="postal_code_' +
__e( data.form_index ) +
'" class="ctct-form-label ">CÃ³digo postal</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-postal-code" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-postal-code" id="postal_code_' +
__e( data.form_index ) +
'" type="text" name="postal_code" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'company')) { ;
__p += '\n            <div id="company_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-company" id="company_label_' +
__e( data.form_index ) +
'" for="company_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Empresa</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-company" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-company" id="company_' +
__e( data.form_index ) +
'" type="text" name="company" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'job_title')) { ;
__p += '\n            <div id="job_title_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-title" id="job_title_label_' +
__e( data.form_index ) +
'" for="job_title_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Puesto</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-job-title" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-title" id="job_title_' +
__e( data.form_index ) +
'" type="text" name="job_title" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'birthday')) { ;
__p += '\n            <div id="birthday_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-birthday" id="birthday_label_' +
__e( data.form_index ) +
'" for="birthday_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">CumpleaÃ±os</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-birthday" style="display: none;"></div>\n                <input data-qe-id="form-input-birthday-month" id="birthday_month_' +
__e( data.form_index ) +
'" type="number" name="birthday_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" min="1" max="12" maxlength="2" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('birthday_aria_label_month') ) +
'"> / <input data-qe-id="form-input-birthday-day" id="birthday_day_' +
__e( data.form_index ) +
'" type="number" name="birthday_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('birthday_aria_label_day') ) +
'">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'anniversary')) { ;
__p += '\n            <div id="anniversary_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-anniversary" id="anniversary_label_' +
__e( data.form_index ) +
'" for="anniversary_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Aniversario</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-anniversary" style="display: none;"></div>\n                <input data-qe-id="form-input-anniversary-month" id="anniversary_month_' +
__e( data.form_index ) +
'" type="number" name="anniversary_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="12" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_month') ) +
'"> / <input data-qe-id="form-input-anniversary-day" id="anniversary_day_' +
__e( data.form_index ) +
'" type="number" name="anniversary_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_day') ) +
'"> / <input data-qe-id="form-input-anniversary-year" id="anniversary_year_' +
__e( data.form_index ) +
'" type="number" name="anniversary_year" value="" placeholder="YYYY" class="ctct-form-element ctct-form-date-field-4" maxlength="4" min="1900" max="' +
__e( data.max_anniversary_year ) +
'" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_year') ) +
'">\n            </div>\n            ';
 } ;
__p += '\n\n        ';
 _.each(data._customFields, function(customField) { ;
__p += '\n            ';
 if(customField.type === 'custom_field_string') { ;
__p += '\n            <div id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_label_' +
__e( data.form_index ) +
'" for="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_' +
__e( data.form_index ) +
'" class="ctct-form-label ctct-form-label ">' +
__e( customField.label ) +
'</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-custom-field-' +
__e( customField.label ) +
'" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_' +
__e( data.form_index ) +
'" type="text" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'" value="" maxlength="255">\n            </div>\n            ';
 } ;
__p += '\n            ';
 if(customField.type === 'custom_field_date') { ;
__p += '\n            <div id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_label_' +
__e( data.form_index ) +
'" for="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">' +
__e( customField.label ) +
'</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-custom-field-' +
__e( customField.label ) +
'" style="display: none;"></div>\n                <input data-qe-id="form-input-custom-field-month-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="12" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_month') ) +
'"> / <input data-qe-id="form-input-custom-field-day-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_day_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_day') ) +
'"> / <input data-qe-id="form-input-custom-field-year-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_year_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_year" value="" placeholder="YYYY" class="ctct-form-element ctct-form-date-field-4" maxlength="4" min="1900" max="9999" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_year') ) +
'">\n            </div>\n            ';
 } ;
__p += '\n        ';
 }); ;
__p += '\n\n            ';
 if (data.list_ids.length > 1) { ;
__p += '\n            <fieldset id="list_memberships_field_' +
__e( data.form_index ) +
'" class="ctct-form-lists">\n                <legend id="list_memberships_label_' +
__e( data.form_index ) +
'" class="ctct-form-required ctct-form-lists-legend">Listas de correo electrÃ³nico</legend>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-list_memberships" style="display: none;"></div>\n                ';
 _.each(data._emailLists, function(emailList, index) { ;
__p += '\n                    <div class="ctct-form-listitem">\n                        <input class="ctct-form-checkbox" data-qe-id="form-input-list-' +
__e( emailList.label ) +
'" id="email_list_' +
__e( index ) +
'_' +
__e( data.form_index ) +
'" type="checkbox" name="emailList" value="' +
__e( emailList.id ) +
'">\n                        <label data-qe-id="form-label-list-' +
__e( emailList.label ) +
'" for="email_list_' +
__e( index ) +
'_' +
__e( data.form_index ) +
'" class="ctct-form-listname ctct-form-checkbox-label">' +
__e( emailList.label ) +
'</label>\n                    </div>\n                ';
 }); ;
__p += '\n            </fieldset>\n            ';
 } ;
__p += '\n\n            <div id="error_message_' +
__e( data.form_index ) +
'" class="ctct-form-error" style="display:none;">\n                <p class="ctct-form-errorMessage">Lo sentimos, no hemos podido completar su inscripciÃ³n. ComunÃ­quese con nosotros para solucionarlo.</p>\n            </div>\n            <div id="network_error_message_' +
__e( data.form_index ) +
'" class="ctct-form-error" style="display:none;">\n                <p class="ctct-form-errorMessage">Operation timed out, please try again.</p>\n            </div>\n\n\n            <button data-qe-id="form-button" type="button" class="ctct-form-button">' +
__e( data.buttonText ) +
'</button>\n\n            ';
 if (data.recaptchaKey) { ;
__p += '\n            <div class="g-recaptcha" id="ctct_recaptcha_' +
__e( data.form_index ) +
'" data-sitekey="' +
__e( data.recaptchaKey ) +
'" data-size="invisible">\n            </div>\n            ';
 } ;
__p += '\n        </form>\n        <p class="ctct-form-footer">\n            ';
 if (!data.hideBranding) { ;
__p += '\n            <span data-qe-id="form-branding">\n                 <a href="http://www.constantcontact.com/index.jsp?cc=forms_inline" rel="nofollow" target="_blank" class="ctct-form-footer-link">Constant Contact</a> |\n            </span>\n            ';
 } ;
__p += '\n            <a href="' +
__e( data._defaults.privacyUrl ) +
'" target="_blank" data-qe-id="form-privacy-link" class="ctct-form-footer-link">Privacy</a>\n        </p>\n    </div>\n</div>\n';
return __p
};

SignUpFormWidget["JST"]["dist/templates/es_CO/popup_form.html"] = function(data) {
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
__p += '<div class="ctct-form-defaults" data-qe-id="form-background">\n    <div id="success_message_' +
__e( data.form_index ) +
'" class="ctct-form-success" style="display:none;" data-qe-id="success-message">\n        <h2 class="ctct-form-header">Â¡Gracias por suscribirse!</h2>\n        <p class="ctct-form-text">Puede cancelar su suscripciÃ³n en cualquier momento a travÃ©s del enlace Cancelar suscripciÃ³n al final de cada correo electrÃ³nico.</p>\n    </div>\n    <form class="ctct-form-custom" id="ctct_form_' +
__e( data.form_index ) +
'" autocomplete="on" data-qe-id="form-data">\n        ';
 if(!_.isEmpty(data.titleText)) { ;
__p += '\n        <h2 data-qe-id="form-title" class="ctct-form-header">' +
__e( data.titleText ) +
'</h2>\n        ';
 } ;
__p += '\n        ';
 if(!_.isEmpty(data.descriptionText)) { ;
__p += '\n        <p data-qe-id="form-description" class="ctct-form-text">' +
__e( data.descriptionText ) +
'</p>\n        ';
 } ;
__p += '\n\n        <div id="email_address_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-email" id="email_address_label_' +
__e( data.form_index ) +
'" for="email_address_' +
__e( data.form_index ) +
'" class="ctct-form-label ctct-form-required">DirecciÃ³n de correo electrÃ³nico</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-email" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-email" id="email_address_' +
__e( data.form_index ) +
'" type="email" name="email_address" value="" maxlength="80">\n        </div>\n\n        ';
 if(_.contains(data.contact_fields, 'first_name')) { ;
__p += '\n        <div id="first_name_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-first-name" id="first_name_label_' +
__e( data.form_index ) +
'" for="first_name_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Nombre</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-first-name" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-first-name" id="first_name_' +
__e( data.form_index ) +
'" type="text" name="first_name" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'last_name')) { ;
__p += '\n        <div id="last_name_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-last-name" id="last_name_label_' +
__e( data.form_index ) +
'" for="last_name_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Apellido</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-last-name" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-last-name" id="last_name_' +
__e( data.form_index ) +
'" type="text" name="last_name" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'phone')) { ;
__p += '\n        <div id="phone_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-phone" id="phone_label_' +
__e( data.form_index ) +
'" for="phone_' +
__e( data.form_index ) +
'" class="ctct-form-label ">NÃºmero de telÃ©fono</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-phone" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-phone" id="phone_' +
__e( data.form_index ) +
'" type="tel" name="phone" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'country')) { ;
__p += '\n        <div id="country_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-country" id="country_label_' +
__e( data.form_index ) +
'" for="country_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Seleccione un paÃ­s</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-country" style="display: none;"></div>\n            <select class="ctct-select-element" data-qe-id="form-select-country-' +
__e( data.form_index ) +
'" id="country_' +
__e( data.form_index ) +
'" name="country">\n                <option value="">--</option>\n                ';
 _.each(data._defaults.countries, function(country) { ;
__p += '\n                    ';
 if (country.countryCode === data.selectedCountry) { ;
__p += '\n                        <option value="' +
__e( country.countryCode ) +
'" selected>' +
__e( country.display ) +
'</option>\n                    ';
 } else { ;
__p += '\n                        <option value="' +
__e( country.countryCode ) +
'">' +
__e( country.display ) +
'</option>\n                    ';
 } ;
__p += '\n                ';
 }); ;
__p += '\n            </select>\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'street')) { ;
__p += '\n        <div id="street_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-street" id="street_label_' +
__e( data.form_index ) +
'" for="street_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Calle</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-street" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-street" id="street_' +
__e( data.form_index ) +
'" type="text" name="street" value="" maxlength="255">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'city')) { ;
__p += '\n        <div id="city_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-city" id="city_label_' +
__e( data.form_index ) +
'" for="city_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Ciudad</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-city" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-city" id="city_' +
__e( data.form_index ) +
'" type="text" name="city" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'state')) { ;
__p += '\n        <div id="state_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-state" id="state_label_' +
__e( data.form_index ) +
'" for="state_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Seleccione un estado/una provincia</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-state" style="display: none;"></div>\n            <input data-qe-id="form-input-state" class="state_' +
__e( data.form_index ) +
' ctct-form-element" id="state_' +
__e( data.form_index ) +
'" type="text" name="state" value="" maxlength="50">\n            <select data-qe-id="form-select-state-' +
__e( data.form_index ) +
'" class="state_' +
__e( data.form_index ) +
' ctct-select-element" id="state_' +
__e( data.form_index ) +
'" style="display: none;" name="state">\n            </select>\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'postal_code')) { ;
__p += '\n        <div id="postal_code_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-postal-code" id="postal_code_label_' +
__e( data.form_index ) +
'" for="postal_code_' +
__e( data.form_index ) +
'" class="ctct-form-label ">CÃ³digo postal</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-postal-code" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-postal-code" id="postal_code_' +
__e( data.form_index ) +
'" type="text" name="postal_code" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'company')) { ;
__p += '\n        <div id="company_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-company" id="company_label_' +
__e( data.form_index ) +
'" for="company_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Empresa</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-company" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-company" id="company_' +
__e( data.form_index ) +
'" type="text" name="company" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'job_title')) { ;
__p += '\n        <div id="job_title_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-title" id="job_title_label_' +
__e( data.form_index ) +
'" for="job_title_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Puesto</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-job-title" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-title" id="job_title_' +
__e( data.form_index ) +
'" type="text" name="job_title" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'birthday')) { ;
__p += '\n        <div id="birthday_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-birthday" id="birthday_label_' +
__e( data.form_index ) +
'" for="birthday_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">CumpleaÃ±os</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-birthday" style="display: none;"></div>\n            <input data-qe-id="form-input-birthday-month" id="birthday_month_' +
__e( data.form_index ) +
'" type="number" name="birthday_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" min="1" max="12" maxlength="2" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('birthday_aria_label_month') ) +
'"> / <input data-qe-id="form-input-birthday-day" id="birthday_day_' +
__e( data.form_index ) +
'" type="number" name="birthday_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('birthday_aria_label_day') ) +
'">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'anniversary')) { ;
__p += '\n        <div id="anniversary_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-anniversary" id="anniversary_label_' +
__e( data.form_index ) +
'" for="anniversary_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Aniversario</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-anniversary" style="display: none;"></div>\n            <input data-qe-id="form-input-anniversary-month" id="anniversary_month_' +
__e( data.form_index ) +
'" type="number" name="anniversary_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="12" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_month') ) +
'"> / <input data-qe-id="form-input-anniversary-day" id="anniversary_day_' +
__e( data.form_index ) +
'" type="number" name="anniversary_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_day') ) +
'"> / <input data-qe-id="form-input-anniversary-year" id="anniversary_year_' +
__e( data.form_index ) +
'" type="number" name="anniversary_year" value="" placeholder="YYYY" class="ctct-form-element ctct-form-date-field-4" maxlength="4" min="1900" max="' +
__e( data.max_anniversary_year ) +
'" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_year') ) +
'">\n        </div>\n        ';
 } ;
__p += '\n\n    ';
 _.each(data._customFields, function(customField) { ;
__p += '\n        ';
 if(customField.type === 'custom_field_string') { ;
__p += '\n        <div id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_label_' +
__e( data.form_index ) +
'" for="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_' +
__e( data.form_index ) +
'" class="ctct-form-label ctct-form-label ">' +
__e( customField.label ) +
'</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-custom-field-' +
__e( customField.label ) +
'" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_' +
__e( data.form_index ) +
'" type="text" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'" value="" maxlength="255">\n        </div>\n        ';
 } ;
__p += '\n        ';
 if(customField.type === 'custom_field_date') { ;
__p += '\n        <div id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_label_' +
__e( data.form_index ) +
'" for="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">' +
__e( customField.label ) +
'</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-custom-field-' +
__e( customField.label ) +
'" style="display: none;"></div>\n            <input data-qe-id="form-input-custom-field-month-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="12" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_month') ) +
'"> / <input data-qe-id="form-input-custom-field-day-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_day_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_day') ) +
'"> / <input data-qe-id="form-input-custom-field-year-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_year_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_year" value="" placeholder="YYYY" class="ctct-form-element ctct-form-date-field-4" maxlength="4" min="1900" max="9999" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_year') ) +
'">\n        </div>\n        ';
 } ;
__p += '\n    ';
 }); ;
__p += '\n\n        ';
 if (data.list_ids.length > 1) { ;
__p += '\n        <fieldset id="list_memberships_field_' +
__e( data.form_index ) +
'" class="ctct-form-lists">\n            <legend id="list_memberships_label_' +
__e( data.form_index ) +
'" class="ctct-form-required ctct-form-lists-legend">Listas de correo electrÃ³nico</legend>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-list_memberships" style="display: none;"></div>\n            ';
 _.each(data._emailLists, function(emailList, index) { ;
__p += '\n                <div class="ctct-form-listitem">\n                    <input class="ctct-form-checkbox" data-qe-id="form-input-list-' +
__e( emailList.label ) +
'" id="email_list_' +
__e( index ) +
'_' +
__e( data.form_index ) +
'" type="checkbox" name="emailList" value="' +
__e( emailList.id ) +
'">\n                    <label data-qe-id="form-label-list-' +
__e( emailList.label ) +
'" for="email_list_' +
__e( index ) +
'_' +
__e( data.form_index ) +
'" class="ctct-form-listname ctct-form-checkbox-label">' +
__e( emailList.label ) +
'</label>\n                </div>\n            ';
 }); ;
__p += '\n        </fieldset>\n        ';
 } ;
__p += '\n\n        <div id="error_message_' +
__e( data.form_index ) +
'" class="ctct-form-error" style="display:none;">\n            <p class="ctct-form-errorMessage">Lo sentimos, no hemos podido completar su inscripciÃ³n. ComunÃ­quese con nosotros para solucionarlo.</p>\n        </div>\n        <div id="network_error_message_' +
__e( data.form_index ) +
'" class="ctct-form-error" style="display:none;">\n            <p class="ctct-form-errorMessage">Operation timed out, please try again.</p>\n        </div>\n\n\n        <button data-qe-id="form-button" type="button" class="ctct-form-button">' +
__e( data.buttonText ) +
'</button>\n    </form>\n    <p class="ctct-form-footer">\n        ';
 if(!data.hideBranding) { ;
__p += '\n        <span data-qe-id="form-branding">\n             <a href="http://www.constantcontact.com/index.jsp?cc=forms_popup" rel="nofollow" target="_blank" class="ctct-form-footer-link">Constant Contact</a> |\n        </span>\n        ';
 } ;
__p += '\n        <a href="' +
__e( data._defaults.privacyUrl ) +
'" target="_blank" data-qe-id="form-privacy-link" class="ctct-form-footer-link">Privacy</a>\n    </p>\n</div>\n\n';
return __p
};

SignUpFormWidget["JST"]["dist/templates/es_CO/popup_wrapper.html"] = function(data) {
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
__p += '<div class="ctct-popup-wrapper form_' +
__e( data.form_index ) +
'">\n    <div class="ctct-popup-overlay"></div>\n    <div class="ctct-popup-inner">\n      <div class="ctct-popup-content">\n        <button type="button" class="ctct-popup-close js-popup-close" title="Close">\n            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" class="undefined">\n                <polygon points="14 11 11 14 8 11 5 14 2 11 5 8 2 5 5 2 8 5 11 2 14 5 11 8 " class="undefined"/>\n            </svg>\n        </button>\n        <div class="ctct-form-container ctct-form-popup form_' +
__e( data.form_index ) +
'"></div>\n      </div>\n    </div>\n\n    ';
 if (data.recaptchaKey) { ;
__p += '\n    <div class="g-recaptcha" id="ctct_recaptcha_' +
__e( data.form_index ) +
'" data-sitekey="' +
__e( data.recaptchaKey ) +
'" data-size="invisible"></div>\n    ';
 } ;
__p += '\n</div>\n';
return __p
};

SignUpFormWidget["JST"]["dist/templates/fr/inline_form.html"] = function(data) {
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
__p += '<div class="ctct-form-container ctct-form-embed form_' +
__e( data.form_index ) +
'">\n    <div class="ctct-form-defaults" data-qe-id="form-background">\n        <div id="success_message_' +
__e( data.form_index ) +
'" class="ctct-form-success" style="display:none;" data-qe-id="success-message">\n            <h2 class="ctct-form-header">Merci pour votre inscription !</h2>\n            <p class="ctct-form-text">Vous pouvez vous dÃ©sabonner Ã  tout moment en utilisant le lien RÃ©silier lâ€™abonnement au bas de chaque courrier Ã©lectronique.</p>\n        </div>\n        <form class="ctct-form-custom" id="ctct_form_' +
__e( data.form_index ) +
'" autocomplete="on" data-qe-id="form-data">\n            ';
 if(!_.isEmpty(data.titleText)) { ;
__p += '\n            <h2 data-qe-id="form-title" class="ctct-form-header">' +
__e( data.titleText ) +
'</h2>\n            ';
 } ;
__p += '\n            ';
 if(!_.isEmpty(data.descriptionText)) { ;
__p += '\n            <p data-qe-id="form-description" class="ctct-form-text">' +
__e( data.descriptionText ) +
'</p>\n            ';
 } ;
__p += '\n\n            <div id="email_address_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-email" id="email_address_label_' +
__e( data.form_index ) +
'" for="email_address_' +
__e( data.form_index ) +
'" class="ctct-form-label ctct-form-required">Adresse e-mail</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-email" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-email" id="email_address_' +
__e( data.form_index ) +
'" type="email" name="email_address" value="" maxlength="80">\n            </div>\n\n            ';
 if(_.contains(data.contact_fields, 'first_name')) { ;
__p += '\n            <div id="first_name_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-first-name" id="first_name_label_' +
__e( data.form_index ) +
'" for="first_name_' +
__e( data.form_index ) +
'" class="ctct-form-label ">PrÃ©nom</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-first-name" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-first-name" id="first_name_' +
__e( data.form_index ) +
'" type="text" name="first_name" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'last_name')) { ;
__p += '\n            <div id="last_name_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-last-name" id="last_name_label_' +
__e( data.form_index ) +
'" for="last_name_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Nom de famille</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-last-name" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-last-name" id="last_name_' +
__e( data.form_index ) +
'" type="text" name="last_name" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'phone')) { ;
__p += '\n            <div id="phone_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-phone" id="phone_label_' +
__e( data.form_index ) +
'" for="phone_' +
__e( data.form_index ) +
'" class="ctct-form-label ">NumÃ©ro de tÃ©lÃ©phone</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-phone" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-phone" id="phone_' +
__e( data.form_index ) +
'" type="tel" name="phone" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'country')) { ;
__p += '\n            <div id="country_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-country" id="country_label_' +
__e( data.form_index ) +
'" for="country_' +
__e( data.form_index ) +
'" class="ctct-form-label ">SÃ©lectionnez un pays</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-country" style="display: none;"></div>\n                <select class="ctct-select-element" data-qe-id="form-select-country-' +
__e( data.form_index ) +
'" id="country_' +
__e( data.form_index ) +
'" name="country">\n                    <option value="">--</option>\n                    ';
 _.each(data._defaults.countries, function(country) { ;
__p += '\n                        ';
 if (country.countryCode === data.selectedCountry) { ;
__p += '\n                            <option value="' +
__e( country.countryCode ) +
'" selected>' +
__e( country.display ) +
'</option>\n                        ';
 } else { ;
__p += '\n                            <option value="' +
__e( country.countryCode ) +
'">' +
__e( country.display ) +
'</option>\n                        ';
 } ;
__p += '\n                    ';
 }); ;
__p += '\n                </select>\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'street')) { ;
__p += '\n            <div id="street_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-street" id="street_label_' +
__e( data.form_index ) +
'" for="street_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Rue</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-street" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-street" id="street_' +
__e( data.form_index ) +
'" type="text" name="street" value="" maxlength="255">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'city')) { ;
__p += '\n            <div id="city_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-city" id="city_label_' +
__e( data.form_index ) +
'" for="city_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Ville</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-city" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-city" id="city_' +
__e( data.form_index ) +
'" type="text" name="city" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'state')) { ;
__p += '\n            <div id="state_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-state" id="state_label_' +
__e( data.form_index ) +
'" for="state_' +
__e( data.form_index ) +
'" class="ctct-form-label ">SÃ©lectionnez un Ã©tat/une province</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-state" style="display: none;"></div>\n                <input data-qe-id="form-input-state" class="state_' +
__e( data.form_index ) +
' ctct-form-element" id="state_' +
__e( data.form_index ) +
'" type="text" name="state" value="" maxlength="50">\n                <select data-qe-id="form-select-state-' +
__e( data.form_index ) +
'" class="state_' +
__e( data.form_index ) +
' ctct-select-element" id="state_' +
__e( data.form_index ) +
'" style="display: none;" name="state">\n                </select>\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'postal_code')) { ;
__p += '\n            <div id="postal_code_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-postal-code" id="postal_code_label_' +
__e( data.form_index ) +
'" for="postal_code_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Code postal</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-postal-code" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-postal-code" id="postal_code_' +
__e( data.form_index ) +
'" type="text" name="postal_code" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'company')) { ;
__p += '\n            <div id="company_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-company" id="company_label_' +
__e( data.form_index ) +
'" for="company_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Entreprise</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-company" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-company" id="company_' +
__e( data.form_index ) +
'" type="text" name="company" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'job_title')) { ;
__p += '\n            <div id="job_title_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-title" id="job_title_label_' +
__e( data.form_index ) +
'" for="job_title_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Titre du poste</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-job-title" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-title" id="job_title_' +
__e( data.form_index ) +
'" type="text" name="job_title" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'birthday')) { ;
__p += '\n            <div id="birthday_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-birthday" id="birthday_label_' +
__e( data.form_index ) +
'" for="birthday_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Anniversaire</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-birthday" style="display: none;"></div>\n                <input data-qe-id="form-input-birthday-month" id="birthday_month_' +
__e( data.form_index ) +
'" type="number" name="birthday_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" min="1" max="12" maxlength="2" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('birthday_aria_label_month') ) +
'"> / <input data-qe-id="form-input-birthday-day" id="birthday_day_' +
__e( data.form_index ) +
'" type="number" name="birthday_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('birthday_aria_label_day') ) +
'">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'anniversary')) { ;
__p += '\n            <div id="anniversary_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-anniversary" id="anniversary_label_' +
__e( data.form_index ) +
'" for="anniversary_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Anniversaire</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-anniversary" style="display: none;"></div>\n                <input data-qe-id="form-input-anniversary-month" id="anniversary_month_' +
__e( data.form_index ) +
'" type="number" name="anniversary_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="12" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_month') ) +
'"> / <input data-qe-id="form-input-anniversary-day" id="anniversary_day_' +
__e( data.form_index ) +
'" type="number" name="anniversary_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_day') ) +
'"> / <input data-qe-id="form-input-anniversary-year" id="anniversary_year_' +
__e( data.form_index ) +
'" type="number" name="anniversary_year" value="" placeholder="YYYY" class="ctct-form-element ctct-form-date-field-4" maxlength="4" min="1900" max="' +
__e( data.max_anniversary_year ) +
'" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_year') ) +
'">\n            </div>\n            ';
 } ;
__p += '\n\n        ';
 _.each(data._customFields, function(customField) { ;
__p += '\n            ';
 if(customField.type === 'custom_field_string') { ;
__p += '\n            <div id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_label_' +
__e( data.form_index ) +
'" for="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_' +
__e( data.form_index ) +
'" class="ctct-form-label ctct-form-label ">' +
__e( customField.label ) +
'</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-custom-field-' +
__e( customField.label ) +
'" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_' +
__e( data.form_index ) +
'" type="text" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'" value="" maxlength="255">\n            </div>\n            ';
 } ;
__p += '\n            ';
 if(customField.type === 'custom_field_date') { ;
__p += '\n            <div id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_label_' +
__e( data.form_index ) +
'" for="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">' +
__e( customField.label ) +
'</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-custom-field-' +
__e( customField.label ) +
'" style="display: none;"></div>\n                <input data-qe-id="form-input-custom-field-month-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="12" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_month') ) +
'"> / <input data-qe-id="form-input-custom-field-day-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_day_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_day') ) +
'"> / <input data-qe-id="form-input-custom-field-year-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_year_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_year" value="" placeholder="YYYY" class="ctct-form-element ctct-form-date-field-4" maxlength="4" min="1900" max="9999" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_year') ) +
'">\n            </div>\n            ';
 } ;
__p += '\n        ';
 }); ;
__p += '\n\n            ';
 if (data.list_ids.length > 1) { ;
__p += '\n            <fieldset id="list_memberships_field_' +
__e( data.form_index ) +
'" class="ctct-form-lists">\n                <legend id="list_memberships_label_' +
__e( data.form_index ) +
'" class="ctct-form-required ctct-form-lists-legend">Listes Ã©lectroniques</legend>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-list_memberships" style="display: none;"></div>\n                ';
 _.each(data._emailLists, function(emailList, index) { ;
__p += '\n                    <div class="ctct-form-listitem">\n                        <input class="ctct-form-checkbox" data-qe-id="form-input-list-' +
__e( emailList.label ) +
'" id="email_list_' +
__e( index ) +
'_' +
__e( data.form_index ) +
'" type="checkbox" name="emailList" value="' +
__e( emailList.id ) +
'">\n                        <label data-qe-id="form-label-list-' +
__e( emailList.label ) +
'" for="email_list_' +
__e( index ) +
'_' +
__e( data.form_index ) +
'" class="ctct-form-listname ctct-form-checkbox-label">' +
__e( emailList.label ) +
'</label>\n                    </div>\n                ';
 }); ;
__p += '\n            </fieldset>\n            ';
 } ;
__p += '\n\n            <div id="error_message_' +
__e( data.form_index ) +
'" class="ctct-form-error" style="display:none;">\n                <p class="ctct-form-errorMessage">DÃ©solÃ©, nous n&#39;avons pas pu complÃ©ter votre inscription. Veuillez nous contacter pour rÃ©soudre ce problÃ¨me.</p>\n            </div>\n            <div id="network_error_message_' +
__e( data.form_index ) +
'" class="ctct-form-error" style="display:none;">\n                <p class="ctct-form-errorMessage">Operation timed out, please try again.</p>\n            </div>\n\n\n            <button data-qe-id="form-button" type="button" class="ctct-form-button">' +
__e( data.buttonText ) +
'</button>\n\n            ';
 if (data.recaptchaKey) { ;
__p += '\n            <div class="g-recaptcha" id="ctct_recaptcha_' +
__e( data.form_index ) +
'" data-sitekey="' +
__e( data.recaptchaKey ) +
'" data-size="invisible">\n            </div>\n            ';
 } ;
__p += '\n        </form>\n        <p class="ctct-form-footer">\n            ';
 if (!data.hideBranding) { ;
__p += '\n            <span data-qe-id="form-branding">\n                 <a href="http://www.constantcontact.com/index.jsp?cc=forms_inline" rel="nofollow" target="_blank" class="ctct-form-footer-link">Constant Contact</a> |\n            </span>\n            ';
 } ;
__p += '\n            <a href="' +
__e( data._defaults.privacyUrl ) +
'" target="_blank" data-qe-id="form-privacy-link" class="ctct-form-footer-link">Vie privÃ©e</a>\n        </p>\n    </div>\n</div>\n';
return __p
};

SignUpFormWidget["JST"]["dist/templates/fr/popup_form.html"] = function(data) {
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
__p += '<div class="ctct-form-defaults" data-qe-id="form-background">\n    <div id="success_message_' +
__e( data.form_index ) +
'" class="ctct-form-success" style="display:none;" data-qe-id="success-message">\n        <h2 class="ctct-form-header">Merci pour votre inscription !</h2>\n        <p class="ctct-form-text">Vous pouvez vous dÃ©sabonner Ã  tout moment en utilisant le lien RÃ©silier lâ€™abonnement au bas de chaque courrier Ã©lectronique.</p>\n    </div>\n    <form class="ctct-form-custom" id="ctct_form_' +
__e( data.form_index ) +
'" autocomplete="on" data-qe-id="form-data">\n        ';
 if(!_.isEmpty(data.titleText)) { ;
__p += '\n        <h2 data-qe-id="form-title" class="ctct-form-header">' +
__e( data.titleText ) +
'</h2>\n        ';
 } ;
__p += '\n        ';
 if(!_.isEmpty(data.descriptionText)) { ;
__p += '\n        <p data-qe-id="form-description" class="ctct-form-text">' +
__e( data.descriptionText ) +
'</p>\n        ';
 } ;
__p += '\n\n        <div id="email_address_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-email" id="email_address_label_' +
__e( data.form_index ) +
'" for="email_address_' +
__e( data.form_index ) +
'" class="ctct-form-label ctct-form-required">Adresse e-mail</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-email" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-email" id="email_address_' +
__e( data.form_index ) +
'" type="email" name="email_address" value="" maxlength="80">\n        </div>\n\n        ';
 if(_.contains(data.contact_fields, 'first_name')) { ;
__p += '\n        <div id="first_name_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-first-name" id="first_name_label_' +
__e( data.form_index ) +
'" for="first_name_' +
__e( data.form_index ) +
'" class="ctct-form-label ">PrÃ©nom</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-first-name" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-first-name" id="first_name_' +
__e( data.form_index ) +
'" type="text" name="first_name" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'last_name')) { ;
__p += '\n        <div id="last_name_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-last-name" id="last_name_label_' +
__e( data.form_index ) +
'" for="last_name_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Nom de famille</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-last-name" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-last-name" id="last_name_' +
__e( data.form_index ) +
'" type="text" name="last_name" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'phone')) { ;
__p += '\n        <div id="phone_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-phone" id="phone_label_' +
__e( data.form_index ) +
'" for="phone_' +
__e( data.form_index ) +
'" class="ctct-form-label ">NumÃ©ro de tÃ©lÃ©phone</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-phone" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-phone" id="phone_' +
__e( data.form_index ) +
'" type="tel" name="phone" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'country')) { ;
__p += '\n        <div id="country_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-country" id="country_label_' +
__e( data.form_index ) +
'" for="country_' +
__e( data.form_index ) +
'" class="ctct-form-label ">SÃ©lectionnez un pays</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-country" style="display: none;"></div>\n            <select class="ctct-select-element" data-qe-id="form-select-country-' +
__e( data.form_index ) +
'" id="country_' +
__e( data.form_index ) +
'" name="country">\n                <option value="">--</option>\n                ';
 _.each(data._defaults.countries, function(country) { ;
__p += '\n                    ';
 if (country.countryCode === data.selectedCountry) { ;
__p += '\n                        <option value="' +
__e( country.countryCode ) +
'" selected>' +
__e( country.display ) +
'</option>\n                    ';
 } else { ;
__p += '\n                        <option value="' +
__e( country.countryCode ) +
'">' +
__e( country.display ) +
'</option>\n                    ';
 } ;
__p += '\n                ';
 }); ;
__p += '\n            </select>\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'street')) { ;
__p += '\n        <div id="street_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-street" id="street_label_' +
__e( data.form_index ) +
'" for="street_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Rue</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-street" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-street" id="street_' +
__e( data.form_index ) +
'" type="text" name="street" value="" maxlength="255">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'city')) { ;
__p += '\n        <div id="city_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-city" id="city_label_' +
__e( data.form_index ) +
'" for="city_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Ville</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-city" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-city" id="city_' +
__e( data.form_index ) +
'" type="text" name="city" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'state')) { ;
__p += '\n        <div id="state_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-state" id="state_label_' +
__e( data.form_index ) +
'" for="state_' +
__e( data.form_index ) +
'" class="ctct-form-label ">SÃ©lectionnez un Ã©tat/une province</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-state" style="display: none;"></div>\n            <input data-qe-id="form-input-state" class="state_' +
__e( data.form_index ) +
' ctct-form-element" id="state_' +
__e( data.form_index ) +
'" type="text" name="state" value="" maxlength="50">\n            <select data-qe-id="form-select-state-' +
__e( data.form_index ) +
'" class="state_' +
__e( data.form_index ) +
' ctct-select-element" id="state_' +
__e( data.form_index ) +
'" style="display: none;" name="state">\n            </select>\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'postal_code')) { ;
__p += '\n        <div id="postal_code_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-postal-code" id="postal_code_label_' +
__e( data.form_index ) +
'" for="postal_code_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Code postal</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-postal-code" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-postal-code" id="postal_code_' +
__e( data.form_index ) +
'" type="text" name="postal_code" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'company')) { ;
__p += '\n        <div id="company_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-company" id="company_label_' +
__e( data.form_index ) +
'" for="company_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Entreprise</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-company" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-company" id="company_' +
__e( data.form_index ) +
'" type="text" name="company" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'job_title')) { ;
__p += '\n        <div id="job_title_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-title" id="job_title_label_' +
__e( data.form_index ) +
'" for="job_title_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Titre du poste</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-job-title" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-title" id="job_title_' +
__e( data.form_index ) +
'" type="text" name="job_title" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'birthday')) { ;
__p += '\n        <div id="birthday_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-birthday" id="birthday_label_' +
__e( data.form_index ) +
'" for="birthday_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Anniversaire</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-birthday" style="display: none;"></div>\n            <input data-qe-id="form-input-birthday-month" id="birthday_month_' +
__e( data.form_index ) +
'" type="number" name="birthday_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" min="1" max="12" maxlength="2" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('birthday_aria_label_month') ) +
'"> / <input data-qe-id="form-input-birthday-day" id="birthday_day_' +
__e( data.form_index ) +
'" type="number" name="birthday_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('birthday_aria_label_day') ) +
'">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'anniversary')) { ;
__p += '\n        <div id="anniversary_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-anniversary" id="anniversary_label_' +
__e( data.form_index ) +
'" for="anniversary_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Anniversaire</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-anniversary" style="display: none;"></div>\n            <input data-qe-id="form-input-anniversary-month" id="anniversary_month_' +
__e( data.form_index ) +
'" type="number" name="anniversary_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="12" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_month') ) +
'"> / <input data-qe-id="form-input-anniversary-day" id="anniversary_day_' +
__e( data.form_index ) +
'" type="number" name="anniversary_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_day') ) +
'"> / <input data-qe-id="form-input-anniversary-year" id="anniversary_year_' +
__e( data.form_index ) +
'" type="number" name="anniversary_year" value="" placeholder="YYYY" class="ctct-form-element ctct-form-date-field-4" maxlength="4" min="1900" max="' +
__e( data.max_anniversary_year ) +
'" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_year') ) +
'">\n        </div>\n        ';
 } ;
__p += '\n\n    ';
 _.each(data._customFields, function(customField) { ;
__p += '\n        ';
 if(customField.type === 'custom_field_string') { ;
__p += '\n        <div id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_label_' +
__e( data.form_index ) +
'" for="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_' +
__e( data.form_index ) +
'" class="ctct-form-label ctct-form-label ">' +
__e( customField.label ) +
'</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-custom-field-' +
__e( customField.label ) +
'" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_' +
__e( data.form_index ) +
'" type="text" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'" value="" maxlength="255">\n        </div>\n        ';
 } ;
__p += '\n        ';
 if(customField.type === 'custom_field_date') { ;
__p += '\n        <div id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_label_' +
__e( data.form_index ) +
'" for="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">' +
__e( customField.label ) +
'</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-custom-field-' +
__e( customField.label ) +
'" style="display: none;"></div>\n            <input data-qe-id="form-input-custom-field-month-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="12" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_month') ) +
'"> / <input data-qe-id="form-input-custom-field-day-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_day_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_day') ) +
'"> / <input data-qe-id="form-input-custom-field-year-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_year_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_year" value="" placeholder="YYYY" class="ctct-form-element ctct-form-date-field-4" maxlength="4" min="1900" max="9999" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_year') ) +
'">\n        </div>\n        ';
 } ;
__p += '\n    ';
 }); ;
__p += '\n\n        ';
 if (data.list_ids.length > 1) { ;
__p += '\n        <fieldset id="list_memberships_field_' +
__e( data.form_index ) +
'" class="ctct-form-lists">\n            <legend id="list_memberships_label_' +
__e( data.form_index ) +
'" class="ctct-form-required ctct-form-lists-legend">Listes Ã©lectroniques</legend>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-list_memberships" style="display: none;"></div>\n            ';
 _.each(data._emailLists, function(emailList, index) { ;
__p += '\n                <div class="ctct-form-listitem">\n                    <input class="ctct-form-checkbox" data-qe-id="form-input-list-' +
__e( emailList.label ) +
'" id="email_list_' +
__e( index ) +
'_' +
__e( data.form_index ) +
'" type="checkbox" name="emailList" value="' +
__e( emailList.id ) +
'">\n                    <label data-qe-id="form-label-list-' +
__e( emailList.label ) +
'" for="email_list_' +
__e( index ) +
'_' +
__e( data.form_index ) +
'" class="ctct-form-listname ctct-form-checkbox-label">' +
__e( emailList.label ) +
'</label>\n                </div>\n            ';
 }); ;
__p += '\n        </fieldset>\n        ';
 } ;
__p += '\n\n        <div id="error_message_' +
__e( data.form_index ) +
'" class="ctct-form-error" style="display:none;">\n            <p class="ctct-form-errorMessage">DÃ©solÃ©, nous n&#39;avons pas pu complÃ©ter votre inscription. Veuillez nous contacter pour rÃ©soudre ce problÃ¨me.</p>\n        </div>\n        <div id="network_error_message_' +
__e( data.form_index ) +
'" class="ctct-form-error" style="display:none;">\n            <p class="ctct-form-errorMessage">Operation timed out, please try again.</p>\n        </div>\n\n\n        <button data-qe-id="form-button" type="button" class="ctct-form-button">' +
__e( data.buttonText ) +
'</button>\n    </form>\n    <p class="ctct-form-footer">\n        ';
 if(!data.hideBranding) { ;
__p += '\n        <span data-qe-id="form-branding">\n             <a href="http://www.constantcontact.com/index.jsp?cc=forms_popup" rel="nofollow" target="_blank" class="ctct-form-footer-link">Constant Contact</a> |\n        </span>\n        ';
 } ;
__p += '\n        <a href="' +
__e( data._defaults.privacyUrl ) +
'" target="_blank" data-qe-id="form-privacy-link" class="ctct-form-footer-link">Vie privÃ©e</a>\n    </p>\n</div>\n\n';
return __p
};

SignUpFormWidget["JST"]["dist/templates/fr/popup_wrapper.html"] = function(data) {
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
__p += '<div class="ctct-popup-wrapper form_' +
__e( data.form_index ) +
'">\n    <div class="ctct-popup-overlay"></div>\n    <div class="ctct-popup-inner">\n      <div class="ctct-popup-content">\n        <button type="button" class="ctct-popup-close js-popup-close" title="Close">\n            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" class="undefined">\n                <polygon points="14 11 11 14 8 11 5 14 2 11 5 8 2 5 5 2 8 5 11 2 14 5 11 8 " class="undefined"/>\n            </svg>\n        </button>\n        <div class="ctct-form-container ctct-form-popup form_' +
__e( data.form_index ) +
'"></div>\n      </div>\n    </div>\n\n    ';
 if (data.recaptchaKey) { ;
__p += '\n    <div class="g-recaptcha" id="ctct_recaptcha_' +
__e( data.form_index ) +
'" data-sitekey="' +
__e( data.recaptchaKey ) +
'" data-size="invisible"></div>\n    ';
 } ;
__p += '\n</div>\n';
return __p
};

SignUpFormWidget["JST"]["dist/templates/it/inline_form.html"] = function(data) {
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
__p += '<div class="ctct-form-container ctct-form-embed form_' +
__e( data.form_index ) +
'">\n    <div class="ctct-form-defaults" data-qe-id="form-background">\n        <div id="success_message_' +
__e( data.form_index ) +
'" class="ctct-form-success" style="display:none;" data-qe-id="success-message">\n            <h2 class="ctct-form-header">Grazie per aver effettuato l\'iscrizione!</h2>\n            <p class="ctct-form-text">Ãˆ possibile disdire l\'iscrizione in qualsiasi momento utilizzando l\'apposito link alla fine di ogni messaggio.</p>\n        </div>\n        <form class="ctct-form-custom" id="ctct_form_' +
__e( data.form_index ) +
'" autocomplete="on" data-qe-id="form-data">\n            ';
 if(!_.isEmpty(data.titleText)) { ;
__p += '\n            <h2 data-qe-id="form-title" class="ctct-form-header">' +
__e( data.titleText ) +
'</h2>\n            ';
 } ;
__p += '\n            ';
 if(!_.isEmpty(data.descriptionText)) { ;
__p += '\n            <p data-qe-id="form-description" class="ctct-form-text">' +
__e( data.descriptionText ) +
'</p>\n            ';
 } ;
__p += '\n\n            <div id="email_address_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-email" id="email_address_label_' +
__e( data.form_index ) +
'" for="email_address_' +
__e( data.form_index ) +
'" class="ctct-form-label ctct-form-required">Indirizzo email</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-email" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-email" id="email_address_' +
__e( data.form_index ) +
'" type="email" name="email_address" value="" maxlength="80">\n            </div>\n\n            ';
 if(_.contains(data.contact_fields, 'first_name')) { ;
__p += '\n            <div id="first_name_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-first-name" id="first_name_label_' +
__e( data.form_index ) +
'" for="first_name_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Nome</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-first-name" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-first-name" id="first_name_' +
__e( data.form_index ) +
'" type="text" name="first_name" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'last_name')) { ;
__p += '\n            <div id="last_name_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-last-name" id="last_name_label_' +
__e( data.form_index ) +
'" for="last_name_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Cognome</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-last-name" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-last-name" id="last_name_' +
__e( data.form_index ) +
'" type="text" name="last_name" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'phone')) { ;
__p += '\n            <div id="phone_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-phone" id="phone_label_' +
__e( data.form_index ) +
'" for="phone_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Numero di telefono</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-phone" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-phone" id="phone_' +
__e( data.form_index ) +
'" type="tel" name="phone" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'country')) { ;
__p += '\n            <div id="country_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-country" id="country_label_' +
__e( data.form_index ) +
'" for="country_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Seleziona un paese</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-country" style="display: none;"></div>\n                <select class="ctct-select-element" data-qe-id="form-select-country-' +
__e( data.form_index ) +
'" id="country_' +
__e( data.form_index ) +
'" name="country">\n                    <option value="">--</option>\n                    ';
 _.each(data._defaults.countries, function(country) { ;
__p += '\n                        ';
 if (country.countryCode === data.selectedCountry) { ;
__p += '\n                            <option value="' +
__e( country.countryCode ) +
'" selected>' +
__e( country.display ) +
'</option>\n                        ';
 } else { ;
__p += '\n                            <option value="' +
__e( country.countryCode ) +
'">' +
__e( country.display ) +
'</option>\n                        ';
 } ;
__p += '\n                    ';
 }); ;
__p += '\n                </select>\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'street')) { ;
__p += '\n            <div id="street_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-street" id="street_label_' +
__e( data.form_index ) +
'" for="street_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Via</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-street" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-street" id="street_' +
__e( data.form_index ) +
'" type="text" name="street" value="" maxlength="255">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'city')) { ;
__p += '\n            <div id="city_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-city" id="city_label_' +
__e( data.form_index ) +
'" for="city_' +
__e( data.form_index ) +
'" class="ctct-form-label ">LocalitÃ </label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-city" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-city" id="city_' +
__e( data.form_index ) +
'" type="text" name="city" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'state')) { ;
__p += '\n            <div id="state_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-state" id="state_label_' +
__e( data.form_index ) +
'" for="state_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Seleziona stato/provincia</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-state" style="display: none;"></div>\n                <input data-qe-id="form-input-state" class="state_' +
__e( data.form_index ) +
' ctct-form-element" id="state_' +
__e( data.form_index ) +
'" type="text" name="state" value="" maxlength="50">\n                <select data-qe-id="form-select-state-' +
__e( data.form_index ) +
'" class="state_' +
__e( data.form_index ) +
' ctct-select-element" id="state_' +
__e( data.form_index ) +
'" style="display: none;" name="state">\n                </select>\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'postal_code')) { ;
__p += '\n            <div id="postal_code_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-postal-code" id="postal_code_label_' +
__e( data.form_index ) +
'" for="postal_code_' +
__e( data.form_index ) +
'" class="ctct-form-label ">CAP</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-postal-code" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-postal-code" id="postal_code_' +
__e( data.form_index ) +
'" type="text" name="postal_code" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'company')) { ;
__p += '\n            <div id="company_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-company" id="company_label_' +
__e( data.form_index ) +
'" for="company_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Azienda</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-company" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-company" id="company_' +
__e( data.form_index ) +
'" type="text" name="company" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'job_title')) { ;
__p += '\n            <div id="job_title_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-title" id="job_title_label_' +
__e( data.form_index ) +
'" for="job_title_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Qualifica</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-job-title" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-title" id="job_title_' +
__e( data.form_index ) +
'" type="text" name="job_title" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'birthday')) { ;
__p += '\n            <div id="birthday_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-birthday" id="birthday_label_' +
__e( data.form_index ) +
'" for="birthday_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Compleanno</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-birthday" style="display: none;"></div>\n                <input data-qe-id="form-input-birthday-month" id="birthday_month_' +
__e( data.form_index ) +
'" type="number" name="birthday_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" min="1" max="12" maxlength="2" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('birthday_aria_label_month') ) +
'"> / <input data-qe-id="form-input-birthday-day" id="birthday_day_' +
__e( data.form_index ) +
'" type="number" name="birthday_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('birthday_aria_label_day') ) +
'">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'anniversary')) { ;
__p += '\n            <div id="anniversary_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-anniversary" id="anniversary_label_' +
__e( data.form_index ) +
'" for="anniversary_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Anniversario</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-anniversary" style="display: none;"></div>\n                <input data-qe-id="form-input-anniversary-month" id="anniversary_month_' +
__e( data.form_index ) +
'" type="number" name="anniversary_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="12" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_month') ) +
'"> / <input data-qe-id="form-input-anniversary-day" id="anniversary_day_' +
__e( data.form_index ) +
'" type="number" name="anniversary_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_day') ) +
'"> / <input data-qe-id="form-input-anniversary-year" id="anniversary_year_' +
__e( data.form_index ) +
'" type="number" name="anniversary_year" value="" placeholder="YYYY" class="ctct-form-element ctct-form-date-field-4" maxlength="4" min="1900" max="' +
__e( data.max_anniversary_year ) +
'" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_year') ) +
'">\n            </div>\n            ';
 } ;
__p += '\n\n        ';
 _.each(data._customFields, function(customField) { ;
__p += '\n            ';
 if(customField.type === 'custom_field_string') { ;
__p += '\n            <div id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_label_' +
__e( data.form_index ) +
'" for="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_' +
__e( data.form_index ) +
'" class="ctct-form-label ctct-form-label ">' +
__e( customField.label ) +
'</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-custom-field-' +
__e( customField.label ) +
'" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_' +
__e( data.form_index ) +
'" type="text" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'" value="" maxlength="255">\n            </div>\n            ';
 } ;
__p += '\n            ';
 if(customField.type === 'custom_field_date') { ;
__p += '\n            <div id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_label_' +
__e( data.form_index ) +
'" for="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">' +
__e( customField.label ) +
'</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-custom-field-' +
__e( customField.label ) +
'" style="display: none;"></div>\n                <input data-qe-id="form-input-custom-field-month-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="12" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_month') ) +
'"> / <input data-qe-id="form-input-custom-field-day-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_day_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_day') ) +
'"> / <input data-qe-id="form-input-custom-field-year-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_year_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_year" value="" placeholder="YYYY" class="ctct-form-element ctct-form-date-field-4" maxlength="4" min="1900" max="9999" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_year') ) +
'">\n            </div>\n            ';
 } ;
__p += '\n        ';
 }); ;
__p += '\n\n            ';
 if (data.list_ids.length > 1) { ;
__p += '\n            <fieldset id="list_memberships_field_' +
__e( data.form_index ) +
'" class="ctct-form-lists">\n                <legend id="list_memberships_label_' +
__e( data.form_index ) +
'" class="ctct-form-required ctct-form-lists-legend">Elenchi email</legend>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-list_memberships" style="display: none;"></div>\n                ';
 _.each(data._emailLists, function(emailList, index) { ;
__p += '\n                    <div class="ctct-form-listitem">\n                        <input class="ctct-form-checkbox" data-qe-id="form-input-list-' +
__e( emailList.label ) +
'" id="email_list_' +
__e( index ) +
'_' +
__e( data.form_index ) +
'" type="checkbox" name="emailList" value="' +
__e( emailList.id ) +
'">\n                        <label data-qe-id="form-label-list-' +
__e( emailList.label ) +
'" for="email_list_' +
__e( index ) +
'_' +
__e( data.form_index ) +
'" class="ctct-form-listname ctct-form-checkbox-label">' +
__e( emailList.label ) +
'</label>\n                    </div>\n                ';
 }); ;
__p += '\n            </fieldset>\n            ';
 } ;
__p += '\n\n            <div id="error_message_' +
__e( data.form_index ) +
'" class="ctct-form-error" style="display:none;">\n                <p class="ctct-form-errorMessage">Spiacenti, non Ã¨ stato possibile completare l\'iscrizione. Contattaci per risolvere il problema.</p>\n            </div>\n            <div id="network_error_message_' +
__e( data.form_index ) +
'" class="ctct-form-error" style="display:none;">\n                <p class="ctct-form-errorMessage">Operation timed out, please try again.</p>\n            </div>\n\n\n            <button data-qe-id="form-button" type="button" class="ctct-form-button">' +
__e( data.buttonText ) +
'</button>\n\n            ';
 if (data.recaptchaKey) { ;
__p += '\n            <div class="g-recaptcha" id="ctct_recaptcha_' +
__e( data.form_index ) +
'" data-sitekey="' +
__e( data.recaptchaKey ) +
'" data-size="invisible">\n            </div>\n            ';
 } ;
__p += '\n        </form>\n        <p class="ctct-form-footer">\n            ';
 if (!data.hideBranding) { ;
__p += '\n            <span data-qe-id="form-branding">\n                 <a href="http://www.constantcontact.com/index.jsp?cc=forms_inline" rel="nofollow" target="_blank" class="ctct-form-footer-link">Constant Contact</a> |\n            </span>\n            ';
 } ;
__p += '\n            <a href="' +
__e( data._defaults.privacyUrl ) +
'" target="_blank" data-qe-id="form-privacy-link" class="ctct-form-footer-link">Privacy</a>\n        </p>\n    </div>\n</div>\n';
return __p
};

SignUpFormWidget["JST"]["dist/templates/it/popup_form.html"] = function(data) {
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
__p += '<div class="ctct-form-defaults" data-qe-id="form-background">\n    <div id="success_message_' +
__e( data.form_index ) +
'" class="ctct-form-success" style="display:none;" data-qe-id="success-message">\n        <h2 class="ctct-form-header">Grazie per aver effettuato l\'iscrizione!</h2>\n        <p class="ctct-form-text">Ãˆ possibile disdire l\'iscrizione in qualsiasi momento utilizzando l\'apposito link alla fine di ogni messaggio.</p>\n    </div>\n    <form class="ctct-form-custom" id="ctct_form_' +
__e( data.form_index ) +
'" autocomplete="on" data-qe-id="form-data">\n        ';
 if(!_.isEmpty(data.titleText)) { ;
__p += '\n        <h2 data-qe-id="form-title" class="ctct-form-header">' +
__e( data.titleText ) +
'</h2>\n        ';
 } ;
__p += '\n        ';
 if(!_.isEmpty(data.descriptionText)) { ;
__p += '\n        <p data-qe-id="form-description" class="ctct-form-text">' +
__e( data.descriptionText ) +
'</p>\n        ';
 } ;
__p += '\n\n        <div id="email_address_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-email" id="email_address_label_' +
__e( data.form_index ) +
'" for="email_address_' +
__e( data.form_index ) +
'" class="ctct-form-label ctct-form-required">Indirizzo email</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-email" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-email" id="email_address_' +
__e( data.form_index ) +
'" type="email" name="email_address" value="" maxlength="80">\n        </div>\n\n        ';
 if(_.contains(data.contact_fields, 'first_name')) { ;
__p += '\n        <div id="first_name_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-first-name" id="first_name_label_' +
__e( data.form_index ) +
'" for="first_name_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Nome</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-first-name" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-first-name" id="first_name_' +
__e( data.form_index ) +
'" type="text" name="first_name" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'last_name')) { ;
__p += '\n        <div id="last_name_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-last-name" id="last_name_label_' +
__e( data.form_index ) +
'" for="last_name_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Cognome</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-last-name" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-last-name" id="last_name_' +
__e( data.form_index ) +
'" type="text" name="last_name" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'phone')) { ;
__p += '\n        <div id="phone_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-phone" id="phone_label_' +
__e( data.form_index ) +
'" for="phone_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Numero di telefono</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-phone" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-phone" id="phone_' +
__e( data.form_index ) +
'" type="tel" name="phone" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'country')) { ;
__p += '\n        <div id="country_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-country" id="country_label_' +
__e( data.form_index ) +
'" for="country_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Seleziona un paese</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-country" style="display: none;"></div>\n            <select class="ctct-select-element" data-qe-id="form-select-country-' +
__e( data.form_index ) +
'" id="country_' +
__e( data.form_index ) +
'" name="country">\n                <option value="">--</option>\n                ';
 _.each(data._defaults.countries, function(country) { ;
__p += '\n                    ';
 if (country.countryCode === data.selectedCountry) { ;
__p += '\n                        <option value="' +
__e( country.countryCode ) +
'" selected>' +
__e( country.display ) +
'</option>\n                    ';
 } else { ;
__p += '\n                        <option value="' +
__e( country.countryCode ) +
'">' +
__e( country.display ) +
'</option>\n                    ';
 } ;
__p += '\n                ';
 }); ;
__p += '\n            </select>\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'street')) { ;
__p += '\n        <div id="street_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-street" id="street_label_' +
__e( data.form_index ) +
'" for="street_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Via</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-street" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-street" id="street_' +
__e( data.form_index ) +
'" type="text" name="street" value="" maxlength="255">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'city')) { ;
__p += '\n        <div id="city_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-city" id="city_label_' +
__e( data.form_index ) +
'" for="city_' +
__e( data.form_index ) +
'" class="ctct-form-label ">LocalitÃ </label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-city" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-city" id="city_' +
__e( data.form_index ) +
'" type="text" name="city" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'state')) { ;
__p += '\n        <div id="state_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-state" id="state_label_' +
__e( data.form_index ) +
'" for="state_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Seleziona stato/provincia</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-state" style="display: none;"></div>\n            <input data-qe-id="form-input-state" class="state_' +
__e( data.form_index ) +
' ctct-form-element" id="state_' +
__e( data.form_index ) +
'" type="text" name="state" value="" maxlength="50">\n            <select data-qe-id="form-select-state-' +
__e( data.form_index ) +
'" class="state_' +
__e( data.form_index ) +
' ctct-select-element" id="state_' +
__e( data.form_index ) +
'" style="display: none;" name="state">\n            </select>\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'postal_code')) { ;
__p += '\n        <div id="postal_code_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-postal-code" id="postal_code_label_' +
__e( data.form_index ) +
'" for="postal_code_' +
__e( data.form_index ) +
'" class="ctct-form-label ">CAP</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-postal-code" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-postal-code" id="postal_code_' +
__e( data.form_index ) +
'" type="text" name="postal_code" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'company')) { ;
__p += '\n        <div id="company_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-company" id="company_label_' +
__e( data.form_index ) +
'" for="company_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Azienda</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-company" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-company" id="company_' +
__e( data.form_index ) +
'" type="text" name="company" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'job_title')) { ;
__p += '\n        <div id="job_title_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-title" id="job_title_label_' +
__e( data.form_index ) +
'" for="job_title_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Qualifica</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-job-title" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-title" id="job_title_' +
__e( data.form_index ) +
'" type="text" name="job_title" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'birthday')) { ;
__p += '\n        <div id="birthday_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-birthday" id="birthday_label_' +
__e( data.form_index ) +
'" for="birthday_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Compleanno</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-birthday" style="display: none;"></div>\n            <input data-qe-id="form-input-birthday-month" id="birthday_month_' +
__e( data.form_index ) +
'" type="number" name="birthday_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" min="1" max="12" maxlength="2" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('birthday_aria_label_month') ) +
'"> / <input data-qe-id="form-input-birthday-day" id="birthday_day_' +
__e( data.form_index ) +
'" type="number" name="birthday_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('birthday_aria_label_day') ) +
'">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'anniversary')) { ;
__p += '\n        <div id="anniversary_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-anniversary" id="anniversary_label_' +
__e( data.form_index ) +
'" for="anniversary_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Anniversario</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-anniversary" style="display: none;"></div>\n            <input data-qe-id="form-input-anniversary-month" id="anniversary_month_' +
__e( data.form_index ) +
'" type="number" name="anniversary_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="12" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_month') ) +
'"> / <input data-qe-id="form-input-anniversary-day" id="anniversary_day_' +
__e( data.form_index ) +
'" type="number" name="anniversary_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_day') ) +
'"> / <input data-qe-id="form-input-anniversary-year" id="anniversary_year_' +
__e( data.form_index ) +
'" type="number" name="anniversary_year" value="" placeholder="YYYY" class="ctct-form-element ctct-form-date-field-4" maxlength="4" min="1900" max="' +
__e( data.max_anniversary_year ) +
'" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_year') ) +
'">\n        </div>\n        ';
 } ;
__p += '\n\n    ';
 _.each(data._customFields, function(customField) { ;
__p += '\n        ';
 if(customField.type === 'custom_field_string') { ;
__p += '\n        <div id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_label_' +
__e( data.form_index ) +
'" for="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_' +
__e( data.form_index ) +
'" class="ctct-form-label ctct-form-label ">' +
__e( customField.label ) +
'</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-custom-field-' +
__e( customField.label ) +
'" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_' +
__e( data.form_index ) +
'" type="text" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'" value="" maxlength="255">\n        </div>\n        ';
 } ;
__p += '\n        ';
 if(customField.type === 'custom_field_date') { ;
__p += '\n        <div id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_label_' +
__e( data.form_index ) +
'" for="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">' +
__e( customField.label ) +
'</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-custom-field-' +
__e( customField.label ) +
'" style="display: none;"></div>\n            <input data-qe-id="form-input-custom-field-month-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="12" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_month') ) +
'"> / <input data-qe-id="form-input-custom-field-day-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_day_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_day') ) +
'"> / <input data-qe-id="form-input-custom-field-year-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_year_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_year" value="" placeholder="YYYY" class="ctct-form-element ctct-form-date-field-4" maxlength="4" min="1900" max="9999" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_year') ) +
'">\n        </div>\n        ';
 } ;
__p += '\n    ';
 }); ;
__p += '\n\n        ';
 if (data.list_ids.length > 1) { ;
__p += '\n        <fieldset id="list_memberships_field_' +
__e( data.form_index ) +
'" class="ctct-form-lists">\n            <legend id="list_memberships_label_' +
__e( data.form_index ) +
'" class="ctct-form-required ctct-form-lists-legend">Elenchi email</legend>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-list_memberships" style="display: none;"></div>\n            ';
 _.each(data._emailLists, function(emailList, index) { ;
__p += '\n                <div class="ctct-form-listitem">\n                    <input class="ctct-form-checkbox" data-qe-id="form-input-list-' +
__e( emailList.label ) +
'" id="email_list_' +
__e( index ) +
'_' +
__e( data.form_index ) +
'" type="checkbox" name="emailList" value="' +
__e( emailList.id ) +
'">\n                    <label data-qe-id="form-label-list-' +
__e( emailList.label ) +
'" for="email_list_' +
__e( index ) +
'_' +
__e( data.form_index ) +
'" class="ctct-form-listname ctct-form-checkbox-label">' +
__e( emailList.label ) +
'</label>\n                </div>\n            ';
 }); ;
__p += '\n        </fieldset>\n        ';
 } ;
__p += '\n\n        <div id="error_message_' +
__e( data.form_index ) +
'" class="ctct-form-error" style="display:none;">\n            <p class="ctct-form-errorMessage">Spiacenti, non Ã¨ stato possibile completare l\'iscrizione. Contattaci per risolvere il problema.</p>\n        </div>\n        <div id="network_error_message_' +
__e( data.form_index ) +
'" class="ctct-form-error" style="display:none;">\n            <p class="ctct-form-errorMessage">Operation timed out, please try again.</p>\n        </div>\n\n\n        <button data-qe-id="form-button" type="button" class="ctct-form-button">' +
__e( data.buttonText ) +
'</button>\n    </form>\n    <p class="ctct-form-footer">\n        ';
 if(!data.hideBranding) { ;
__p += '\n        <span data-qe-id="form-branding">\n             <a href="http://www.constantcontact.com/index.jsp?cc=forms_popup" rel="nofollow" target="_blank" class="ctct-form-footer-link">Constant Contact</a> |\n        </span>\n        ';
 } ;
__p += '\n        <a href="' +
__e( data._defaults.privacyUrl ) +
'" target="_blank" data-qe-id="form-privacy-link" class="ctct-form-footer-link">Privacy</a>\n    </p>\n</div>\n\n';
return __p
};

SignUpFormWidget["JST"]["dist/templates/it/popup_wrapper.html"] = function(data) {
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
__p += '<div class="ctct-popup-wrapper form_' +
__e( data.form_index ) +
'">\n    <div class="ctct-popup-overlay"></div>\n    <div class="ctct-popup-inner">\n      <div class="ctct-popup-content">\n        <button type="button" class="ctct-popup-close js-popup-close" title="Close">\n            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" class="undefined">\n                <polygon points="14 11 11 14 8 11 5 14 2 11 5 8 2 5 5 2 8 5 11 2 14 5 11 8 " class="undefined"/>\n            </svg>\n        </button>\n        <div class="ctct-form-container ctct-form-popup form_' +
__e( data.form_index ) +
'"></div>\n      </div>\n    </div>\n\n    ';
 if (data.recaptchaKey) { ;
__p += '\n    <div class="g-recaptcha" id="ctct_recaptcha_' +
__e( data.form_index ) +
'" data-sitekey="' +
__e( data.recaptchaKey ) +
'" data-size="invisible"></div>\n    ';
 } ;
__p += '\n</div>\n';
return __p
};

SignUpFormWidget["JST"]["dist/templates/nl/inline_form.html"] = function(data) {
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
__p += '<div class="ctct-form-container ctct-form-embed form_' +
__e( data.form_index ) +
'">\n    <div class="ctct-form-defaults" data-qe-id="form-background">\n        <div id="success_message_' +
__e( data.form_index ) +
'" class="ctct-form-success" style="display:none;" data-qe-id="success-message">\n            <h2 class="ctct-form-header">Bedankt voor uw aanmelding</h2>\n            <p class="ctct-form-text">U kunt u altijd afmelden door op de link Afmelden te klikken die onder aan elke e-mail te vinden is.</p>\n        </div>\n        <form class="ctct-form-custom" id="ctct_form_' +
__e( data.form_index ) +
'" autocomplete="on" data-qe-id="form-data">\n            ';
 if(!_.isEmpty(data.titleText)) { ;
__p += '\n            <h2 data-qe-id="form-title" class="ctct-form-header">' +
__e( data.titleText ) +
'</h2>\n            ';
 } ;
__p += '\n            ';
 if(!_.isEmpty(data.descriptionText)) { ;
__p += '\n            <p data-qe-id="form-description" class="ctct-form-text">' +
__e( data.descriptionText ) +
'</p>\n            ';
 } ;
__p += '\n\n            <div id="email_address_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-email" id="email_address_label_' +
__e( data.form_index ) +
'" for="email_address_' +
__e( data.form_index ) +
'" class="ctct-form-label ctct-form-required">E-mailadres</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-email" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-email" id="email_address_' +
__e( data.form_index ) +
'" type="email" name="email_address" value="" maxlength="80">\n            </div>\n\n            ';
 if(_.contains(data.contact_fields, 'first_name')) { ;
__p += '\n            <div id="first_name_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-first-name" id="first_name_label_' +
__e( data.form_index ) +
'" for="first_name_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Voornaam</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-first-name" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-first-name" id="first_name_' +
__e( data.form_index ) +
'" type="text" name="first_name" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'last_name')) { ;
__p += '\n            <div id="last_name_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-last-name" id="last_name_label_' +
__e( data.form_index ) +
'" for="last_name_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Achternaam</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-last-name" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-last-name" id="last_name_' +
__e( data.form_index ) +
'" type="text" name="last_name" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'phone')) { ;
__p += '\n            <div id="phone_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-phone" id="phone_label_' +
__e( data.form_index ) +
'" for="phone_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Telefoonnummer</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-phone" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-phone" id="phone_' +
__e( data.form_index ) +
'" type="tel" name="phone" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'country')) { ;
__p += '\n            <div id="country_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-country" id="country_label_' +
__e( data.form_index ) +
'" for="country_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Selecteer een land</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-country" style="display: none;"></div>\n                <select class="ctct-select-element" data-qe-id="form-select-country-' +
__e( data.form_index ) +
'" id="country_' +
__e( data.form_index ) +
'" name="country">\n                    <option value="">--</option>\n                    ';
 _.each(data._defaults.countries, function(country) { ;
__p += '\n                        ';
 if (country.countryCode === data.selectedCountry) { ;
__p += '\n                            <option value="' +
__e( country.countryCode ) +
'" selected>' +
__e( country.display ) +
'</option>\n                        ';
 } else { ;
__p += '\n                            <option value="' +
__e( country.countryCode ) +
'">' +
__e( country.display ) +
'</option>\n                        ';
 } ;
__p += '\n                    ';
 }); ;
__p += '\n                </select>\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'street')) { ;
__p += '\n            <div id="street_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-street" id="street_label_' +
__e( data.form_index ) +
'" for="street_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Adres</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-street" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-street" id="street_' +
__e( data.form_index ) +
'" type="text" name="street" value="" maxlength="255">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'city')) { ;
__p += '\n            <div id="city_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-city" id="city_label_' +
__e( data.form_index ) +
'" for="city_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Plaats</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-city" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-city" id="city_' +
__e( data.form_index ) +
'" type="text" name="city" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'state')) { ;
__p += '\n            <div id="state_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-state" id="state_label_' +
__e( data.form_index ) +
'" for="state_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Selecteer een provincie</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-state" style="display: none;"></div>\n                <input data-qe-id="form-input-state" class="state_' +
__e( data.form_index ) +
' ctct-form-element" id="state_' +
__e( data.form_index ) +
'" type="text" name="state" value="" maxlength="50">\n                <select data-qe-id="form-select-state-' +
__e( data.form_index ) +
'" class="state_' +
__e( data.form_index ) +
' ctct-select-element" id="state_' +
__e( data.form_index ) +
'" style="display: none;" name="state">\n                </select>\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'postal_code')) { ;
__p += '\n            <div id="postal_code_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-postal-code" id="postal_code_label_' +
__e( data.form_index ) +
'" for="postal_code_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Postcode</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-postal-code" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-postal-code" id="postal_code_' +
__e( data.form_index ) +
'" type="text" name="postal_code" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'company')) { ;
__p += '\n            <div id="company_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-company" id="company_label_' +
__e( data.form_index ) +
'" for="company_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Bedrijf</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-company" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-company" id="company_' +
__e( data.form_index ) +
'" type="text" name="company" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'job_title')) { ;
__p += '\n            <div id="job_title_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-title" id="job_title_label_' +
__e( data.form_index ) +
'" for="job_title_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Functie</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-job-title" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-title" id="job_title_' +
__e( data.form_index ) +
'" type="text" name="job_title" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'birthday')) { ;
__p += '\n            <div id="birthday_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-birthday" id="birthday_label_' +
__e( data.form_index ) +
'" for="birthday_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Verjaardag</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-birthday" style="display: none;"></div>\n                <input data-qe-id="form-input-birthday-month" id="birthday_month_' +
__e( data.form_index ) +
'" type="number" name="birthday_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" min="1" max="12" maxlength="2" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('birthday_aria_label_month') ) +
'"> / <input data-qe-id="form-input-birthday-day" id="birthday_day_' +
__e( data.form_index ) +
'" type="number" name="birthday_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('birthday_aria_label_day') ) +
'">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'anniversary')) { ;
__p += '\n            <div id="anniversary_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-anniversary" id="anniversary_label_' +
__e( data.form_index ) +
'" for="anniversary_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Jubileum</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-anniversary" style="display: none;"></div>\n                <input data-qe-id="form-input-anniversary-month" id="anniversary_month_' +
__e( data.form_index ) +
'" type="number" name="anniversary_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="12" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_month') ) +
'"> / <input data-qe-id="form-input-anniversary-day" id="anniversary_day_' +
__e( data.form_index ) +
'" type="number" name="anniversary_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_day') ) +
'"> / <input data-qe-id="form-input-anniversary-year" id="anniversary_year_' +
__e( data.form_index ) +
'" type="number" name="anniversary_year" value="" placeholder="YYYY" class="ctct-form-element ctct-form-date-field-4" maxlength="4" min="1900" max="' +
__e( data.max_anniversary_year ) +
'" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_year') ) +
'">\n            </div>\n            ';
 } ;
__p += '\n\n        ';
 _.each(data._customFields, function(customField) { ;
__p += '\n            ';
 if(customField.type === 'custom_field_string') { ;
__p += '\n            <div id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_label_' +
__e( data.form_index ) +
'" for="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_' +
__e( data.form_index ) +
'" class="ctct-form-label ctct-form-label ">' +
__e( customField.label ) +
'</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-custom-field-' +
__e( customField.label ) +
'" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_' +
__e( data.form_index ) +
'" type="text" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'" value="" maxlength="255">\n            </div>\n            ';
 } ;
__p += '\n            ';
 if(customField.type === 'custom_field_date') { ;
__p += '\n            <div id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_label_' +
__e( data.form_index ) +
'" for="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">' +
__e( customField.label ) +
'</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-custom-field-' +
__e( customField.label ) +
'" style="display: none;"></div>\n                <input data-qe-id="form-input-custom-field-month-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="12" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_month') ) +
'"> / <input data-qe-id="form-input-custom-field-day-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_day_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_day') ) +
'"> / <input data-qe-id="form-input-custom-field-year-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_year_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_year" value="" placeholder="YYYY" class="ctct-form-element ctct-form-date-field-4" maxlength="4" min="1900" max="9999" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_year') ) +
'">\n            </div>\n            ';
 } ;
__p += '\n        ';
 }); ;
__p += '\n\n            ';
 if (data.list_ids.length > 1) { ;
__p += '\n            <fieldset id="list_memberships_field_' +
__e( data.form_index ) +
'" class="ctct-form-lists">\n                <legend id="list_memberships_label_' +
__e( data.form_index ) +
'" class="ctct-form-required ctct-form-lists-legend">E-maillijsten</legend>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-list_memberships" style="display: none;"></div>\n                ';
 _.each(data._emailLists, function(emailList, index) { ;
__p += '\n                    <div class="ctct-form-listitem">\n                        <input class="ctct-form-checkbox" data-qe-id="form-input-list-' +
__e( emailList.label ) +
'" id="email_list_' +
__e( index ) +
'_' +
__e( data.form_index ) +
'" type="checkbox" name="emailList" value="' +
__e( emailList.id ) +
'">\n                        <label data-qe-id="form-label-list-' +
__e( emailList.label ) +
'" for="email_list_' +
__e( index ) +
'_' +
__e( data.form_index ) +
'" class="ctct-form-listname ctct-form-checkbox-label">' +
__e( emailList.label ) +
'</label>\n                    </div>\n                ';
 }); ;
__p += '\n            </fieldset>\n            ';
 } ;
__p += '\n\n            <div id="error_message_' +
__e( data.form_index ) +
'" class="ctct-form-error" style="display:none;">\n                <p class="ctct-form-errorMessage">We hebben uw aanmelding helaas niet kunnen voltooien. Neem contact met ons op om dit op te lossen.</p>\n            </div>\n            <div id="network_error_message_' +
__e( data.form_index ) +
'" class="ctct-form-error" style="display:none;">\n                <p class="ctct-form-errorMessage">Operation timed out, please try again.</p>\n            </div>\n\n\n            <button data-qe-id="form-button" type="button" class="ctct-form-button">' +
__e( data.buttonText ) +
'</button>\n\n            ';
 if (data.recaptchaKey) { ;
__p += '\n            <div class="g-recaptcha" id="ctct_recaptcha_' +
__e( data.form_index ) +
'" data-sitekey="' +
__e( data.recaptchaKey ) +
'" data-size="invisible">\n            </div>\n            ';
 } ;
__p += '\n        </form>\n        <p class="ctct-form-footer">\n            ';
 if (!data.hideBranding) { ;
__p += '\n            <span data-qe-id="form-branding">\n                 <a href="http://www.constantcontact.com/index.jsp?cc=forms_inline" rel="nofollow" target="_blank" class="ctct-form-footer-link">Constant Contact</a> |\n            </span>\n            ';
 } ;
__p += '\n            <a href="' +
__e( data._defaults.privacyUrl ) +
'" target="_blank" data-qe-id="form-privacy-link" class="ctct-form-footer-link">Privacy</a>\n        </p>\n    </div>\n</div>\n';
return __p
};

SignUpFormWidget["JST"]["dist/templates/nl/popup_form.html"] = function(data) {
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
__p += '<div class="ctct-form-defaults" data-qe-id="form-background">\n    <div id="success_message_' +
__e( data.form_index ) +
'" class="ctct-form-success" style="display:none;" data-qe-id="success-message">\n        <h2 class="ctct-form-header">Bedankt voor uw aanmelding</h2>\n        <p class="ctct-form-text">U kunt u altijd afmelden door op de link Afmelden te klikken die onder aan elke e-mail te vinden is.</p>\n    </div>\n    <form class="ctct-form-custom" id="ctct_form_' +
__e( data.form_index ) +
'" autocomplete="on" data-qe-id="form-data">\n        ';
 if(!_.isEmpty(data.titleText)) { ;
__p += '\n        <h2 data-qe-id="form-title" class="ctct-form-header">' +
__e( data.titleText ) +
'</h2>\n        ';
 } ;
__p += '\n        ';
 if(!_.isEmpty(data.descriptionText)) { ;
__p += '\n        <p data-qe-id="form-description" class="ctct-form-text">' +
__e( data.descriptionText ) +
'</p>\n        ';
 } ;
__p += '\n\n        <div id="email_address_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-email" id="email_address_label_' +
__e( data.form_index ) +
'" for="email_address_' +
__e( data.form_index ) +
'" class="ctct-form-label ctct-form-required">E-mailadres</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-email" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-email" id="email_address_' +
__e( data.form_index ) +
'" type="email" name="email_address" value="" maxlength="80">\n        </div>\n\n        ';
 if(_.contains(data.contact_fields, 'first_name')) { ;
__p += '\n        <div id="first_name_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-first-name" id="first_name_label_' +
__e( data.form_index ) +
'" for="first_name_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Voornaam</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-first-name" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-first-name" id="first_name_' +
__e( data.form_index ) +
'" type="text" name="first_name" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'last_name')) { ;
__p += '\n        <div id="last_name_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-last-name" id="last_name_label_' +
__e( data.form_index ) +
'" for="last_name_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Achternaam</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-last-name" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-last-name" id="last_name_' +
__e( data.form_index ) +
'" type="text" name="last_name" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'phone')) { ;
__p += '\n        <div id="phone_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-phone" id="phone_label_' +
__e( data.form_index ) +
'" for="phone_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Telefoonnummer</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-phone" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-phone" id="phone_' +
__e( data.form_index ) +
'" type="tel" name="phone" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'country')) { ;
__p += '\n        <div id="country_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-country" id="country_label_' +
__e( data.form_index ) +
'" for="country_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Selecteer een land</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-country" style="display: none;"></div>\n            <select class="ctct-select-element" data-qe-id="form-select-country-' +
__e( data.form_index ) +
'" id="country_' +
__e( data.form_index ) +
'" name="country">\n                <option value="">--</option>\n                ';
 _.each(data._defaults.countries, function(country) { ;
__p += '\n                    ';
 if (country.countryCode === data.selectedCountry) { ;
__p += '\n                        <option value="' +
__e( country.countryCode ) +
'" selected>' +
__e( country.display ) +
'</option>\n                    ';
 } else { ;
__p += '\n                        <option value="' +
__e( country.countryCode ) +
'">' +
__e( country.display ) +
'</option>\n                    ';
 } ;
__p += '\n                ';
 }); ;
__p += '\n            </select>\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'street')) { ;
__p += '\n        <div id="street_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-street" id="street_label_' +
__e( data.form_index ) +
'" for="street_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Adres</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-street" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-street" id="street_' +
__e( data.form_index ) +
'" type="text" name="street" value="" maxlength="255">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'city')) { ;
__p += '\n        <div id="city_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-city" id="city_label_' +
__e( data.form_index ) +
'" for="city_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Plaats</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-city" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-city" id="city_' +
__e( data.form_index ) +
'" type="text" name="city" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'state')) { ;
__p += '\n        <div id="state_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-state" id="state_label_' +
__e( data.form_index ) +
'" for="state_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Selecteer een provincie</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-state" style="display: none;"></div>\n            <input data-qe-id="form-input-state" class="state_' +
__e( data.form_index ) +
' ctct-form-element" id="state_' +
__e( data.form_index ) +
'" type="text" name="state" value="" maxlength="50">\n            <select data-qe-id="form-select-state-' +
__e( data.form_index ) +
'" class="state_' +
__e( data.form_index ) +
' ctct-select-element" id="state_' +
__e( data.form_index ) +
'" style="display: none;" name="state">\n            </select>\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'postal_code')) { ;
__p += '\n        <div id="postal_code_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-postal-code" id="postal_code_label_' +
__e( data.form_index ) +
'" for="postal_code_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Postcode</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-postal-code" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-postal-code" id="postal_code_' +
__e( data.form_index ) +
'" type="text" name="postal_code" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'company')) { ;
__p += '\n        <div id="company_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-company" id="company_label_' +
__e( data.form_index ) +
'" for="company_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Bedrijf</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-company" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-company" id="company_' +
__e( data.form_index ) +
'" type="text" name="company" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'job_title')) { ;
__p += '\n        <div id="job_title_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-title" id="job_title_label_' +
__e( data.form_index ) +
'" for="job_title_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Functie</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-job-title" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-title" id="job_title_' +
__e( data.form_index ) +
'" type="text" name="job_title" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'birthday')) { ;
__p += '\n        <div id="birthday_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-birthday" id="birthday_label_' +
__e( data.form_index ) +
'" for="birthday_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Verjaardag</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-birthday" style="display: none;"></div>\n            <input data-qe-id="form-input-birthday-month" id="birthday_month_' +
__e( data.form_index ) +
'" type="number" name="birthday_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" min="1" max="12" maxlength="2" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('birthday_aria_label_month') ) +
'"> / <input data-qe-id="form-input-birthday-day" id="birthday_day_' +
__e( data.form_index ) +
'" type="number" name="birthday_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('birthday_aria_label_day') ) +
'">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'anniversary')) { ;
__p += '\n        <div id="anniversary_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-anniversary" id="anniversary_label_' +
__e( data.form_index ) +
'" for="anniversary_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Jubileum</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-anniversary" style="display: none;"></div>\n            <input data-qe-id="form-input-anniversary-month" id="anniversary_month_' +
__e( data.form_index ) +
'" type="number" name="anniversary_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="12" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_month') ) +
'"> / <input data-qe-id="form-input-anniversary-day" id="anniversary_day_' +
__e( data.form_index ) +
'" type="number" name="anniversary_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_day') ) +
'"> / <input data-qe-id="form-input-anniversary-year" id="anniversary_year_' +
__e( data.form_index ) +
'" type="number" name="anniversary_year" value="" placeholder="YYYY" class="ctct-form-element ctct-form-date-field-4" maxlength="4" min="1900" max="' +
__e( data.max_anniversary_year ) +
'" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_year') ) +
'">\n        </div>\n        ';
 } ;
__p += '\n\n    ';
 _.each(data._customFields, function(customField) { ;
__p += '\n        ';
 if(customField.type === 'custom_field_string') { ;
__p += '\n        <div id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_label_' +
__e( data.form_index ) +
'" for="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_' +
__e( data.form_index ) +
'" class="ctct-form-label ctct-form-label ">' +
__e( customField.label ) +
'</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-custom-field-' +
__e( customField.label ) +
'" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_' +
__e( data.form_index ) +
'" type="text" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'" value="" maxlength="255">\n        </div>\n        ';
 } ;
__p += '\n        ';
 if(customField.type === 'custom_field_date') { ;
__p += '\n        <div id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_label_' +
__e( data.form_index ) +
'" for="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">' +
__e( customField.label ) +
'</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-custom-field-' +
__e( customField.label ) +
'" style="display: none;"></div>\n            <input data-qe-id="form-input-custom-field-month-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="12" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_month') ) +
'"> / <input data-qe-id="form-input-custom-field-day-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_day_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_day') ) +
'"> / <input data-qe-id="form-input-custom-field-year-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_year_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_year" value="" placeholder="YYYY" class="ctct-form-element ctct-form-date-field-4" maxlength="4" min="1900" max="9999" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_year') ) +
'">\n        </div>\n        ';
 } ;
__p += '\n    ';
 }); ;
__p += '\n\n        ';
 if (data.list_ids.length > 1) { ;
__p += '\n        <fieldset id="list_memberships_field_' +
__e( data.form_index ) +
'" class="ctct-form-lists">\n            <legend id="list_memberships_label_' +
__e( data.form_index ) +
'" class="ctct-form-required ctct-form-lists-legend">E-maillijsten</legend>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-list_memberships" style="display: none;"></div>\n            ';
 _.each(data._emailLists, function(emailList, index) { ;
__p += '\n                <div class="ctct-form-listitem">\n                    <input class="ctct-form-checkbox" data-qe-id="form-input-list-' +
__e( emailList.label ) +
'" id="email_list_' +
__e( index ) +
'_' +
__e( data.form_index ) +
'" type="checkbox" name="emailList" value="' +
__e( emailList.id ) +
'">\n                    <label data-qe-id="form-label-list-' +
__e( emailList.label ) +
'" for="email_list_' +
__e( index ) +
'_' +
__e( data.form_index ) +
'" class="ctct-form-listname ctct-form-checkbox-label">' +
__e( emailList.label ) +
'</label>\n                </div>\n            ';
 }); ;
__p += '\n        </fieldset>\n        ';
 } ;
__p += '\n\n        <div id="error_message_' +
__e( data.form_index ) +
'" class="ctct-form-error" style="display:none;">\n            <p class="ctct-form-errorMessage">We hebben uw aanmelding helaas niet kunnen voltooien. Neem contact met ons op om dit op te lossen.</p>\n        </div>\n        <div id="network_error_message_' +
__e( data.form_index ) +
'" class="ctct-form-error" style="display:none;">\n            <p class="ctct-form-errorMessage">Operation timed out, please try again.</p>\n        </div>\n\n\n        <button data-qe-id="form-button" type="button" class="ctct-form-button">' +
__e( data.buttonText ) +
'</button>\n    </form>\n    <p class="ctct-form-footer">\n        ';
 if(!data.hideBranding) { ;
__p += '\n        <span data-qe-id="form-branding">\n             <a href="http://www.constantcontact.com/index.jsp?cc=forms_popup" rel="nofollow" target="_blank" class="ctct-form-footer-link">Constant Contact</a> |\n        </span>\n        ';
 } ;
__p += '\n        <a href="' +
__e( data._defaults.privacyUrl ) +
'" target="_blank" data-qe-id="form-privacy-link" class="ctct-form-footer-link">Privacy</a>\n    </p>\n</div>\n\n';
return __p
};

SignUpFormWidget["JST"]["dist/templates/nl/popup_wrapper.html"] = function(data) {
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
__p += '<div class="ctct-popup-wrapper form_' +
__e( data.form_index ) +
'">\n    <div class="ctct-popup-overlay"></div>\n    <div class="ctct-popup-inner">\n      <div class="ctct-popup-content">\n        <button type="button" class="ctct-popup-close js-popup-close" title="Close">\n            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" class="undefined">\n                <polygon points="14 11 11 14 8 11 5 14 2 11 5 8 2 5 5 2 8 5 11 2 14 5 11 8 " class="undefined"/>\n            </svg>\n        </button>\n        <div class="ctct-form-container ctct-form-popup form_' +
__e( data.form_index ) +
'"></div>\n      </div>\n    </div>\n\n    ';
 if (data.recaptchaKey) { ;
__p += '\n    <div class="g-recaptcha" id="ctct_recaptcha_' +
__e( data.form_index ) +
'" data-sitekey="' +
__e( data.recaptchaKey ) +
'" data-size="invisible"></div>\n    ';
 } ;
__p += '\n</div>\n';
return __p
};

SignUpFormWidget["JST"]["dist/templates/no/inline_form.html"] = function(data) {
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
__p += '<div class="ctct-form-container ctct-form-embed form_' +
__e( data.form_index ) +
'">\n    <div class="ctct-form-defaults" data-qe-id="form-background">\n        <div id="success_message_' +
__e( data.form_index ) +
'" class="ctct-form-success" style="display:none;" data-qe-id="success-message">\n            <h2 class="ctct-form-header">Takk for at du registrerte deg!</h2>\n            <p class="ctct-form-text">Du kan avslutte abonnementet nÃ¥r som helst ved Ã¥ klikke pÃ¥ linken Avslutt abonnement nederst i hver e-postmelding.</p>\n        </div>\n        <form class="ctct-form-custom" id="ctct_form_' +
__e( data.form_index ) +
'" autocomplete="on" data-qe-id="form-data">\n            ';
 if(!_.isEmpty(data.titleText)) { ;
__p += '\n            <h2 data-qe-id="form-title" class="ctct-form-header">' +
__e( data.titleText ) +
'</h2>\n            ';
 } ;
__p += '\n            ';
 if(!_.isEmpty(data.descriptionText)) { ;
__p += '\n            <p data-qe-id="form-description" class="ctct-form-text">' +
__e( data.descriptionText ) +
'</p>\n            ';
 } ;
__p += '\n\n            <div id="email_address_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-email" id="email_address_label_' +
__e( data.form_index ) +
'" for="email_address_' +
__e( data.form_index ) +
'" class="ctct-form-label ctct-form-required">E-postadresse</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-email" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-email" id="email_address_' +
__e( data.form_index ) +
'" type="email" name="email_address" value="" maxlength="80">\n            </div>\n\n            ';
 if(_.contains(data.contact_fields, 'first_name')) { ;
__p += '\n            <div id="first_name_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-first-name" id="first_name_label_' +
__e( data.form_index ) +
'" for="first_name_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Fornavn</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-first-name" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-first-name" id="first_name_' +
__e( data.form_index ) +
'" type="text" name="first_name" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'last_name')) { ;
__p += '\n            <div id="last_name_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-last-name" id="last_name_label_' +
__e( data.form_index ) +
'" for="last_name_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Etternavn</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-last-name" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-last-name" id="last_name_' +
__e( data.form_index ) +
'" type="text" name="last_name" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'phone')) { ;
__p += '\n            <div id="phone_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-phone" id="phone_label_' +
__e( data.form_index ) +
'" for="phone_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Telefon</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-phone" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-phone" id="phone_' +
__e( data.form_index ) +
'" type="tel" name="phone" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'country')) { ;
__p += '\n            <div id="country_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-country" id="country_label_' +
__e( data.form_index ) +
'" for="country_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Velg land</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-country" style="display: none;"></div>\n                <select class="ctct-select-element" data-qe-id="form-select-country-' +
__e( data.form_index ) +
'" id="country_' +
__e( data.form_index ) +
'" name="country">\n                    <option value="">--</option>\n                    ';
 _.each(data._defaults.countries, function(country) { ;
__p += '\n                        ';
 if (country.countryCode === data.selectedCountry) { ;
__p += '\n                            <option value="' +
__e( country.countryCode ) +
'" selected>' +
__e( country.display ) +
'</option>\n                        ';
 } else { ;
__p += '\n                            <option value="' +
__e( country.countryCode ) +
'">' +
__e( country.display ) +
'</option>\n                        ';
 } ;
__p += '\n                    ';
 }); ;
__p += '\n                </select>\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'street')) { ;
__p += '\n            <div id="street_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-street" id="street_label_' +
__e( data.form_index ) +
'" for="street_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Gateadr</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-street" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-street" id="street_' +
__e( data.form_index ) +
'" type="text" name="street" value="" maxlength="255">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'city')) { ;
__p += '\n            <div id="city_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-city" id="city_label_' +
__e( data.form_index ) +
'" for="city_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Poststed</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-city" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-city" id="city_' +
__e( data.form_index ) +
'" type="text" name="city" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'state')) { ;
__p += '\n            <div id="state_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-state" id="state_label_' +
__e( data.form_index ) +
'" for="state_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Velg delstat/region</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-state" style="display: none;"></div>\n                <input data-qe-id="form-input-state" class="state_' +
__e( data.form_index ) +
' ctct-form-element" id="state_' +
__e( data.form_index ) +
'" type="text" name="state" value="" maxlength="50">\n                <select data-qe-id="form-select-state-' +
__e( data.form_index ) +
'" class="state_' +
__e( data.form_index ) +
' ctct-select-element" id="state_' +
__e( data.form_index ) +
'" style="display: none;" name="state">\n                </select>\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'postal_code')) { ;
__p += '\n            <div id="postal_code_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-postal-code" id="postal_code_label_' +
__e( data.form_index ) +
'" for="postal_code_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Postnummer</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-postal-code" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-postal-code" id="postal_code_' +
__e( data.form_index ) +
'" type="text" name="postal_code" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'company')) { ;
__p += '\n            <div id="company_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-company" id="company_label_' +
__e( data.form_index ) +
'" for="company_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Virksomhet</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-company" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-company" id="company_' +
__e( data.form_index ) +
'" type="text" name="company" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'job_title')) { ;
__p += '\n            <div id="job_title_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-title" id="job_title_label_' +
__e( data.form_index ) +
'" for="job_title_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Stilling</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-job-title" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-title" id="job_title_' +
__e( data.form_index ) +
'" type="text" name="job_title" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'birthday')) { ;
__p += '\n            <div id="birthday_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-birthday" id="birthday_label_' +
__e( data.form_index ) +
'" for="birthday_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">FÃ¸dselsdag</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-birthday" style="display: none;"></div>\n                <input data-qe-id="form-input-birthday-month" id="birthday_month_' +
__e( data.form_index ) +
'" type="number" name="birthday_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" min="1" max="12" maxlength="2" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('birthday_aria_label_month') ) +
'"> / <input data-qe-id="form-input-birthday-day" id="birthday_day_' +
__e( data.form_index ) +
'" type="number" name="birthday_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('birthday_aria_label_day') ) +
'">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'anniversary')) { ;
__p += '\n            <div id="anniversary_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-anniversary" id="anniversary_label_' +
__e( data.form_index ) +
'" for="anniversary_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Bryllupsdag</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-anniversary" style="display: none;"></div>\n                <input data-qe-id="form-input-anniversary-month" id="anniversary_month_' +
__e( data.form_index ) +
'" type="number" name="anniversary_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="12" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_month') ) +
'"> / <input data-qe-id="form-input-anniversary-day" id="anniversary_day_' +
__e( data.form_index ) +
'" type="number" name="anniversary_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_day') ) +
'"> / <input data-qe-id="form-input-anniversary-year" id="anniversary_year_' +
__e( data.form_index ) +
'" type="number" name="anniversary_year" value="" placeholder="YYYY" class="ctct-form-element ctct-form-date-field-4" maxlength="4" min="1900" max="' +
__e( data.max_anniversary_year ) +
'" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_year') ) +
'">\n            </div>\n            ';
 } ;
__p += '\n\n        ';
 _.each(data._customFields, function(customField) { ;
__p += '\n            ';
 if(customField.type === 'custom_field_string') { ;
__p += '\n            <div id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_label_' +
__e( data.form_index ) +
'" for="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_' +
__e( data.form_index ) +
'" class="ctct-form-label ctct-form-label ">' +
__e( customField.label ) +
'</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-custom-field-' +
__e( customField.label ) +
'" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_' +
__e( data.form_index ) +
'" type="text" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'" value="" maxlength="255">\n            </div>\n            ';
 } ;
__p += '\n            ';
 if(customField.type === 'custom_field_date') { ;
__p += '\n            <div id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_label_' +
__e( data.form_index ) +
'" for="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">' +
__e( customField.label ) +
'</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-custom-field-' +
__e( customField.label ) +
'" style="display: none;"></div>\n                <input data-qe-id="form-input-custom-field-month-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="12" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_month') ) +
'"> / <input data-qe-id="form-input-custom-field-day-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_day_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_day') ) +
'"> / <input data-qe-id="form-input-custom-field-year-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_year_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_year" value="" placeholder="YYYY" class="ctct-form-element ctct-form-date-field-4" maxlength="4" min="1900" max="9999" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_year') ) +
'">\n            </div>\n            ';
 } ;
__p += '\n        ';
 }); ;
__p += '\n\n            ';
 if (data.list_ids.length > 1) { ;
__p += '\n            <fieldset id="list_memberships_field_' +
__e( data.form_index ) +
'" class="ctct-form-lists">\n                <legend id="list_memberships_label_' +
__e( data.form_index ) +
'" class="ctct-form-required ctct-form-lists-legend">E-postlister</legend>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-list_memberships" style="display: none;"></div>\n                ';
 _.each(data._emailLists, function(emailList, index) { ;
__p += '\n                    <div class="ctct-form-listitem">\n                        <input class="ctct-form-checkbox" data-qe-id="form-input-list-' +
__e( emailList.label ) +
'" id="email_list_' +
__e( index ) +
'_' +
__e( data.form_index ) +
'" type="checkbox" name="emailList" value="' +
__e( emailList.id ) +
'">\n                        <label data-qe-id="form-label-list-' +
__e( emailList.label ) +
'" for="email_list_' +
__e( index ) +
'_' +
__e( data.form_index ) +
'" class="ctct-form-listname ctct-form-checkbox-label">' +
__e( emailList.label ) +
'</label>\n                    </div>\n                ';
 }); ;
__p += '\n            </fieldset>\n            ';
 } ;
__p += '\n\n            <div id="error_message_' +
__e( data.form_index ) +
'" class="ctct-form-error" style="display:none;">\n                <p class="ctct-form-errorMessage">Beklager, vi kunne ikke fullfÃ¸re registreringen. Kontakt oss for Ã¥ fÃ¥ lÃ¸st dette.</p>\n            </div>\n            <div id="network_error_message_' +
__e( data.form_index ) +
'" class="ctct-form-error" style="display:none;">\n                <p class="ctct-form-errorMessage">Operation timed out, please try again.</p>\n            </div>\n\n\n            <button data-qe-id="form-button" type="button" class="ctct-form-button">' +
__e( data.buttonText ) +
'</button>\n\n            ';
 if (data.recaptchaKey) { ;
__p += '\n            <div class="g-recaptcha" id="ctct_recaptcha_' +
__e( data.form_index ) +
'" data-sitekey="' +
__e( data.recaptchaKey ) +
'" data-size="invisible">\n            </div>\n            ';
 } ;
__p += '\n        </form>\n        <p class="ctct-form-footer">\n            ';
 if (!data.hideBranding) { ;
__p += '\n            <span data-qe-id="form-branding">\n                 <a href="http://www.constantcontact.com/index.jsp?cc=forms_inline" rel="nofollow" target="_blank" class="ctct-form-footer-link">Constant Contact</a> |\n            </span>\n            ';
 } ;
__p += '\n            <a href="' +
__e( data._defaults.privacyUrl ) +
'" target="_blank" data-qe-id="form-privacy-link" class="ctct-form-footer-link">Personvern</a>\n        </p>\n    </div>\n</div>\n';
return __p
};

SignUpFormWidget["JST"]["dist/templates/no/popup_form.html"] = function(data) {
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
__p += '<div class="ctct-form-defaults" data-qe-id="form-background">\n    <div id="success_message_' +
__e( data.form_index ) +
'" class="ctct-form-success" style="display:none;" data-qe-id="success-message">\n        <h2 class="ctct-form-header">Takk for at du registrerte deg!</h2>\n        <p class="ctct-form-text">Du kan avslutte abonnementet nÃ¥r som helst ved Ã¥ klikke pÃ¥ linken Avslutt abonnement nederst i hver e-postmelding.</p>\n    </div>\n    <form class="ctct-form-custom" id="ctct_form_' +
__e( data.form_index ) +
'" autocomplete="on" data-qe-id="form-data">\n        ';
 if(!_.isEmpty(data.titleText)) { ;
__p += '\n        <h2 data-qe-id="form-title" class="ctct-form-header">' +
__e( data.titleText ) +
'</h2>\n        ';
 } ;
__p += '\n        ';
 if(!_.isEmpty(data.descriptionText)) { ;
__p += '\n        <p data-qe-id="form-description" class="ctct-form-text">' +
__e( data.descriptionText ) +
'</p>\n        ';
 } ;
__p += '\n\n        <div id="email_address_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-email" id="email_address_label_' +
__e( data.form_index ) +
'" for="email_address_' +
__e( data.form_index ) +
'" class="ctct-form-label ctct-form-required">E-postadresse</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-email" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-email" id="email_address_' +
__e( data.form_index ) +
'" type="email" name="email_address" value="" maxlength="80">\n        </div>\n\n        ';
 if(_.contains(data.contact_fields, 'first_name')) { ;
__p += '\n        <div id="first_name_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-first-name" id="first_name_label_' +
__e( data.form_index ) +
'" for="first_name_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Fornavn</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-first-name" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-first-name" id="first_name_' +
__e( data.form_index ) +
'" type="text" name="first_name" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'last_name')) { ;
__p += '\n        <div id="last_name_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-last-name" id="last_name_label_' +
__e( data.form_index ) +
'" for="last_name_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Etternavn</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-last-name" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-last-name" id="last_name_' +
__e( data.form_index ) +
'" type="text" name="last_name" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'phone')) { ;
__p += '\n        <div id="phone_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-phone" id="phone_label_' +
__e( data.form_index ) +
'" for="phone_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Telefon</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-phone" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-phone" id="phone_' +
__e( data.form_index ) +
'" type="tel" name="phone" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'country')) { ;
__p += '\n        <div id="country_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-country" id="country_label_' +
__e( data.form_index ) +
'" for="country_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Velg land</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-country" style="display: none;"></div>\n            <select class="ctct-select-element" data-qe-id="form-select-country-' +
__e( data.form_index ) +
'" id="country_' +
__e( data.form_index ) +
'" name="country">\n                <option value="">--</option>\n                ';
 _.each(data._defaults.countries, function(country) { ;
__p += '\n                    ';
 if (country.countryCode === data.selectedCountry) { ;
__p += '\n                        <option value="' +
__e( country.countryCode ) +
'" selected>' +
__e( country.display ) +
'</option>\n                    ';
 } else { ;
__p += '\n                        <option value="' +
__e( country.countryCode ) +
'">' +
__e( country.display ) +
'</option>\n                    ';
 } ;
__p += '\n                ';
 }); ;
__p += '\n            </select>\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'street')) { ;
__p += '\n        <div id="street_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-street" id="street_label_' +
__e( data.form_index ) +
'" for="street_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Gateadr</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-street" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-street" id="street_' +
__e( data.form_index ) +
'" type="text" name="street" value="" maxlength="255">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'city')) { ;
__p += '\n        <div id="city_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-city" id="city_label_' +
__e( data.form_index ) +
'" for="city_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Poststed</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-city" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-city" id="city_' +
__e( data.form_index ) +
'" type="text" name="city" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'state')) { ;
__p += '\n        <div id="state_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-state" id="state_label_' +
__e( data.form_index ) +
'" for="state_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Velg delstat/region</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-state" style="display: none;"></div>\n            <input data-qe-id="form-input-state" class="state_' +
__e( data.form_index ) +
' ctct-form-element" id="state_' +
__e( data.form_index ) +
'" type="text" name="state" value="" maxlength="50">\n            <select data-qe-id="form-select-state-' +
__e( data.form_index ) +
'" class="state_' +
__e( data.form_index ) +
' ctct-select-element" id="state_' +
__e( data.form_index ) +
'" style="display: none;" name="state">\n            </select>\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'postal_code')) { ;
__p += '\n        <div id="postal_code_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-postal-code" id="postal_code_label_' +
__e( data.form_index ) +
'" for="postal_code_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Postnummer</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-postal-code" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-postal-code" id="postal_code_' +
__e( data.form_index ) +
'" type="text" name="postal_code" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'company')) { ;
__p += '\n        <div id="company_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-company" id="company_label_' +
__e( data.form_index ) +
'" for="company_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Virksomhet</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-company" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-company" id="company_' +
__e( data.form_index ) +
'" type="text" name="company" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'job_title')) { ;
__p += '\n        <div id="job_title_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-title" id="job_title_label_' +
__e( data.form_index ) +
'" for="job_title_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Stilling</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-job-title" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-title" id="job_title_' +
__e( data.form_index ) +
'" type="text" name="job_title" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'birthday')) { ;
__p += '\n        <div id="birthday_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-birthday" id="birthday_label_' +
__e( data.form_index ) +
'" for="birthday_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">FÃ¸dselsdag</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-birthday" style="display: none;"></div>\n            <input data-qe-id="form-input-birthday-month" id="birthday_month_' +
__e( data.form_index ) +
'" type="number" name="birthday_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" min="1" max="12" maxlength="2" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('birthday_aria_label_month') ) +
'"> / <input data-qe-id="form-input-birthday-day" id="birthday_day_' +
__e( data.form_index ) +
'" type="number" name="birthday_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('birthday_aria_label_day') ) +
'">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'anniversary')) { ;
__p += '\n        <div id="anniversary_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-anniversary" id="anniversary_label_' +
__e( data.form_index ) +
'" for="anniversary_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Bryllupsdag</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-anniversary" style="display: none;"></div>\n            <input data-qe-id="form-input-anniversary-month" id="anniversary_month_' +
__e( data.form_index ) +
'" type="number" name="anniversary_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="12" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_month') ) +
'"> / <input data-qe-id="form-input-anniversary-day" id="anniversary_day_' +
__e( data.form_index ) +
'" type="number" name="anniversary_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_day') ) +
'"> / <input data-qe-id="form-input-anniversary-year" id="anniversary_year_' +
__e( data.form_index ) +
'" type="number" name="anniversary_year" value="" placeholder="YYYY" class="ctct-form-element ctct-form-date-field-4" maxlength="4" min="1900" max="' +
__e( data.max_anniversary_year ) +
'" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_year') ) +
'">\n        </div>\n        ';
 } ;
__p += '\n\n    ';
 _.each(data._customFields, function(customField) { ;
__p += '\n        ';
 if(customField.type === 'custom_field_string') { ;
__p += '\n        <div id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_label_' +
__e( data.form_index ) +
'" for="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_' +
__e( data.form_index ) +
'" class="ctct-form-label ctct-form-label ">' +
__e( customField.label ) +
'</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-custom-field-' +
__e( customField.label ) +
'" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_' +
__e( data.form_index ) +
'" type="text" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'" value="" maxlength="255">\n        </div>\n        ';
 } ;
__p += '\n        ';
 if(customField.type === 'custom_field_date') { ;
__p += '\n        <div id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_label_' +
__e( data.form_index ) +
'" for="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">' +
__e( customField.label ) +
'</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-custom-field-' +
__e( customField.label ) +
'" style="display: none;"></div>\n            <input data-qe-id="form-input-custom-field-month-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="12" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_month') ) +
'"> / <input data-qe-id="form-input-custom-field-day-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_day_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_day') ) +
'"> / <input data-qe-id="form-input-custom-field-year-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_year_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_year" value="" placeholder="YYYY" class="ctct-form-element ctct-form-date-field-4" maxlength="4" min="1900" max="9999" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_year') ) +
'">\n        </div>\n        ';
 } ;
__p += '\n    ';
 }); ;
__p += '\n\n        ';
 if (data.list_ids.length > 1) { ;
__p += '\n        <fieldset id="list_memberships_field_' +
__e( data.form_index ) +
'" class="ctct-form-lists">\n            <legend id="list_memberships_label_' +
__e( data.form_index ) +
'" class="ctct-form-required ctct-form-lists-legend">E-postlister</legend>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-list_memberships" style="display: none;"></div>\n            ';
 _.each(data._emailLists, function(emailList, index) { ;
__p += '\n                <div class="ctct-form-listitem">\n                    <input class="ctct-form-checkbox" data-qe-id="form-input-list-' +
__e( emailList.label ) +
'" id="email_list_' +
__e( index ) +
'_' +
__e( data.form_index ) +
'" type="checkbox" name="emailList" value="' +
__e( emailList.id ) +
'">\n                    <label data-qe-id="form-label-list-' +
__e( emailList.label ) +
'" for="email_list_' +
__e( index ) +
'_' +
__e( data.form_index ) +
'" class="ctct-form-listname ctct-form-checkbox-label">' +
__e( emailList.label ) +
'</label>\n                </div>\n            ';
 }); ;
__p += '\n        </fieldset>\n        ';
 } ;
__p += '\n\n        <div id="error_message_' +
__e( data.form_index ) +
'" class="ctct-form-error" style="display:none;">\n            <p class="ctct-form-errorMessage">Beklager, vi kunne ikke fullfÃ¸re registreringen. Kontakt oss for Ã¥ fÃ¥ lÃ¸st dette.</p>\n        </div>\n        <div id="network_error_message_' +
__e( data.form_index ) +
'" class="ctct-form-error" style="display:none;">\n            <p class="ctct-form-errorMessage">Operation timed out, please try again.</p>\n        </div>\n\n\n        <button data-qe-id="form-button" type="button" class="ctct-form-button">' +
__e( data.buttonText ) +
'</button>\n    </form>\n    <p class="ctct-form-footer">\n        ';
 if(!data.hideBranding) { ;
__p += '\n        <span data-qe-id="form-branding">\n             <a href="http://www.constantcontact.com/index.jsp?cc=forms_popup" rel="nofollow" target="_blank" class="ctct-form-footer-link">Constant Contact</a> |\n        </span>\n        ';
 } ;
__p += '\n        <a href="' +
__e( data._defaults.privacyUrl ) +
'" target="_blank" data-qe-id="form-privacy-link" class="ctct-form-footer-link">Personvern</a>\n    </p>\n</div>\n\n';
return __p
};

SignUpFormWidget["JST"]["dist/templates/no/popup_wrapper.html"] = function(data) {
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
__p += '<div class="ctct-popup-wrapper form_' +
__e( data.form_index ) +
'">\n    <div class="ctct-popup-overlay"></div>\n    <div class="ctct-popup-inner">\n      <div class="ctct-popup-content">\n        <button type="button" class="ctct-popup-close js-popup-close" title="Close">\n            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" class="undefined">\n                <polygon points="14 11 11 14 8 11 5 14 2 11 5 8 2 5 5 2 8 5 11 2 14 5 11 8 " class="undefined"/>\n            </svg>\n        </button>\n        <div class="ctct-form-container ctct-form-popup form_' +
__e( data.form_index ) +
'"></div>\n      </div>\n    </div>\n\n    ';
 if (data.recaptchaKey) { ;
__p += '\n    <div class="g-recaptcha" id="ctct_recaptcha_' +
__e( data.form_index ) +
'" data-sitekey="' +
__e( data.recaptchaKey ) +
'" data-size="invisible"></div>\n    ';
 } ;
__p += '\n</div>\n';
return __p
};

SignUpFormWidget["JST"]["dist/templates/pt/inline_form.html"] = function(data) {
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
__p += '<div class="ctct-form-container ctct-form-embed form_' +
__e( data.form_index ) +
'">\n    <div class="ctct-form-defaults" data-qe-id="form-background">\n        <div id="success_message_' +
__e( data.form_index ) +
'" class="ctct-form-success" style="display:none;" data-qe-id="success-message">\n            <h2 class="ctct-form-header">Obrigado por se inscrever!</h2>\n            <p class="ctct-form-text">VocÃª pode cancelar a sua inscriÃ§Ã£o a qualquer momento pelo link Unsubscribe (Cancelar inscriÃ§Ã£o) encontrado na parte inferior de cada e-mail.</p>\n        </div>\n        <form class="ctct-form-custom" id="ctct_form_' +
__e( data.form_index ) +
'" autocomplete="on" data-qe-id="form-data">\n            ';
 if(!_.isEmpty(data.titleText)) { ;
__p += '\n            <h2 data-qe-id="form-title" class="ctct-form-header">' +
__e( data.titleText ) +
'</h2>\n            ';
 } ;
__p += '\n            ';
 if(!_.isEmpty(data.descriptionText)) { ;
__p += '\n            <p data-qe-id="form-description" class="ctct-form-text">' +
__e( data.descriptionText ) +
'</p>\n            ';
 } ;
__p += '\n\n            <div id="email_address_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-email" id="email_address_label_' +
__e( data.form_index ) +
'" for="email_address_' +
__e( data.form_index ) +
'" class="ctct-form-label ctct-form-required">EndereÃ§o de e-mail</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-email" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-email" id="email_address_' +
__e( data.form_index ) +
'" type="email" name="email_address" value="" maxlength="80">\n            </div>\n\n            ';
 if(_.contains(data.contact_fields, 'first_name')) { ;
__p += '\n            <div id="first_name_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-first-name" id="first_name_label_' +
__e( data.form_index ) +
'" for="first_name_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Nome</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-first-name" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-first-name" id="first_name_' +
__e( data.form_index ) +
'" type="text" name="first_name" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'last_name')) { ;
__p += '\n            <div id="last_name_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-last-name" id="last_name_label_' +
__e( data.form_index ) +
'" for="last_name_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Sobrenome</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-last-name" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-last-name" id="last_name_' +
__e( data.form_index ) +
'" type="text" name="last_name" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'phone')) { ;
__p += '\n            <div id="phone_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-phone" id="phone_label_' +
__e( data.form_index ) +
'" for="phone_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Telefone</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-phone" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-phone" id="phone_' +
__e( data.form_index ) +
'" type="tel" name="phone" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'country')) { ;
__p += '\n            <div id="country_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-country" id="country_label_' +
__e( data.form_index ) +
'" for="country_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Selecione um paÃ­s</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-country" style="display: none;"></div>\n                <select class="ctct-select-element" data-qe-id="form-select-country-' +
__e( data.form_index ) +
'" id="country_' +
__e( data.form_index ) +
'" name="country">\n                    <option value="">--</option>\n                    ';
 _.each(data._defaults.countries, function(country) { ;
__p += '\n                        ';
 if (country.countryCode === data.selectedCountry) { ;
__p += '\n                            <option value="' +
__e( country.countryCode ) +
'" selected>' +
__e( country.display ) +
'</option>\n                        ';
 } else { ;
__p += '\n                            <option value="' +
__e( country.countryCode ) +
'">' +
__e( country.display ) +
'</option>\n                        ';
 } ;
__p += '\n                    ';
 }); ;
__p += '\n                </select>\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'street')) { ;
__p += '\n            <div id="street_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-street" id="street_label_' +
__e( data.form_index ) +
'" for="street_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Rua</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-street" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-street" id="street_' +
__e( data.form_index ) +
'" type="text" name="street" value="" maxlength="255">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'city')) { ;
__p += '\n            <div id="city_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-city" id="city_label_' +
__e( data.form_index ) +
'" for="city_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Cidade</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-city" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-city" id="city_' +
__e( data.form_index ) +
'" type="text" name="city" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'state')) { ;
__p += '\n            <div id="state_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-state" id="state_label_' +
__e( data.form_index ) +
'" for="state_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Selecione um estado/provÃ­ncia</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-state" style="display: none;"></div>\n                <input data-qe-id="form-input-state" class="state_' +
__e( data.form_index ) +
' ctct-form-element" id="state_' +
__e( data.form_index ) +
'" type="text" name="state" value="" maxlength="50">\n                <select data-qe-id="form-select-state-' +
__e( data.form_index ) +
'" class="state_' +
__e( data.form_index ) +
' ctct-select-element" id="state_' +
__e( data.form_index ) +
'" style="display: none;" name="state">\n                </select>\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'postal_code')) { ;
__p += '\n            <div id="postal_code_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-postal-code" id="postal_code_label_' +
__e( data.form_index ) +
'" for="postal_code_' +
__e( data.form_index ) +
'" class="ctct-form-label ">CEP</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-postal-code" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-postal-code" id="postal_code_' +
__e( data.form_index ) +
'" type="text" name="postal_code" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'company')) { ;
__p += '\n            <div id="company_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-company" id="company_label_' +
__e( data.form_index ) +
'" for="company_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Empresa</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-company" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-company" id="company_' +
__e( data.form_index ) +
'" type="text" name="company" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'job_title')) { ;
__p += '\n            <div id="job_title_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-title" id="job_title_label_' +
__e( data.form_index ) +
'" for="job_title_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Cargo</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-job-title" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-title" id="job_title_' +
__e( data.form_index ) +
'" type="text" name="job_title" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'birthday')) { ;
__p += '\n            <div id="birthday_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-birthday" id="birthday_label_' +
__e( data.form_index ) +
'" for="birthday_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Data de nascimento</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-birthday" style="display: none;"></div>\n                <input data-qe-id="form-input-birthday-month" id="birthday_month_' +
__e( data.form_index ) +
'" type="number" name="birthday_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" min="1" max="12" maxlength="2" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('birthday_aria_label_month') ) +
'"> / <input data-qe-id="form-input-birthday-day" id="birthday_day_' +
__e( data.form_index ) +
'" type="number" name="birthday_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('birthday_aria_label_day') ) +
'">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'anniversary')) { ;
__p += '\n            <div id="anniversary_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-anniversary" id="anniversary_label_' +
__e( data.form_index ) +
'" for="anniversary_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">AniversÃ¡rio</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-anniversary" style="display: none;"></div>\n                <input data-qe-id="form-input-anniversary-month" id="anniversary_month_' +
__e( data.form_index ) +
'" type="number" name="anniversary_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="12" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_month') ) +
'"> / <input data-qe-id="form-input-anniversary-day" id="anniversary_day_' +
__e( data.form_index ) +
'" type="number" name="anniversary_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_day') ) +
'"> / <input data-qe-id="form-input-anniversary-year" id="anniversary_year_' +
__e( data.form_index ) +
'" type="number" name="anniversary_year" value="" placeholder="YYYY" class="ctct-form-element ctct-form-date-field-4" maxlength="4" min="1900" max="' +
__e( data.max_anniversary_year ) +
'" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_year') ) +
'">\n            </div>\n            ';
 } ;
__p += '\n\n        ';
 _.each(data._customFields, function(customField) { ;
__p += '\n            ';
 if(customField.type === 'custom_field_string') { ;
__p += '\n            <div id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_label_' +
__e( data.form_index ) +
'" for="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_' +
__e( data.form_index ) +
'" class="ctct-form-label ctct-form-label ">' +
__e( customField.label ) +
'</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-custom-field-' +
__e( customField.label ) +
'" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_' +
__e( data.form_index ) +
'" type="text" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'" value="" maxlength="255">\n            </div>\n            ';
 } ;
__p += '\n            ';
 if(customField.type === 'custom_field_date') { ;
__p += '\n            <div id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_label_' +
__e( data.form_index ) +
'" for="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">' +
__e( customField.label ) +
'</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-custom-field-' +
__e( customField.label ) +
'" style="display: none;"></div>\n                <input data-qe-id="form-input-custom-field-month-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="12" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_month') ) +
'"> / <input data-qe-id="form-input-custom-field-day-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_day_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_day') ) +
'"> / <input data-qe-id="form-input-custom-field-year-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_year_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_year" value="" placeholder="YYYY" class="ctct-form-element ctct-form-date-field-4" maxlength="4" min="1900" max="9999" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_year') ) +
'">\n            </div>\n            ';
 } ;
__p += '\n        ';
 }); ;
__p += '\n\n            ';
 if (data.list_ids.length > 1) { ;
__p += '\n            <fieldset id="list_memberships_field_' +
__e( data.form_index ) +
'" class="ctct-form-lists">\n                <legend id="list_memberships_label_' +
__e( data.form_index ) +
'" class="ctct-form-required ctct-form-lists-legend">Listas de e-mail</legend>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-list_memberships" style="display: none;"></div>\n                ';
 _.each(data._emailLists, function(emailList, index) { ;
__p += '\n                    <div class="ctct-form-listitem">\n                        <input class="ctct-form-checkbox" data-qe-id="form-input-list-' +
__e( emailList.label ) +
'" id="email_list_' +
__e( index ) +
'_' +
__e( data.form_index ) +
'" type="checkbox" name="emailList" value="' +
__e( emailList.id ) +
'">\n                        <label data-qe-id="form-label-list-' +
__e( emailList.label ) +
'" for="email_list_' +
__e( index ) +
'_' +
__e( data.form_index ) +
'" class="ctct-form-listname ctct-form-checkbox-label">' +
__e( emailList.label ) +
'</label>\n                    </div>\n                ';
 }); ;
__p += '\n            </fieldset>\n            ';
 } ;
__p += '\n\n            <div id="error_message_' +
__e( data.form_index ) +
'" class="ctct-form-error" style="display:none;">\n                <p class="ctct-form-errorMessage">Desculpe, nÃ£o foi possÃ­vel concluir sua inscriÃ§Ã£o. Entre em contato conosco para resolver esse problema.</p>\n            </div>\n            <div id="network_error_message_' +
__e( data.form_index ) +
'" class="ctct-form-error" style="display:none;">\n                <p class="ctct-form-errorMessage">Operation timed out, please try again.</p>\n            </div>\n\n\n            <button data-qe-id="form-button" type="button" class="ctct-form-button">' +
__e( data.buttonText ) +
'</button>\n\n            ';
 if (data.recaptchaKey) { ;
__p += '\n            <div class="g-recaptcha" id="ctct_recaptcha_' +
__e( data.form_index ) +
'" data-sitekey="' +
__e( data.recaptchaKey ) +
'" data-size="invisible">\n            </div>\n            ';
 } ;
__p += '\n        </form>\n        <p class="ctct-form-footer">\n            ';
 if (!data.hideBranding) { ;
__p += '\n            <span data-qe-id="form-branding">\n                 <a href="http://www.constantcontact.com/index.jsp?cc=forms_inline" rel="nofollow" target="_blank" class="ctct-form-footer-link">Constant Contact</a> |\n            </span>\n            ';
 } ;
__p += '\n            <a href="' +
__e( data._defaults.privacyUrl ) +
'" target="_blank" data-qe-id="form-privacy-link" class="ctct-form-footer-link">Privacidade</a>\n        </p>\n    </div>\n</div>\n';
return __p
};

SignUpFormWidget["JST"]["dist/templates/pt/popup_form.html"] = function(data) {
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
__p += '<div class="ctct-form-defaults" data-qe-id="form-background">\n    <div id="success_message_' +
__e( data.form_index ) +
'" class="ctct-form-success" style="display:none;" data-qe-id="success-message">\n        <h2 class="ctct-form-header">Obrigado por se inscrever!</h2>\n        <p class="ctct-form-text">VocÃª pode cancelar a sua inscriÃ§Ã£o a qualquer momento pelo link Unsubscribe (Cancelar inscriÃ§Ã£o) encontrado na parte inferior de cada e-mail.</p>\n    </div>\n    <form class="ctct-form-custom" id="ctct_form_' +
__e( data.form_index ) +
'" autocomplete="on" data-qe-id="form-data">\n        ';
 if(!_.isEmpty(data.titleText)) { ;
__p += '\n        <h2 data-qe-id="form-title" class="ctct-form-header">' +
__e( data.titleText ) +
'</h2>\n        ';
 } ;
__p += '\n        ';
 if(!_.isEmpty(data.descriptionText)) { ;
__p += '\n        <p data-qe-id="form-description" class="ctct-form-text">' +
__e( data.descriptionText ) +
'</p>\n        ';
 } ;
__p += '\n\n        <div id="email_address_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-email" id="email_address_label_' +
__e( data.form_index ) +
'" for="email_address_' +
__e( data.form_index ) +
'" class="ctct-form-label ctct-form-required">EndereÃ§o de e-mail</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-email" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-email" id="email_address_' +
__e( data.form_index ) +
'" type="email" name="email_address" value="" maxlength="80">\n        </div>\n\n        ';
 if(_.contains(data.contact_fields, 'first_name')) { ;
__p += '\n        <div id="first_name_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-first-name" id="first_name_label_' +
__e( data.form_index ) +
'" for="first_name_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Nome</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-first-name" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-first-name" id="first_name_' +
__e( data.form_index ) +
'" type="text" name="first_name" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'last_name')) { ;
__p += '\n        <div id="last_name_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-last-name" id="last_name_label_' +
__e( data.form_index ) +
'" for="last_name_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Sobrenome</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-last-name" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-last-name" id="last_name_' +
__e( data.form_index ) +
'" type="text" name="last_name" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'phone')) { ;
__p += '\n        <div id="phone_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-phone" id="phone_label_' +
__e( data.form_index ) +
'" for="phone_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Telefone</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-phone" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-phone" id="phone_' +
__e( data.form_index ) +
'" type="tel" name="phone" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'country')) { ;
__p += '\n        <div id="country_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-country" id="country_label_' +
__e( data.form_index ) +
'" for="country_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Selecione um paÃ­s</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-country" style="display: none;"></div>\n            <select class="ctct-select-element" data-qe-id="form-select-country-' +
__e( data.form_index ) +
'" id="country_' +
__e( data.form_index ) +
'" name="country">\n                <option value="">--</option>\n                ';
 _.each(data._defaults.countries, function(country) { ;
__p += '\n                    ';
 if (country.countryCode === data.selectedCountry) { ;
__p += '\n                        <option value="' +
__e( country.countryCode ) +
'" selected>' +
__e( country.display ) +
'</option>\n                    ';
 } else { ;
__p += '\n                        <option value="' +
__e( country.countryCode ) +
'">' +
__e( country.display ) +
'</option>\n                    ';
 } ;
__p += '\n                ';
 }); ;
__p += '\n            </select>\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'street')) { ;
__p += '\n        <div id="street_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-street" id="street_label_' +
__e( data.form_index ) +
'" for="street_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Rua</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-street" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-street" id="street_' +
__e( data.form_index ) +
'" type="text" name="street" value="" maxlength="255">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'city')) { ;
__p += '\n        <div id="city_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-city" id="city_label_' +
__e( data.form_index ) +
'" for="city_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Cidade</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-city" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-city" id="city_' +
__e( data.form_index ) +
'" type="text" name="city" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'state')) { ;
__p += '\n        <div id="state_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-state" id="state_label_' +
__e( data.form_index ) +
'" for="state_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Selecione um estado/provÃ­ncia</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-state" style="display: none;"></div>\n            <input data-qe-id="form-input-state" class="state_' +
__e( data.form_index ) +
' ctct-form-element" id="state_' +
__e( data.form_index ) +
'" type="text" name="state" value="" maxlength="50">\n            <select data-qe-id="form-select-state-' +
__e( data.form_index ) +
'" class="state_' +
__e( data.form_index ) +
' ctct-select-element" id="state_' +
__e( data.form_index ) +
'" style="display: none;" name="state">\n            </select>\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'postal_code')) { ;
__p += '\n        <div id="postal_code_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-postal-code" id="postal_code_label_' +
__e( data.form_index ) +
'" for="postal_code_' +
__e( data.form_index ) +
'" class="ctct-form-label ">CEP</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-postal-code" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-postal-code" id="postal_code_' +
__e( data.form_index ) +
'" type="text" name="postal_code" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'company')) { ;
__p += '\n        <div id="company_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-company" id="company_label_' +
__e( data.form_index ) +
'" for="company_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Empresa</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-company" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-company" id="company_' +
__e( data.form_index ) +
'" type="text" name="company" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'job_title')) { ;
__p += '\n        <div id="job_title_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-title" id="job_title_label_' +
__e( data.form_index ) +
'" for="job_title_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Cargo</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-job-title" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-title" id="job_title_' +
__e( data.form_index ) +
'" type="text" name="job_title" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'birthday')) { ;
__p += '\n        <div id="birthday_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-birthday" id="birthday_label_' +
__e( data.form_index ) +
'" for="birthday_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Data de nascimento</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-birthday" style="display: none;"></div>\n            <input data-qe-id="form-input-birthday-month" id="birthday_month_' +
__e( data.form_index ) +
'" type="number" name="birthday_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" min="1" max="12" maxlength="2" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('birthday_aria_label_month') ) +
'"> / <input data-qe-id="form-input-birthday-day" id="birthday_day_' +
__e( data.form_index ) +
'" type="number" name="birthday_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('birthday_aria_label_day') ) +
'">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'anniversary')) { ;
__p += '\n        <div id="anniversary_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-anniversary" id="anniversary_label_' +
__e( data.form_index ) +
'" for="anniversary_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">AniversÃ¡rio</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-anniversary" style="display: none;"></div>\n            <input data-qe-id="form-input-anniversary-month" id="anniversary_month_' +
__e( data.form_index ) +
'" type="number" name="anniversary_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="12" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_month') ) +
'"> / <input data-qe-id="form-input-anniversary-day" id="anniversary_day_' +
__e( data.form_index ) +
'" type="number" name="anniversary_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_day') ) +
'"> / <input data-qe-id="form-input-anniversary-year" id="anniversary_year_' +
__e( data.form_index ) +
'" type="number" name="anniversary_year" value="" placeholder="YYYY" class="ctct-form-element ctct-form-date-field-4" maxlength="4" min="1900" max="' +
__e( data.max_anniversary_year ) +
'" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_year') ) +
'">\n        </div>\n        ';
 } ;
__p += '\n\n    ';
 _.each(data._customFields, function(customField) { ;
__p += '\n        ';
 if(customField.type === 'custom_field_string') { ;
__p += '\n        <div id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_label_' +
__e( data.form_index ) +
'" for="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_' +
__e( data.form_index ) +
'" class="ctct-form-label ctct-form-label ">' +
__e( customField.label ) +
'</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-custom-field-' +
__e( customField.label ) +
'" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_' +
__e( data.form_index ) +
'" type="text" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'" value="" maxlength="255">\n        </div>\n        ';
 } ;
__p += '\n        ';
 if(customField.type === 'custom_field_date') { ;
__p += '\n        <div id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_label_' +
__e( data.form_index ) +
'" for="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">' +
__e( customField.label ) +
'</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-custom-field-' +
__e( customField.label ) +
'" style="display: none;"></div>\n            <input data-qe-id="form-input-custom-field-month-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="12" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_month') ) +
'"> / <input data-qe-id="form-input-custom-field-day-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_day_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_day') ) +
'"> / <input data-qe-id="form-input-custom-field-year-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_year_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_year" value="" placeholder="YYYY" class="ctct-form-element ctct-form-date-field-4" maxlength="4" min="1900" max="9999" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_year') ) +
'">\n        </div>\n        ';
 } ;
__p += '\n    ';
 }); ;
__p += '\n\n        ';
 if (data.list_ids.length > 1) { ;
__p += '\n        <fieldset id="list_memberships_field_' +
__e( data.form_index ) +
'" class="ctct-form-lists">\n            <legend id="list_memberships_label_' +
__e( data.form_index ) +
'" class="ctct-form-required ctct-form-lists-legend">Listas de e-mail</legend>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-list_memberships" style="display: none;"></div>\n            ';
 _.each(data._emailLists, function(emailList, index) { ;
__p += '\n                <div class="ctct-form-listitem">\n                    <input class="ctct-form-checkbox" data-qe-id="form-input-list-' +
__e( emailList.label ) +
'" id="email_list_' +
__e( index ) +
'_' +
__e( data.form_index ) +
'" type="checkbox" name="emailList" value="' +
__e( emailList.id ) +
'">\n                    <label data-qe-id="form-label-list-' +
__e( emailList.label ) +
'" for="email_list_' +
__e( index ) +
'_' +
__e( data.form_index ) +
'" class="ctct-form-listname ctct-form-checkbox-label">' +
__e( emailList.label ) +
'</label>\n                </div>\n            ';
 }); ;
__p += '\n        </fieldset>\n        ';
 } ;
__p += '\n\n        <div id="error_message_' +
__e( data.form_index ) +
'" class="ctct-form-error" style="display:none;">\n            <p class="ctct-form-errorMessage">Desculpe, nÃ£o foi possÃ­vel concluir sua inscriÃ§Ã£o. Entre em contato conosco para resolver esse problema.</p>\n        </div>\n        <div id="network_error_message_' +
__e( data.form_index ) +
'" class="ctct-form-error" style="display:none;">\n            <p class="ctct-form-errorMessage">Operation timed out, please try again.</p>\n        </div>\n\n\n        <button data-qe-id="form-button" type="button" class="ctct-form-button">' +
__e( data.buttonText ) +
'</button>\n    </form>\n    <p class="ctct-form-footer">\n        ';
 if(!data.hideBranding) { ;
__p += '\n        <span data-qe-id="form-branding">\n             <a href="http://www.constantcontact.com/index.jsp?cc=forms_popup" rel="nofollow" target="_blank" class="ctct-form-footer-link">Constant Contact</a> |\n        </span>\n        ';
 } ;
__p += '\n        <a href="' +
__e( data._defaults.privacyUrl ) +
'" target="_blank" data-qe-id="form-privacy-link" class="ctct-form-footer-link">Privacidade</a>\n    </p>\n</div>\n\n';
return __p
};

SignUpFormWidget["JST"]["dist/templates/pt/popup_wrapper.html"] = function(data) {
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
__p += '<div class="ctct-popup-wrapper form_' +
__e( data.form_index ) +
'">\n    <div class="ctct-popup-overlay"></div>\n    <div class="ctct-popup-inner">\n      <div class="ctct-popup-content">\n        <button type="button" class="ctct-popup-close js-popup-close" title="Close">\n            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" class="undefined">\n                <polygon points="14 11 11 14 8 11 5 14 2 11 5 8 2 5 5 2 8 5 11 2 14 5 11 8 " class="undefined"/>\n            </svg>\n        </button>\n        <div class="ctct-form-container ctct-form-popup form_' +
__e( data.form_index ) +
'"></div>\n      </div>\n    </div>\n\n    ';
 if (data.recaptchaKey) { ;
__p += '\n    <div class="g-recaptcha" id="ctct_recaptcha_' +
__e( data.form_index ) +
'" data-sitekey="' +
__e( data.recaptchaKey ) +
'" data-size="invisible"></div>\n    ';
 } ;
__p += '\n</div>\n';
return __p
};

SignUpFormWidget["JST"]["dist/templates/sv/inline_form.html"] = function(data) {
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
__p += '<div class="ctct-form-container ctct-form-embed form_' +
__e( data.form_index ) +
'">\n    <div class="ctct-form-defaults" data-qe-id="form-background">\n        <div id="success_message_' +
__e( data.form_index ) +
'" class="ctct-form-success" style="display:none;" data-qe-id="success-message">\n            <h2 class="ctct-form-header">Tack fÃ¶r att du anmÃ¤ler dig!</h2>\n            <p class="ctct-form-text">Du kan avregistrera dig nÃ¤r som helst med hjÃ¤lp av avregistrera-lÃ¤nken lÃ¤ngst ned i varje e-postmeddelande.</p>\n        </div>\n        <form class="ctct-form-custom" id="ctct_form_' +
__e( data.form_index ) +
'" autocomplete="on" data-qe-id="form-data">\n            ';
 if(!_.isEmpty(data.titleText)) { ;
__p += '\n            <h2 data-qe-id="form-title" class="ctct-form-header">' +
__e( data.titleText ) +
'</h2>\n            ';
 } ;
__p += '\n            ';
 if(!_.isEmpty(data.descriptionText)) { ;
__p += '\n            <p data-qe-id="form-description" class="ctct-form-text">' +
__e( data.descriptionText ) +
'</p>\n            ';
 } ;
__p += '\n\n            <div id="email_address_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-email" id="email_address_label_' +
__e( data.form_index ) +
'" for="email_address_' +
__e( data.form_index ) +
'" class="ctct-form-label ctct-form-required">E-postadress</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-email" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-email" id="email_address_' +
__e( data.form_index ) +
'" type="email" name="email_address" value="" maxlength="80">\n            </div>\n\n            ';
 if(_.contains(data.contact_fields, 'first_name')) { ;
__p += '\n            <div id="first_name_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-first-name" id="first_name_label_' +
__e( data.form_index ) +
'" for="first_name_' +
__e( data.form_index ) +
'" class="ctct-form-label ">FÃ¶rnamn</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-first-name" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-first-name" id="first_name_' +
__e( data.form_index ) +
'" type="text" name="first_name" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'last_name')) { ;
__p += '\n            <div id="last_name_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-last-name" id="last_name_label_' +
__e( data.form_index ) +
'" for="last_name_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Efternamn</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-last-name" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-last-name" id="last_name_' +
__e( data.form_index ) +
'" type="text" name="last_name" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'phone')) { ;
__p += '\n            <div id="phone_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-phone" id="phone_label_' +
__e( data.form_index ) +
'" for="phone_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Telefonnummer</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-phone" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-phone" id="phone_' +
__e( data.form_index ) +
'" type="tel" name="phone" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'country')) { ;
__p += '\n            <div id="country_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-country" id="country_label_' +
__e( data.form_index ) +
'" for="country_' +
__e( data.form_index ) +
'" class="ctct-form-label ">VÃ¤lj ett land</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-country" style="display: none;"></div>\n                <select class="ctct-select-element" data-qe-id="form-select-country-' +
__e( data.form_index ) +
'" id="country_' +
__e( data.form_index ) +
'" name="country">\n                    <option value="">--</option>\n                    ';
 _.each(data._defaults.countries, function(country) { ;
__p += '\n                        ';
 if (country.countryCode === data.selectedCountry) { ;
__p += '\n                            <option value="' +
__e( country.countryCode ) +
'" selected>' +
__e( country.display ) +
'</option>\n                        ';
 } else { ;
__p += '\n                            <option value="' +
__e( country.countryCode ) +
'">' +
__e( country.display ) +
'</option>\n                        ';
 } ;
__p += '\n                    ';
 }); ;
__p += '\n                </select>\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'street')) { ;
__p += '\n            <div id="street_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-street" id="street_label_' +
__e( data.form_index ) +
'" for="street_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Gata</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-street" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-street" id="street_' +
__e( data.form_index ) +
'" type="text" name="street" value="" maxlength="255">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'city')) { ;
__p += '\n            <div id="city_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-city" id="city_label_' +
__e( data.form_index ) +
'" for="city_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Ort</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-city" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-city" id="city_' +
__e( data.form_index ) +
'" type="text" name="city" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'state')) { ;
__p += '\n            <div id="state_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-state" id="state_label_' +
__e( data.form_index ) +
'" for="state_' +
__e( data.form_index ) +
'" class="ctct-form-label ">VÃ¤lj ett lÃ¤n</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-state" style="display: none;"></div>\n                <input data-qe-id="form-input-state" class="state_' +
__e( data.form_index ) +
' ctct-form-element" id="state_' +
__e( data.form_index ) +
'" type="text" name="state" value="" maxlength="50">\n                <select data-qe-id="form-select-state-' +
__e( data.form_index ) +
'" class="state_' +
__e( data.form_index ) +
' ctct-select-element" id="state_' +
__e( data.form_index ) +
'" style="display: none;" name="state">\n                </select>\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'postal_code')) { ;
__p += '\n            <div id="postal_code_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-postal-code" id="postal_code_label_' +
__e( data.form_index ) +
'" for="postal_code_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Postnummer</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-postal-code" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-postal-code" id="postal_code_' +
__e( data.form_index ) +
'" type="text" name="postal_code" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'company')) { ;
__p += '\n            <div id="company_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-company" id="company_label_' +
__e( data.form_index ) +
'" for="company_' +
__e( data.form_index ) +
'" class="ctct-form-label ">FÃ¶retag</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-company" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-company" id="company_' +
__e( data.form_index ) +
'" type="text" name="company" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'job_title')) { ;
__p += '\n            <div id="job_title_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-title" id="job_title_label_' +
__e( data.form_index ) +
'" for="job_title_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Befattning</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-job-title" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-title" id="job_title_' +
__e( data.form_index ) +
'" type="text" name="job_title" value="" maxlength="50">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'birthday')) { ;
__p += '\n            <div id="birthday_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-birthday" id="birthday_label_' +
__e( data.form_index ) +
'" for="birthday_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">FÃ¶delsedag</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-birthday" style="display: none;"></div>\n                <input data-qe-id="form-input-birthday-month" id="birthday_month_' +
__e( data.form_index ) +
'" type="number" name="birthday_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" min="1" max="12" maxlength="2" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('birthday_aria_label_month') ) +
'"> / <input data-qe-id="form-input-birthday-day" id="birthday_day_' +
__e( data.form_index ) +
'" type="number" name="birthday_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('birthday_aria_label_day') ) +
'">\n            </div>\n            ';
 } ;
__p += '\n\n            ';
 if(_.contains(data.contact_fields, 'anniversary')) { ;
__p += '\n            <div id="anniversary_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-anniversary" id="anniversary_label_' +
__e( data.form_index ) +
'" for="anniversary_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Ã…rsdag</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-anniversary" style="display: none;"></div>\n                <input data-qe-id="form-input-anniversary-month" id="anniversary_month_' +
__e( data.form_index ) +
'" type="number" name="anniversary_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="12" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_month') ) +
'"> / <input data-qe-id="form-input-anniversary-day" id="anniversary_day_' +
__e( data.form_index ) +
'" type="number" name="anniversary_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_day') ) +
'"> / <input data-qe-id="form-input-anniversary-year" id="anniversary_year_' +
__e( data.form_index ) +
'" type="number" name="anniversary_year" value="" placeholder="YYYY" class="ctct-form-element ctct-form-date-field-4" maxlength="4" min="1900" max="' +
__e( data.max_anniversary_year ) +
'" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_year') ) +
'">\n            </div>\n            ';
 } ;
__p += '\n\n        ';
 _.each(data._customFields, function(customField) { ;
__p += '\n            ';
 if(customField.type === 'custom_field_string') { ;
__p += '\n            <div id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_label_' +
__e( data.form_index ) +
'" for="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_' +
__e( data.form_index ) +
'" class="ctct-form-label ctct-form-label ">' +
__e( customField.label ) +
'</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-custom-field-' +
__e( customField.label ) +
'" style="display: none;"></div>\n                <input class="ctct-form-element" data-qe-id="form-input-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_' +
__e( data.form_index ) +
'" type="text" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'" value="" maxlength="255">\n            </div>\n            ';
 } ;
__p += '\n            ';
 if(customField.type === 'custom_field_date') { ;
__p += '\n            <div id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n                <label data-qe-id="form-label-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_label_' +
__e( data.form_index ) +
'" for="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">' +
__e( customField.label ) +
'</label>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-custom-field-' +
__e( customField.label ) +
'" style="display: none;"></div>\n                <input data-qe-id="form-input-custom-field-month-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="12" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_month') ) +
'"> / <input data-qe-id="form-input-custom-field-day-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_day_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_day') ) +
'"> / <input data-qe-id="form-input-custom-field-year-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_year_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_year" value="" placeholder="YYYY" class="ctct-form-element ctct-form-date-field-4" maxlength="4" min="1900" max="9999" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_year') ) +
'">\n            </div>\n            ';
 } ;
__p += '\n        ';
 }); ;
__p += '\n\n            ';
 if (data.list_ids.length > 1) { ;
__p += '\n            <fieldset id="list_memberships_field_' +
__e( data.form_index ) +
'" class="ctct-form-lists">\n                <legend id="list_memberships_label_' +
__e( data.form_index ) +
'" class="ctct-form-required ctct-form-lists-legend">E-postlistor</legend>\n                <div class="ctct-form-errorMessage" data-qe-id="form-error-list_memberships" style="display: none;"></div>\n                ';
 _.each(data._emailLists, function(emailList, index) { ;
__p += '\n                    <div class="ctct-form-listitem">\n                        <input class="ctct-form-checkbox" data-qe-id="form-input-list-' +
__e( emailList.label ) +
'" id="email_list_' +
__e( index ) +
'_' +
__e( data.form_index ) +
'" type="checkbox" name="emailList" value="' +
__e( emailList.id ) +
'">\n                        <label data-qe-id="form-label-list-' +
__e( emailList.label ) +
'" for="email_list_' +
__e( index ) +
'_' +
__e( data.form_index ) +
'" class="ctct-form-listname ctct-form-checkbox-label">' +
__e( emailList.label ) +
'</label>\n                    </div>\n                ';
 }); ;
__p += '\n            </fieldset>\n            ';
 } ;
__p += '\n\n            <div id="error_message_' +
__e( data.form_index ) +
'" class="ctct-form-error" style="display:none;">\n                <p class="ctct-form-errorMessage">Vi kunde tyvÃ¤rr inte fullfÃ¶lja registreringen av din anmÃ¤lan. Kontakta oss fÃ¶r att lÃ¶sa detta.</p>\n            </div>\n            <div id="network_error_message_' +
__e( data.form_index ) +
'" class="ctct-form-error" style="display:none;">\n                <p class="ctct-form-errorMessage">Operation timed out, please try again.</p>\n            </div>\n\n\n            <button data-qe-id="form-button" type="button" class="ctct-form-button">' +
__e( data.buttonText ) +
'</button>\n\n            ';
 if (data.recaptchaKey) { ;
__p += '\n            <div class="g-recaptcha" id="ctct_recaptcha_' +
__e( data.form_index ) +
'" data-sitekey="' +
__e( data.recaptchaKey ) +
'" data-size="invisible">\n            </div>\n            ';
 } ;
__p += '\n        </form>\n        <p class="ctct-form-footer">\n            ';
 if (!data.hideBranding) { ;
__p += '\n            <span data-qe-id="form-branding">\n                 <a href="http://www.constantcontact.com/index.jsp?cc=forms_inline" rel="nofollow" target="_blank" class="ctct-form-footer-link">Constant Contact</a> |\n            </span>\n            ';
 } ;
__p += '\n            <a href="' +
__e( data._defaults.privacyUrl ) +
'" target="_blank" data-qe-id="form-privacy-link" class="ctct-form-footer-link">Sekretess</a>\n        </p>\n    </div>\n</div>\n';
return __p
};

SignUpFormWidget["JST"]["dist/templates/sv/popup_form.html"] = function(data) {
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
__p += '<div class="ctct-form-defaults" data-qe-id="form-background">\n    <div id="success_message_' +
__e( data.form_index ) +
'" class="ctct-form-success" style="display:none;" data-qe-id="success-message">\n        <h2 class="ctct-form-header">Tack fÃ¶r att du anmÃ¤ler dig!</h2>\n        <p class="ctct-form-text">Du kan avregistrera dig nÃ¤r som helst med hjÃ¤lp av avregistrera-lÃ¤nken lÃ¤ngst ned i varje e-postmeddelande.</p>\n    </div>\n    <form class="ctct-form-custom" id="ctct_form_' +
__e( data.form_index ) +
'" autocomplete="on" data-qe-id="form-data">\n        ';
 if(!_.isEmpty(data.titleText)) { ;
__p += '\n        <h2 data-qe-id="form-title" class="ctct-form-header">' +
__e( data.titleText ) +
'</h2>\n        ';
 } ;
__p += '\n        ';
 if(!_.isEmpty(data.descriptionText)) { ;
__p += '\n        <p data-qe-id="form-description" class="ctct-form-text">' +
__e( data.descriptionText ) +
'</p>\n        ';
 } ;
__p += '\n\n        <div id="email_address_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-email" id="email_address_label_' +
__e( data.form_index ) +
'" for="email_address_' +
__e( data.form_index ) +
'" class="ctct-form-label ctct-form-required">E-postadress</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-email" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-email" id="email_address_' +
__e( data.form_index ) +
'" type="email" name="email_address" value="" maxlength="80">\n        </div>\n\n        ';
 if(_.contains(data.contact_fields, 'first_name')) { ;
__p += '\n        <div id="first_name_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-first-name" id="first_name_label_' +
__e( data.form_index ) +
'" for="first_name_' +
__e( data.form_index ) +
'" class="ctct-form-label ">FÃ¶rnamn</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-first-name" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-first-name" id="first_name_' +
__e( data.form_index ) +
'" type="text" name="first_name" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'last_name')) { ;
__p += '\n        <div id="last_name_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-last-name" id="last_name_label_' +
__e( data.form_index ) +
'" for="last_name_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Efternamn</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-last-name" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-last-name" id="last_name_' +
__e( data.form_index ) +
'" type="text" name="last_name" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'phone')) { ;
__p += '\n        <div id="phone_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-phone" id="phone_label_' +
__e( data.form_index ) +
'" for="phone_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Telefonnummer</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-phone" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-phone" id="phone_' +
__e( data.form_index ) +
'" type="tel" name="phone" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'country')) { ;
__p += '\n        <div id="country_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-country" id="country_label_' +
__e( data.form_index ) +
'" for="country_' +
__e( data.form_index ) +
'" class="ctct-form-label ">VÃ¤lj ett land</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-country" style="display: none;"></div>\n            <select class="ctct-select-element" data-qe-id="form-select-country-' +
__e( data.form_index ) +
'" id="country_' +
__e( data.form_index ) +
'" name="country">\n                <option value="">--</option>\n                ';
 _.each(data._defaults.countries, function(country) { ;
__p += '\n                    ';
 if (country.countryCode === data.selectedCountry) { ;
__p += '\n                        <option value="' +
__e( country.countryCode ) +
'" selected>' +
__e( country.display ) +
'</option>\n                    ';
 } else { ;
__p += '\n                        <option value="' +
__e( country.countryCode ) +
'">' +
__e( country.display ) +
'</option>\n                    ';
 } ;
__p += '\n                ';
 }); ;
__p += '\n            </select>\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'street')) { ;
__p += '\n        <div id="street_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-street" id="street_label_' +
__e( data.form_index ) +
'" for="street_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Gata</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-street" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-street" id="street_' +
__e( data.form_index ) +
'" type="text" name="street" value="" maxlength="255">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'city')) { ;
__p += '\n        <div id="city_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-city" id="city_label_' +
__e( data.form_index ) +
'" for="city_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Ort</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-city" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-city" id="city_' +
__e( data.form_index ) +
'" type="text" name="city" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'state')) { ;
__p += '\n        <div id="state_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-state" id="state_label_' +
__e( data.form_index ) +
'" for="state_' +
__e( data.form_index ) +
'" class="ctct-form-label ">VÃ¤lj ett lÃ¤n</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-state" style="display: none;"></div>\n            <input data-qe-id="form-input-state" class="state_' +
__e( data.form_index ) +
' ctct-form-element" id="state_' +
__e( data.form_index ) +
'" type="text" name="state" value="" maxlength="50">\n            <select data-qe-id="form-select-state-' +
__e( data.form_index ) +
'" class="state_' +
__e( data.form_index ) +
' ctct-select-element" id="state_' +
__e( data.form_index ) +
'" style="display: none;" name="state">\n            </select>\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'postal_code')) { ;
__p += '\n        <div id="postal_code_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-postal-code" id="postal_code_label_' +
__e( data.form_index ) +
'" for="postal_code_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Postnummer</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-postal-code" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-postal-code" id="postal_code_' +
__e( data.form_index ) +
'" type="text" name="postal_code" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'company')) { ;
__p += '\n        <div id="company_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-company" id="company_label_' +
__e( data.form_index ) +
'" for="company_' +
__e( data.form_index ) +
'" class="ctct-form-label ">FÃ¶retag</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-company" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-company" id="company_' +
__e( data.form_index ) +
'" type="text" name="company" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'job_title')) { ;
__p += '\n        <div id="job_title_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-title" id="job_title_label_' +
__e( data.form_index ) +
'" for="job_title_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Befattning</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-job-title" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-title" id="job_title_' +
__e( data.form_index ) +
'" type="text" name="job_title" value="" maxlength="50">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'birthday')) { ;
__p += '\n        <div id="birthday_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-birthday" id="birthday_label_' +
__e( data.form_index ) +
'" for="birthday_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">FÃ¶delsedag</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-birthday" style="display: none;"></div>\n            <input data-qe-id="form-input-birthday-month" id="birthday_month_' +
__e( data.form_index ) +
'" type="number" name="birthday_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" min="1" max="12" maxlength="2" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('birthday_aria_label_month') ) +
'"> / <input data-qe-id="form-input-birthday-day" id="birthday_day_' +
__e( data.form_index ) +
'" type="number" name="birthday_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('birthday_aria_label_day') ) +
'">\n        </div>\n        ';
 } ;
__p += '\n\n        ';
 if(_.contains(data.contact_fields, 'anniversary')) { ;
__p += '\n        <div id="anniversary_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-anniversary" id="anniversary_label_' +
__e( data.form_index ) +
'" for="anniversary_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">Ã…rsdag</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-anniversary" style="display: none;"></div>\n            <input data-qe-id="form-input-anniversary-month" id="anniversary_month_' +
__e( data.form_index ) +
'" type="number" name="anniversary_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="12" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_month') ) +
'"> / <input data-qe-id="form-input-anniversary-day" id="anniversary_day_' +
__e( data.form_index ) +
'" type="number" name="anniversary_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_day') ) +
'"> / <input data-qe-id="form-input-anniversary-year" id="anniversary_year_' +
__e( data.form_index ) +
'" type="number" name="anniversary_year" value="" placeholder="YYYY" class="ctct-form-element ctct-form-date-field-4" maxlength="4" min="1900" max="' +
__e( data.max_anniversary_year ) +
'" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('anniversary_aria_label_year') ) +
'">\n        </div>\n        ';
 } ;
__p += '\n\n    ';
 _.each(data._customFields, function(customField) { ;
__p += '\n        ';
 if(customField.type === 'custom_field_string') { ;
__p += '\n        <div id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_label_' +
__e( data.form_index ) +
'" for="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_' +
__e( data.form_index ) +
'" class="ctct-form-label ctct-form-label ">' +
__e( customField.label ) +
'</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-custom-field-' +
__e( customField.label ) +
'" style="display: none;"></div>\n            <input class="ctct-form-element" data-qe-id="form-input-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_' +
__e( data.form_index ) +
'" type="text" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'" value="" maxlength="255">\n        </div>\n        ';
 } ;
__p += '\n        ';
 if(customField.type === 'custom_field_date') { ;
__p += '\n        <div id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_field_' +
__e( data.form_index ) +
'" class="ctct-form-field" >\n            <label data-qe-id="form-label-custom-field-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_label_' +
__e( data.form_index ) +
'" for="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month_' +
__e( data.form_index ) +
'" class="ctct-form-label ">' +
__e( customField.label ) +
'</label>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-custom-field-' +
__e( customField.label ) +
'" style="display: none;"></div>\n            <input data-qe-id="form-input-custom-field-month-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_month" value="" placeholder="MM" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="12" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_month') ) +
'"> / <input data-qe-id="form-input-custom-field-day-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_day_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_day" value="" placeholder="DD" class="ctct-form-element ctct-form-date-field-2" maxlength="2" min="1" max="31" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_day') ) +
'"> / <input data-qe-id="form-input-custom-field-year-' +
__e( customField.label ) +
'" id="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_year_' +
__e( data.form_index ) +
'" type="number" name="' +
__e( customField.type ) +
'_' +
__e( customField.name ) +
'_year" value="" placeholder="YYYY" class="ctct-form-element ctct-form-date-field-4" maxlength="4" min="1900" max="9999" aria-label="' +
__e( SignUpFormWidget.Helpers.i18n.translate('date_aria_label_year') ) +
'">\n        </div>\n        ';
 } ;
__p += '\n    ';
 }); ;
__p += '\n\n        ';
 if (data.list_ids.length > 1) { ;
__p += '\n        <fieldset id="list_memberships_field_' +
__e( data.form_index ) +
'" class="ctct-form-lists">\n            <legend id="list_memberships_label_' +
__e( data.form_index ) +
'" class="ctct-form-required ctct-form-lists-legend">E-postlistor</legend>\n            <div class="ctct-form-errorMessage" data-qe-id="form-error-list_memberships" style="display: none;"></div>\n            ';
 _.each(data._emailLists, function(emailList, index) { ;
__p += '\n                <div class="ctct-form-listitem">\n                    <input class="ctct-form-checkbox" data-qe-id="form-input-list-' +
__e( emailList.label ) +
'" id="email_list_' +
__e( index ) +
'_' +
__e( data.form_index ) +
'" type="checkbox" name="emailList" value="' +
__e( emailList.id ) +
'">\n                    <label data-qe-id="form-label-list-' +
__e( emailList.label ) +
'" for="email_list_' +
__e( index ) +
'_' +
__e( data.form_index ) +
'" class="ctct-form-listname ctct-form-checkbox-label">' +
__e( emailList.label ) +
'</label>\n                </div>\n            ';
 }); ;
__p += '\n        </fieldset>\n        ';
 } ;
__p += '\n\n        <div id="error_message_' +
__e( data.form_index ) +
'" class="ctct-form-error" style="display:none;">\n            <p class="ctct-form-errorMessage">Vi kunde tyvÃ¤rr inte fullfÃ¶lja registreringen av din anmÃ¤lan. Kontakta oss fÃ¶r att lÃ¶sa detta.</p>\n        </div>\n        <div id="network_error_message_' +
__e( data.form_index ) +
'" class="ctct-form-error" style="display:none;">\n            <p class="ctct-form-errorMessage">Operation timed out, please try again.</p>\n        </div>\n\n\n        <button data-qe-id="form-button" type="button" class="ctct-form-button">' +
__e( data.buttonText ) +
'</button>\n    </form>\n    <p class="ctct-form-footer">\n        ';
 if(!data.hideBranding) { ;
__p += '\n        <span data-qe-id="form-branding">\n             <a href="http://www.constantcontact.com/index.jsp?cc=forms_popup" rel="nofollow" target="_blank" class="ctct-form-footer-link">Constant Contact</a> |\n        </span>\n        ';
 } ;
__p += '\n        <a href="' +
__e( data._defaults.privacyUrl ) +
'" target="_blank" data-qe-id="form-privacy-link" class="ctct-form-footer-link">Sekretess</a>\n    </p>\n</div>\n\n';
return __p
};

SignUpFormWidget["JST"]["dist/templates/sv/popup_wrapper.html"] = function(data) {
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
__p += '<div class="ctct-popup-wrapper form_' +
__e( data.form_index ) +
'">\n    <div class="ctct-popup-overlay"></div>\n    <div class="ctct-popup-inner">\n      <div class="ctct-popup-content">\n        <button type="button" class="ctct-popup-close js-popup-close" title="Close">\n            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" class="undefined">\n                <polygon points="14 11 11 14 8 11 5 14 2 11 5 8 2 5 5 2 8 5 11 2 14 5 11 8 " class="undefined"/>\n            </svg>\n        </button>\n        <div class="ctct-form-container ctct-form-popup form_' +
__e( data.form_index ) +
'"></div>\n      </div>\n    </div>\n\n    ';
 if (data.recaptchaKey) { ;
__p += '\n    <div class="g-recaptcha" id="ctct_recaptcha_' +
__e( data.form_index ) +
'" data-sitekey="' +
__e( data.recaptchaKey ) +
'" data-size="invisible"></div>\n    ';
 } ;
__p += '\n</div>\n';
return __p
};
var signup_form_widgeti18n = signup_form_widgeti18n || {};
signup_form_widgeti18n["da"] = {  "default_success_title": "Tak for tilmeldingen!",  "default_success_desc": "Du kan nÃ¥r som helst framelde dig via linket Frameld mig nederst i hver e-mail.",  "field_email_address": "E-mail-adresse",  "field_first_name": "Fornavn",  "field_last_name": "Efternavn",  "field_phone": "Telefonnummer",  "field_country": "VÃ¦lg et land",  "field_street": "Gade/vej",  "field_city": "By",  "field_state": "VÃ¦lg en region/landsdel",  "field_postal_code": "Postnummer",  "field_company": "Firma",  "field_job_title": "Jobtitel",  "field_website": "Website",  "field_birthday": "FÃ¸dselsdato",  "field_anniversary": "Ã…rsdag",  "anniversary_aria_label_month": "Anniversary Month",  "anniversary_aria_label_day": "Anniversary Day",  "anniversary_aria_label_year": "Anniversary Year",  "birthday_aria_label_month": "Birthday Month",  "birthday_aria_label_day": "Birthday Day",  "date_aria_label_month": "Month",  "date_aria_label_day": "Day",  "date_aria_label_year": "Year",  "field_email_lists": "E-mail-lister",  "privacy_url_link": "Privatlivspolitik",  "constant_contact_link": "Constant Contact",  "powered_by": "",  "required_field_missing": "Dette felt er obligatorisk.",  "list_membership_missing": "VÃ¦lg mindst Ã©n e-mail-liste.",  "invalid_email_address": "Indtast din e-mail-adresse i formatet name@email.com.",  "invalid_birthday_format": "Indtast din fÃ¸dselsdato i formatet MM/DD.",  "invalid_anniversary_format": "Indtast din Ã¥rsdag i formatet MM/DD/Ã…Ã…Ã…Ã….",  "invalid_anniversary_year": "Please enter an anniversary year between 1900 and 2027.",  "invalid_date": "Please enter a valid date.",  "invalid_custom_date_format": "Indtast denne dato i formatet MM/DD/Ã…Ã…Ã…Ã….",  "invalid_custom_date_year": "Please enter a year between 1900 and 9999.",  "general_submit_error": "Vi beklager, vi kunne ikke gennemfÃ¸re din tilmelding. Kontakt os, sÃ¥ vi kan lÃ¸se problemet.",  "general_field_error": "Vi beklager, vi kunne ikke gennemfÃ¸re din tilmelding. Kontakt os, sÃ¥ vi kan lÃ¸se problemet.",  "general_network_error": "Operation timed out, please try again.",  "email_address_too_long": "Your email has exceeded the limit of 80 characters.",  "first_name_too_long": "Your first name has exceeded the limit of 50 characters.",  "last_name_too_long": "Your last name has exceeded the limit of 50 characters.",  "job_title_too_long": "Your job title has exceeded the limit of 50 characters.",  "company_too_long": "Your company has exceeded the limit of 50 characters.",  "phone_too_long": "Your phone has exceeded the limit of 50 characters.",  "custom_field_string_too_long": "You have exceeded the limit of 255 characters.",  "street_too_long": "Your street has exceeded the limit of 255 characters.",  "city_too_long": "Your city has exceeded the limit of 50 characters.",  "country_too_long": "Your country has exceeded the limit of 50 characters.",  "state_too_long": "Your state has exceeded the limit of 50 characters.",  "postal_code_too_long": "Your postal code has exceeded the limit of 50 characters."};
signup_form_widgeti18n["de"] = {  "default_success_title": "Vielen Dank fÃ¼r Ihre Anmeldung!",  "default_success_desc": "Ãœber den Link zur Austragung aus der Mailingliste in jeder E-Mail kÃ¶nnen Sie sich jederzeit austragen.",  "field_email_address": "E-Mail-Adresse",  "field_first_name": "Vorname",  "field_last_name": "Nachname",  "field_phone": "Telefonnummer",  "field_country": "Land auswÃ¤hlen",  "field_street": "StraÃŸe",  "field_city": "Stadt",  "field_state": "Bundesland/Kanton auswÃ¤hlen",  "field_postal_code": "Postleitzahl",  "field_company": "Unternehmen",  "field_job_title": "Position",  "field_website": "Website",  "field_birthday": "Geburtsdatum",  "field_anniversary": "JubilÂŠumsdatum",  "anniversary_aria_label_month": "Anniversary Month",  "anniversary_aria_label_day": "Anniversary Day",  "anniversary_aria_label_year": "Anniversary Year",  "birthday_aria_label_month": "Birthday Month",  "birthday_aria_label_day": "Birthday Day",  "date_aria_label_month": "Month",  "date_aria_label_day": "Day",  "date_aria_label_year": "Year",  "field_email_lists": "E-Mail-Listen",  "privacy_url_link": "Datenschutz",  "constant_contact_link": "Constant Contact",  "powered_by": "",  "required_field_missing": "Dieses Feld muss ausgefÃ¼llt werden.",  "list_membership_missing": "WÃ¤hlen Sie mindestens eine E-Mail-Liste aus.",  "invalid_email_address": "Geben Sie Ihre E-Mail- Adresse im Format name@email.com ein.",  "invalid_birthday_format": "Geben Sie Ihr Geburtsdatum im Format MM/TT ein.",  "invalid_anniversary_format": "Geben Sie das JubilÃ¤umsdatum im Format MM/TT/JJJJ ein.",  "invalid_anniversary_year": "Please enter an anniversary year between 1900 and 2027.",  "invalid_date": "Please enter a valid date.",  "invalid_custom_date_format": "Geben Sie dieses Datum im Format MM/TT/JJJJ ein.",  "invalid_custom_date_year": "Please enter a year between 1900 and 9999.",  "general_submit_error": "Der Anmeldevorgang konnte nicht abgeschlossen werden. Bitte wenden Sie sich an uns, damit dieses Problem behoben wird.",  "general_field_error": "Der Anmeldevorgang konnte nicht abgeschlossen werden. Bitte wenden Sie sich an uns, damit dieses Problem behoben wird.",  "general_network_error": "Operation timed out, please try again.",  "email_address_too_long": "Your email has exceeded the limit of 80 characters.",  "first_name_too_long": "Your first name has exceeded the limit of 50 characters.",  "last_name_too_long": "Your last name has exceeded the limit of 50 characters.",  "job_title_too_long": "Your job title has exceeded the limit of 50 characters.",  "company_too_long": "Your company has exceeded the limit of 50 characters.",  "phone_too_long": "Your phone has exceeded the limit of 50 characters.",  "custom_field_string_too_long": "You have exceeded the limit of 255 characters.",  "street_too_long": "Your street has exceeded the limit of 255 characters.",  "city_too_long": "Your city has exceeded the limit of 50 characters.",  "country_too_long": "Your country has exceeded the limit of 50 characters.",  "state_too_long": "Your state has exceeded the limit of 50 characters.",  "postal_code_too_long": "Your postal code has exceeded the limit of 50 characters."};
signup_form_widgeti18n["en_US"] = {  "default_success_title": "Thanks for signing up!",  "default_success_desc": "You can unsubscribe at any time using the Unsubscribe link at the bottom of every email.",  "field_email_address": "Email",  "field_first_name": "First Name",  "field_last_name": "Last Name",  "field_phone": "Phone",  "field_country": "Country",  "field_street": "Street",  "field_city": "City",  "field_state": "State/Province",  "field_postal_code": "Postal Code",  "field_company": "Company",  "field_job_title": "Job Title",  "field_website": "Website",  "field_birthday": "Birthday",  "field_anniversary": "Anniversary",  "anniversary_aria_label_month": "Anniversary Month",  "anniversary_aria_label_day": "Anniversary Day",  "anniversary_aria_label_year": "Anniversary Year",  "birthday_aria_label_month": "Birthday Month",  "birthday_aria_label_day": "Birthday Day",  "date_aria_label_month": "Month",  "date_aria_label_day": "Day",  "date_aria_label_year": "Year",  "field_email_lists": "Email Lists",  "powered_by": "Powered by",  "constant_contact_link": "Constant Contact",  "privacy_url_link": "Privacy",  "required_field_missing": "This field is required.",  "list_membership_missing": "Please select at least one email list.",  "invalid_email_address": "Please enter your email address in name@email.com format.",  "invalid_birthday_format": "Please enter birthday in MM/DD format.",  "invalid_anniversary_format": "Please enter anniversary in MM/DD/YYYY format.",  "invalid_anniversary_year": "Please enter an anniversary year between 1900 and 2027.",  "invalid_date": "Please enter a valid date.",  "invalid_custom_date_format": "Please enter this date in MM/DD/YYYY format.",  "invalid_custom_date_year": "Please enter a year between 1900 and 9999.",  "general_submit_error": "Sorry, we could not complete your sign-up. Please contact us to resolve this.",  "general_field_error": "Sorry, we could not complete your sign-up. Please contact us to resolve this.",  "general_network_error": "Operation timed out, please try again.",  "email_address_too_long": "Your email has exceeded the limit of 80 characters.",  "first_name_too_long": "Your first name has exceeded the limit of 50 characters.",  "last_name_too_long": "Your last name has exceeded the limit of 50 characters.",  "job_title_too_long": "Your job title has exceeded the limit of 50 characters.",  "company_too_long": "Your company has exceeded the limit of 50 characters.",  "phone_too_long": "Your phone has exceeded the limit of 50 characters.",  "custom_field_string_too_long": "You have exceeded the limit of 255 characters.",  "street_too_long": "Your street has exceeded the limit of 255 characters.",  "city_too_long": "Your city has exceeded the limit of 50 characters.",  "country_too_long": "Your country has exceeded the limit of 50 characters.",  "state_too_long": "Your state has exceeded the limit of 50 characters.",  "postal_code_too_long": "Your postal code has exceeded the limit of 50 characters."};
signup_form_widgeti18n["es"] = {  "default_success_title": "Â¡Gracias por suscribirse!",  "default_success_desc": "Puede cancelar la suscripciÃ³n en cualquier momento si pulsa el enlace para cancelar la suscripciÃ³n situado al final de cada correo electrÃ³nico.",  "field_email_address": "DirecciÃ³n de correo electrÃ³nico",  "field_first_name": "Nombre",  "field_last_name": "Apellidos",  "field_phone": "TelÃ©fono",  "field_country": "Seleccione un paÃ­s",  "field_street": "Calle",  "field_city": "Ciudad",  "field_state": "Seleccione un estado/provincia",  "field_postal_code": "CÃ³digo postal",  "field_company": "Empresa",  "field_job_title": "Cargo laboral",  "field_website": "Sitio web",  "field_birthday": "CumpleaÃ±os",  "field_anniversary": "Aniversario",  "anniversary_aria_label_month": "Anniversary Month",  "anniversary_aria_label_day": "Anniversary Day",  "anniversary_aria_label_year": "Anniversary Year",  "birthday_aria_label_month": "Birthday Month",  "birthday_aria_label_day": "Birthday Day",  "date_aria_label_month": "Month",  "date_aria_label_day": "Day",  "date_aria_label_year": "Year",  "field_email_lists": "Listas de correo electrÃ³nico",  "privacy_url_link": "Privacidad",  "constant_contact_link": "Constant Contact",  "powered_by": "",  "required_field_missing": "Campo obligatorio.",  "list_membership_missing": "Seleccione al menos una lista de correo electrÃ³nico.",  "invalid_email_address": "Introduzca su direcciÃ³n de correo electrÃ³nico con el formato nombre@correoelectrÃ³nico.com.",  "invalid_birthday_format": "Introduzca el cumpleaÃ±os con el formato MM/DD.",  "invalid_anniversary_format": "Introduzca el aniversario con el formato MM/DD/AAAA.",  "invalid_anniversary_year": "Please enter an anniversary year between 1900 and 2027.",  "invalid_date": "Please enter a valid date.",  "invalid_custom_date_format": "Introduzca esta fecha con el formato MM/DD/AAAA.",  "invalid_custom_date_year": "Please enter a year between 1900 and 9999.",  "general_submit_error": "Lo sentimos, no hemos podido completar el registro. PÃ³ngase en contacto con nosotros para solucionarlo.",  "general_field_error": "Lo sentimos, no hemos podido completar el registro. PÃ³ngase en contacto con nosotros para solucionarlo.",  "general_network_error": "Operation timed out, please try again.",  "email_address_too_long": "Your email has exceeded the limit of 80 characters.",  "first_name_too_long": "Your first name has exceeded the limit of 50 characters.",  "last_name_too_long": "Your last name has exceeded the limit of 50 characters.",  "job_title_too_long": "Your job title has exceeded the limit of 50 characters.",  "company_too_long": "Your company has exceeded the limit of 50 characters.",  "phone_too_long": "Your phone has exceeded the limit of 50 characters.",  "custom_field_string_too_long": "You have exceeded the limit of 255 characters.",  "street_too_long": "Your street has exceeded the limit of 255 characters.",  "city_too_long": "Your city has exceeded the limit of 50 characters.",  "country_too_long": "Your country has exceeded the limit of 50 characters.",  "state_too_long": "Your state has exceeded the limit of 50 characters.",  "postal_code_too_long": "Your postal code has exceeded the limit of 50 characters."};
signup_form_widgeti18n["es_CO"] = {  "default_success_title": "Â¡Gracias por suscribirse!",  "default_success_desc": "Puede cancelar su suscripciÃ³n en cualquier momento a travÃ©s del enlace Cancelar suscripciÃ³n al final de cada correo electrÃ³nico.",  "field_email_address": "DirecciÃ³n de correo electrÃ³nico",  "field_first_name": "Nombre",  "field_last_name": "Apellido",  "field_phone": "NÃºmero de telÃ©fono",  "field_country": "Seleccione un paÃ­s",  "field_street": "Calle",  "field_city": "Ciudad",  "field_state": "Seleccione un estado/una provincia",  "field_postal_code": "CÃ³digo postal",  "field_company": "Empresa",  "field_job_title": "Puesto",  "field_website": "Sitio web",  "field_birthday": "CumpleaÃ±os",  "field_anniversary": "Aniversario",  "anniversary_aria_label_month": "Anniversary Month",  "anniversary_aria_label_day": "Anniversary Day",  "anniversary_aria_label_year": "Anniversary Year",  "birthday_aria_label_month": "Birthday Month",  "birthday_aria_label_day": "Birthday Day",  "date_aria_label_month": "Month",  "date_aria_label_day": "Day",  "date_aria_label_year": "Year",  "field_email_lists": "Listas de correo electrÃ³nico",  "privacy_url_link": "Privacy",  "constant_contact_link": "Constant Contact",  "powered_by": "",  "required_field_missing": "Campo obligatorio.",  "list_membership_missing": "Seleccione al menos una lista de correo electrÃ³nico.",  "invalid_email_address": "Escriba su direcciÃ³n de correo electrÃ³nico con el formato nombre@correoelectrÃ³nico.com.",  "invalid_birthday_format": "Escriba la fecha de nacimiento en formato MM/DD.",  "invalid_anniversary_format": "Escriba el aniversario en formato MM/DD/AAAA.",  "invalid_anniversary_year": "Please enter an anniversary year between 1900 and 2027.",  "invalid_date": "Please enter a valid date.",  "invalid_custom_date_format": "Escriba esta fecha en formato MM/DD/AAAA.",  "invalid_custom_date_year": "Please enter a year between 1900 and 9999.",  "general_submit_error": "Lo sentimos, no hemos podido completar su inscripciÃ³n. ComunÃ­quese con nosotros para solucionarlo.",  "general_field_error": "Lo sentimos, no hemos podido completar su inscripciÃ³n. ComunÃ­quese con nosotros para solucionarlo.",  "general_network_error": "Operation timed out, please try again.",  "email_address_too_long": "Your email has exceeded the limit of 80 characters.",  "first_name_too_long": "Your first name has exceeded the limit of 50 characters.",  "last_name_too_long": "Your last name has exceeded the limit of 50 characters.",  "job_title_too_long": "Your job title has exceeded the limit of 50 characters.",  "company_too_long": "Your company has exceeded the limit of 50 characters.",  "phone_too_long": "Your phone has exceeded the limit of 50 characters.",  "custom_field_string_too_long": "You have exceeded the limit of 255 characters.",  "street_too_long": "Your street has exceeded the limit of 255 characters.",  "city_too_long": "Your city has exceeded the limit of 50 characters.",  "country_too_long": "Your country has exceeded the limit of 50 characters.",  "state_too_long": "Your state has exceeded the limit of 50 characters.",  "postal_code_too_long": "Your postal code has exceeded the limit of 50 characters."};
signup_form_widgeti18n["fr"] = {  "default_success_title": "Merci pour votre inscription !",  "default_success_desc": "Vous pouvez vous dÃ©sabonner Ã  tout moment en utilisant le lien RÃ©silier lâ€™abonnement au bas de chaque courrier Ã©lectronique.",  "field_email_address": "Adresse e-mail",  "field_first_name": "PrÃ©nom",  "field_last_name": "Nom de famille",  "field_phone": "NumÃ©ro de tÃ©lÃ©phone",  "field_country": "SÃ©lectionnez un pays",  "field_street": "Rue",  "field_city": "Ville",  "field_state": "SÃ©lectionnez un Ã©tat/une province",  "field_postal_code": "Code postal",  "field_company": "Entreprise",  "field_job_title": "Titre du poste",  "field_website": "Site Web",  "field_birthday": "Anniversaire",  "field_anniversary": "Anniversaire",  "anniversary_aria_label_month": "Anniversary Month",  "anniversary_aria_label_day": "Anniversary Day",  "anniversary_aria_label_year": "Anniversary Year",  "birthday_aria_label_month": "Birthday Month",  "birthday_aria_label_day": "Birthday Day",  "date_aria_label_month": "Month",  "date_aria_label_day": "Day",  "date_aria_label_year": "Year",  "field_email_lists": "Listes Ã©lectroniques",  "privacy_url_link": "Vie privÃ©e",  "constant_contact_link": "Constant Contact",  "powered_by": "",  "required_field_missing": "Ce champ est obligatoire.",  "list_membership_missing": "Veuillez sÃ©lectionner au moins une liste d'adresses Ã©lectroniques.",  "invalid_email_address": "Veuillez saisir votre adresse Ã©lectronique en format nom@e-mail.fr",  "invalid_birthday_format": "Veuillez saisir la date de votre anniversaire en format MM/JJ.",  "invalid_anniversary_format": "Veuillez saisir une autre date anniversaire en format MM/JJ/AAAA.",  "invalid_anniversary_year": "Please enter an anniversary year between 1900 and 2027.",  "invalid_date": "Please enter a valid date.",  "invalid_custom_date_format": "Veuillez saisir cette date en format MM/JJ/AAAA.",  "invalid_custom_date_year": "Please enter a year between 1900 and 9999.",  "general_submit_error": "DÃ©solÃ©, nous n&#39;avons pas pu complÃ©ter votre inscription. Veuillez nous contacter pour rÃ©soudre ce problÃ¨me.",  "general_field_error": "DÃ©solÃ©, nous n&#39;avons pas pu complÃ©ter votre inscription. Veuillez nous contacter pour rÃ©soudre ce problÃ¨me.",  "general_network_error": "Operation timed out, please try again.",  "email_address_too_long": "Your email has exceeded the limit of 80 characters.",  "first_name_too_long": "Your first name has exceeded the limit of 50 characters.",  "last_name_too_long": "Your last name has exceeded the limit of 50 characters.",  "job_title_too_long": "Your job title has exceeded the limit of 50 characters.",  "company_too_long": "Your company has exceeded the limit of 50 characters.",  "phone_too_long": "Your phone has exceeded the limit of 50 characters.",  "custom_field_string_too_long": "You have exceeded the limit of 255 characters.",  "street_too_long": "Your street has exceeded the limit of 255 characters.",  "city_too_long": "Your city has exceeded the limit of 50 characters.",  "country_too_long": "Your country has exceeded the limit of 50 characters.",  "state_too_long": "Your state has exceeded the limit of 50 characters.",  "postal_code_too_long": "Your postal code has exceeded the limit of 50 characters."};
signup_form_widgeti18n["it"] = {  "default_success_title": "Grazie per aver effettuato l'iscrizione!",  "default_success_desc": "Ãˆ possibile disdire l'iscrizione in qualsiasi momento utilizzando l'apposito link alla fine di ogni messaggio.",  "field_email_address": "Indirizzo email",  "field_first_name": "Nome",  "field_last_name": "Cognome",  "field_phone": "Numero di telefono",  "field_country": "Seleziona un paese",  "field_street": "Via",  "field_city": "LocalitÃ ",  "field_state": "Seleziona stato/provincia",  "field_postal_code": "CAP",  "field_company": "Azienda",  "field_job_title": "Qualifica",  "field_website": "Sito Web",  "field_birthday": "Compleanno",  "field_anniversary": "Anniversario",  "anniversary_aria_label_month": "Anniversary Month",  "anniversary_aria_label_day": "Anniversary Day",  "anniversary_aria_label_year": "Anniversary Year",  "birthday_aria_label_month": "Birthday Month",  "birthday_aria_label_day": "Birthday Day",  "date_aria_label_month": "Month",  "date_aria_label_day": "Day",  "date_aria_label_year": "Year",  "field_email_lists": "Elenchi email",  "privacy_url_link": "Privacy",  "constant_contact_link": "Constant Contact",  "powered_by": "",  "required_field_missing": "Questo campo Ã¨ obbligatorio.",  "list_membership_missing": "Selezionare almeno un elenco di e-mail.",  "invalid_email_address": "Immettere l'indirizzo email nel formato nome@email.com.",  "invalid_birthday_format": "Immettere il compleanno nel formato MM/GG.",  "invalid_anniversary_format": "Immettere l'anniversario nel formato MM/GG/AAAA.",  "invalid_anniversary_year": "Please enter an anniversary year between 1900 and 2027.",  "invalid_date": "Please enter a valid date.",  "invalid_custom_date_format": "Immettere la data nel formato MM/GG/AAAA.",  "invalid_custom_date_year": "Please enter a year between 1900 and 9999.",  "general_submit_error": "Spiacenti, non Ã¨ stato possibile completare l'iscrizione. Contattaci per risolvere il problema.",  "general_field_error": "Spiacenti, non Ã¨ stato possibile completare l'iscrizione. Contattaci per risolvere il problema.",  "general_network_error": "Operation timed out, please try again.",  "email_address_too_long": "Your email has exceeded the limit of 80 characters.",  "first_name_too_long": "Your first name has exceeded the limit of 50 characters.",  "last_name_too_long": "Your last name has exceeded the limit of 50 characters.",  "job_title_too_long": "Your job title has exceeded the limit of 50 characters.",  "company_too_long": "Your company has exceeded the limit of 50 characters.",  "phone_too_long": "Your phone has exceeded the limit of 50 characters.",  "custom_field_string_too_long": "You have exceeded the limit of 255 characters.",  "street_too_long": "Your street has exceeded the limit of 255 characters.",  "city_too_long": "Your city has exceeded the limit of 50 characters.",  "country_too_long": "Your country has exceeded the limit of 50 characters.",  "state_too_long": "Your state has exceeded the limit of 50 characters.",  "postal_code_too_long": "Your postal code has exceeded the limit of 50 characters."};
signup_form_widgeti18n["nl"] = {  "default_success_title": "Bedankt voor uw aanmelding",  "default_success_desc": "U kunt u altijd afmelden door op de link Afmelden te klikken die onder aan elke e-mail te vinden is.",  "field_email_address": "E-mailadres",  "field_first_name": "Voornaam",  "field_last_name": "Achternaam",  "field_phone": "Telefoonnummer",  "field_country": "Selecteer een land",  "field_street": "Adres",  "field_city": "Plaats",  "field_state": "Selecteer een provincie",  "field_postal_code": "Postcode",  "field_company": "Bedrijf",  "field_job_title": "Functie",  "field_website": "Website",  "field_birthday": "Verjaardag",  "field_anniversary": "Jubileum",  "anniversary_aria_label_month": "Anniversary Month",  "anniversary_aria_label_day": "Anniversary Day",  "anniversary_aria_label_year": "Anniversary Year",  "birthday_aria_label_month": "Birthday Month",  "birthday_aria_label_day": "Birthday Day",  "date_aria_label_month": "Month",  "date_aria_label_day": "Day",  "date_aria_label_year": "Year",  "field_email_lists": "E-maillijsten",  "privacy_url_link": "Privacy",  "constant_contact_link": "Constant Contact",  "powered_by": "",  "required_field_missing": "Dit veld is verplicht.",  "list_membership_missing": "Selecteer ten minste Ã©Ã©n e-maillijst.",  "invalid_email_address": "Geef uw e-mailadres op in de indeling naam@email.com.",  "invalid_birthday_format": "Geef geboortedagen op in de indeling MM/DD.",  "invalid_anniversary_format": "Geef een jubileum of speciale dag op in de indeling MM/DD/JJJJ.",  "invalid_anniversary_year": "Please enter an anniversary year between 1900 and 2027.",  "invalid_date": "Please enter a valid date.",  "invalid_custom_date_format": "Geef deze datum op in de indeling MM/DD/JJJJ.",  "invalid_custom_date_year": "Please enter a year between 1900 and 9999.",  "general_submit_error": "We hebben uw aanmelding helaas niet kunnen voltooien. Neem contact met ons op om dit op te lossen.",  "general_field_error": "We hebben uw aanmelding helaas niet kunnen voltooien. Neem contact met ons op om dit op te lossen.",  "general_network_error": "Operation timed out, please try again.",  "email_address_too_long": "Your email has exceeded the limit of 80 characters.",  "first_name_too_long": "Your first name has exceeded the limit of 50 characters.",  "last_name_too_long": "Your last name has exceeded the limit of 50 characters.",  "job_title_too_long": "Your job title has exceeded the limit of 50 characters.",  "company_too_long": "Your company has exceeded the limit of 50 characters.",  "phone_too_long": "Your phone has exceeded the limit of 50 characters.",  "custom_field_string_too_long": "You have exceeded the limit of 255 characters.",  "street_too_long": "Your street has exceeded the limit of 255 characters.",  "city_too_long": "Your city has exceeded the limit of 50 characters.",  "country_too_long": "Your country has exceeded the limit of 50 characters.",  "state_too_long": "Your state has exceeded the limit of 50 characters.",  "postal_code_too_long": "Your postal code has exceeded the limit of 50 characters."};
signup_form_widgeti18n["no"] = {  "default_success_title": "Takk for at du registrerte deg!",  "default_success_desc": "Du kan avslutte abonnementet nÃ¥r som helst ved Ã¥ klikke pÃ¥ linken Avslutt abonnement nederst i hver e-postmelding.",  "field_email_address": "E-postadresse",  "field_first_name": "Fornavn",  "field_last_name": "Etternavn",  "field_phone": "Telefon",  "field_country": "Velg land",  "field_street": "Gateadr",  "field_city": "Poststed",  "field_state": "Velg delstat/region",  "field_postal_code": "Postnummer",  "field_company": "Virksomhet",  "field_job_title": "Stilling",  "field_website": "Nettsted",  "field_birthday": "FÃ¸dselsdag",  "field_anniversary": "Bryllupsdag",  "anniversary_aria_label_month": "Anniversary Month",  "anniversary_aria_label_day": "Anniversary Day",  "anniversary_aria_label_year": "Anniversary Year",  "birthday_aria_label_month": "Birthday Month",  "birthday_aria_label_day": "Birthday Day",  "date_aria_label_month": "Month",  "date_aria_label_day": "Day",  "date_aria_label_year": "Year",  "field_email_lists": "E-postlister",  "privacy_url_link": "Personvern",  "constant_contact_link": "Constant Contact",  "powered_by": "",  "required_field_missing": "Dette feltet er obligatorisk.",  "list_membership_missing": "Velg minst Ã©n e-postliste.",  "invalid_email_address": "Skriv inn e-postadressen din med formatet navn@epost.com.",  "invalid_birthday_format": "Skriv inn fÃ¸dselsdatoen din med formatet MM/DD.",  "invalid_anniversary_format": "Skriv inn bryllupsdagen din med formatet MM/DD/Ã…Ã…Ã…Ã….",  "invalid_anniversary_year": "Please enter an anniversary year between 1900 and 2027.",  "invalid_date": "Please enter a valid date.",  "invalid_custom_date_format": "Skriv inn denne datoen med formatet MM/DD/Ã…Ã…Ã…Ã….",  "invalid_custom_date_year": "Please enter a year between 1900 and 9999.",  "general_submit_error": "Beklager, vi kunne ikke fullfÃ¸re registreringen. Kontakt oss for Ã¥ fÃ¥ lÃ¸st dette.",  "general_field_error": "Beklager, vi kunne ikke fullfÃ¸re registreringen. Kontakt oss for Ã¥ fÃ¥ lÃ¸st dette.",  "general_network_error": "Operation timed out, please try again.",  "email_address_too_long": "Your email has exceeded the limit of 80 characters.",  "first_name_too_long": "Your first name has exceeded the limit of 50 characters.",  "last_name_too_long": "Your last name has exceeded the limit of 50 characters.",  "job_title_too_long": "Your job title has exceeded the limit of 50 characters.",  "company_too_long": "Your company has exceeded the limit of 50 characters.",  "phone_too_long": "Your phone has exceeded the limit of 50 characters.",  "custom_field_string_too_long": "You have exceeded the limit of 255 characters.",  "street_too_long": "Your street has exceeded the limit of 255 characters.",  "city_too_long": "Your city has exceeded the limit of 50 characters.",  "country_too_long": "Your country has exceeded the limit of 50 characters.",  "state_too_long": "Your state has exceeded the limit of 50 characters.",  "postal_code_too_long": "Your postal code has exceeded the limit of 50 characters."};
signup_form_widgeti18n["pt"] = {  "default_success_title": "Obrigado por se inscrever!",  "default_success_desc": "VocÃª pode cancelar a sua inscriÃ§Ã£o a qualquer momento pelo link Unsubscribe (Cancelar inscriÃ§Ã£o) encontrado na parte inferior de cada e-mail.",  "field_email_address": "EndereÃ§o de e-mail",  "field_first_name": "Nome",  "field_last_name": "Sobrenome",  "field_phone": "Telefone",  "field_country": "Selecione um paÃ­s",  "field_street": "Rua",  "field_city": "Cidade",  "field_state": "Selecione um estado/provÃ­ncia",  "field_postal_code": "CEP",  "field_company": "Empresa",  "field_job_title": "Cargo",  "field_website": "Site",  "field_birthday": "Data de nascimento",  "field_anniversary": "AniversÃ¡rio",  "anniversary_aria_label_month": "Anniversary Month",  "anniversary_aria_label_day": "Anniversary Day",  "anniversary_aria_label_year": "Anniversary Year",  "birthday_aria_label_month": "Birthday Month",  "birthday_aria_label_day": "Birthday Day",  "date_aria_label_month": "Month",  "date_aria_label_day": "Day",  "date_aria_label_year": "Year",  "field_email_lists": "Listas de e-mail",  "privacy_url_link": "Privacidade",  "constant_contact_link": "Constant Contact",  "powered_by": "",  "required_field_missing": "Este campo Ã© obrigatÃ³rio.",  "list_membership_missing": "Selecione no mÃ­nimo uma lista de e-mail.",  "invalid_email_address": "Digite o seu endereÃ§o de e-mail no formato nome@email.com.",  "invalid_birthday_format": "Digite a data de nascimento no formato MM/DD.",  "invalid_anniversary_format": "Digite o aniversÃ¡rio no formato MM/DD/AAAA.",  "invalid_anniversary_year": "Please enter an anniversary year between 1900 and 2027.",  "invalid_date": "Please enter a valid date.",  "invalid_custom_date_format": "Digite esta data no formato MM/DD/AAAA.",  "invalid_custom_date_year": "Please enter a year between 1900 and 9999.",  "general_submit_error": "Desculpe, nÃ£o foi possÃ­vel concluir sua inscriÃ§Ã£o. Entre em contato conosco para resolver esse problema.",  "general_field_error": "Desculpe, nÃ£o foi possÃ­vel concluir sua inscriÃ§Ã£o. Entre em contato conosco para resolver esse problema.",  "general_network_error": "Operation timed out, please try again.",  "email_address_too_long": "Your email has exceeded the limit of 80 characters.",  "first_name_too_long": "Your first name has exceeded the limit of 50 characters.",  "last_name_too_long": "Your last name has exceeded the limit of 50 characters.",  "job_title_too_long": "Your job title has exceeded the limit of 50 characters.",  "company_too_long": "Your company has exceeded the limit of 50 characters.",  "phone_too_long": "Your phone has exceeded the limit of 50 characters.",  "custom_field_string_too_long": "You have exceeded the limit of 255 characters.",  "street_too_long": "Your street has exceeded the limit of 255 characters.",  "city_too_long": "Your city has exceeded the limit of 50 characters.",  "country_too_long": "Your country has exceeded the limit of 50 characters.",  "state_too_long": "Your state has exceeded the limit of 50 characters.",  "postal_code_too_long": "Your postal code has exceeded the limit of 50 characters."};
signup_form_widgeti18n["sv"] = {  "default_success_title": "Tack fÃ¶r att du anmÃ¤ler dig!",  "default_success_desc": "Du kan avregistrera dig nÃ¤r som helst med hjÃ¤lp av avregistrera-lÃ¤nken lÃ¤ngst ned i varje e-postmeddelande.",  "field_email_address": "E-postadress",  "field_first_name": "FÃ¶rnamn",  "field_last_name": "Efternamn",  "field_phone": "Telefonnummer",  "field_country": "VÃ¤lj ett land",  "field_street": "Gata",  "field_city": "Ort",  "field_state": "VÃ¤lj ett lÃ¤n",  "field_postal_code": "Postnummer",  "field_company": "FÃ¶retag",  "field_job_title": "Befattning",  "field_website": "Hemsida",  "field_birthday": "FÃ¶delsedag",  "field_anniversary": "Ã…rsdag",  "anniversary_aria_label_month": "Anniversary Month",  "anniversary_aria_label_day": "Anniversary Day",  "anniversary_aria_label_year": "Anniversary Year",  "birthday_aria_label_month": "Birthday Month",  "birthday_aria_label_day": "Birthday Day",  "date_aria_label_month": "Month",  "date_aria_label_day": "Day",  "date_aria_label_year": "Year",  "field_email_lists": "E-postlistor",  "privacy_url_link": "Sekretess",  "constant_contact_link": "Constant Contact",  "powered_by": "",  "required_field_missing": "Detta fÃ¤lt Ã¤r obligatoriskt.",  "list_membership_missing": "WÃ¤hlen Sie mindestens eine E-Mail-Liste aus.",  "invalid_email_address": "Ange din e-postadress i formatet namn@epost.se.",  "invalid_birthday_format": "Ange fÃ¶delsedag i formatet MM/DD.",  "invalid_anniversary_format": "Ange Ã¥rsdag i formatet MM/DD/Ã…Ã…Ã…Ã….",  "invalid_anniversary_year": "Please enter an anniversary year between 1900 and 2027.",  "invalid_date": "Please enter a valid date.",  "invalid_custom_date_format": "Ange det hÃ¤r datumet i formatet MM/DD/Ã…Ã…Ã…Ã….",  "invalid_custom_date_year": "Please enter a year between 1900 and 9999.",  "general_submit_error": "Vi kunde tyvÃ¤rr inte fullfÃ¶lja registreringen av din anmÃ¤lan. Kontakta oss fÃ¶r att lÃ¶sa detta.",  "general_field_error": "Vi kunde tyvÃ¤rr inte fullfÃ¶lja registreringen av din anmÃ¤lan. Kontakta oss fÃ¶r att lÃ¶sa detta.",  "general_network_error": "Operation timed out, please try again.",  "email_address_too_long": "Your email has exceeded the limit of 80 characters.",  "first_name_too_long": "Your first name has exceeded the limit of 50 characters.",  "last_name_too_long": "Your last name has exceeded the limit of 50 characters.",  "job_title_too_long": "Your job title has exceeded the limit of 50 characters.",  "company_too_long": "Your company has exceeded the limit of 50 characters.",  "phone_too_long": "Your phone has exceeded the limit of 50 characters.",  "custom_field_string_too_long": "You have exceeded the limit of 255 characters.",  "street_too_long": "Your street has exceeded the limit of 255 characters.",  "city_too_long": "Your city has exceeded the limit of 50 characters.",  "country_too_long": "Your country has exceeded the limit of 50 characters.",  "state_too_long": "Your state has exceeded the limit of 50 characters.",  "postal_code_too_long": "Your postal code has exceeded the limit of 50 characters."};
SignUpFormWidget.Helpers.Date = {
    /**
     * We allow anniversary years for the current year plus 10
     *
     * @returns int
     */
    getMaxAnniversaryYear: function getMaxAnniversaryYear() {
        return new Date().getFullYear() + 10;
    }
};

SignUpFormWidget.Helpers.Env = {
    /**
     * Sets up SignUpFormWidget.assetEnv and SignUpFormWidget.env for general use.
     *
     * @param url
     */
    parseEnv: function parseEnv(url) {
        if (url.indexOf('ctctcdn.com/js') === -1) {
            // if its not on our CDN as /js , its being run locally or in a pipeline
            SignUpFormWidget.env = 'l1.';
            SignUpFormWidget.assetEnv = '-dev';
        } else {
            // grab l1/s1/current from URL
            var env = url.match(/.*\/(l1|s1|current)\/.*/)[1];

            if (env === 'l1') {
                SignUpFormWidget.env = env + '.';
                SignUpFormWidget.assetEnv = '-dev';
            } else if (env === 's1') {
                SignUpFormWidget.env = env + '.';
                SignUpFormWidget.assetEnv = '-stage';
            } else {
                // assume anything else is prod
                SignUpFormWidget.env = '';
                SignUpFormWidget.assetEnv = '';
            }
        }
    },


    /**
     * Tells visitor2 whether the token sent via signup was procured via test key
     */
    isUsingTestRecaptchaKey: function isUsingTestRecaptchaKey() {
        if (SignUpFormWidget.env === '') {
            // never ever ever use test key in prod
            return false;
        } else {
            return SignUpFormWidget.use_real_recaptcha_key !== true;
        }
    }
};

SignUpFormWidget.Helpers.Collector = function () {
    var api = void 0;

    function _getCustomFieldsInputs(customFields, formIndex, requiredFields, errors) {
        var inputs = [],
            value = void 0,
            month = void 0,
            day = void 0,
            year = void 0,
            error = void 0;

        _.each(customFields, function (customField) {
            /*
             * Reset value in case we don't collect a date and in case
             * it retains the value of a custom field we just collected.
             */
            value = '';
            if (customField.type === 'custom_field_date') {
                month = $('#' + customField.type + '_' + customField.name + '_month_' + formIndex).val();
                day = $('#' + customField.type + '_' + customField.name + '_day_' + formIndex).val();
                year = $('#' + customField.type + '_' + customField.name + '_year_' + formIndex).val();

                error = SignUpFormWidget.Validation.Form.isValidDate(requiredFields, customField.type + '_' + customField.name, month, day, year, customField.type);
                if (!_.isEmpty(error)) {
                    errors.push(error);
                } else if (!_.isEmpty(month) && !_.isEmpty(day) && !_.isEmpty(year)) {
                    value = month + '/' + day + '/' + year;
                }
            } else {
                value = $('#' + customField.type + '_' + customField.name + '_' + formIndex).val();

                error = SignUpFormWidget.Validation.Form.isValid(requiredFields, customField.type + '_' + customField.name, value, customField.type);
                if (!_.isEmpty(error)) {
                    errors.push(error);
                }
            }

            if (!_.isEmpty(value)) {
                inputs.push({
                    custom_field_id: customField.id,
                    value: value
                });
            }
        });

        return inputs;
    }

    function _getStreetAddressInputs(requiredFields, contactFields, formIndex, errors) {
        var inputs = {},
            value = void 0,
            error = void 0;

        if (_.contains(contactFields, 'country')) {
            value = $('#country_' + formIndex).val();

            error = SignUpFormWidget.Validation.Form.isValid(requiredFields, 'country', value);
            if (!_.isEmpty(error)) {
                errors.push(error);
            } else if (!_.isEmpty(value)) {
                inputs.country = value;
            }
        }

        if (_.contains(contactFields, 'street')) {
            value = $('#street_' + formIndex).val();

            error = SignUpFormWidget.Validation.Form.isValid(requiredFields, 'street', value);
            if (!_.isEmpty(error)) {
                errors.push(error);
            } else if (!_.isEmpty(value)) {
                inputs.street = value;
            }
        }

        if (_.contains(contactFields, 'city')) {
            value = $('#city_' + formIndex).val();

            error = SignUpFormWidget.Validation.Form.isValid(requiredFields, 'city', value);
            if (!_.isEmpty(error)) {
                errors.push(error);
            } else if (!_.isEmpty(value)) {
                inputs.city = value;
            }
        }

        if (_.contains(contactFields, 'state')) {
            value = $('#state_' + formIndex + ':visible').val();

            error = SignUpFormWidget.Validation.Form.isValid(requiredFields, 'state', value);
            if (!_.isEmpty(error)) {
                errors.push(error);
            } else if (!_.isEmpty(value)) {
                inputs.state = value;
            }
        }

        if (_.contains(contactFields, 'postal_code')) {
            value = $('#postal_code_' + formIndex).val();

            error = SignUpFormWidget.Validation.Form.isValid(requiredFields, 'postal_code', value);
            if (!_.isEmpty(error)) {
                errors.push(error);
            } else if (!_.isEmpty(value)) {
                inputs.postal_code = value;
            }
        }

        return inputs;
    }

    api = {
        /**
         * Collects inputs and does client side validation. Will call to display errors if there are any.
         *
         * @param {Object} formObj Form object
         * @returns {Object} Returns array of objects with field name/value, or empty if there's errors.
         */
        getFormInputs: function getFormInputs(formObj) {
            var inputs = {},
                error = void 0,
                errors = [],
                value = void 0,
                month = void 0,
                day = void 0,
                year = void 0;

            var contact_fields = formObj.contact_fields,
                list_ids = formObj.list_ids,
                form_index = formObj.form_index;

            var configCustomFields = SignUpFormWidget.Handlers.Config.getCustomFields(formObj);
            var requiredFields = SignUpFormWidget.Handlers.Config.getRequiredFields(formObj);

            value = $('#email_address_' + form_index).val();
            error = SignUpFormWidget.Validation.Form.isValidEmail(value);
            inputs.email_address = value;
            if (!_.isEmpty(error)) {
                errors.push(error);
            }

            // there should always be lists
            var list_memberships = [];
            if (list_ids.length > 1) {
                var selectedLists = $('.ctct-form-lists input:checked');
                _.each(selectedLists, function (selectedList) {
                    list_memberships.push($(selectedList).val());
                });
            } else {
                list_memberships.push(list_ids[0]);
            }
            error = SignUpFormWidget.Validation.Form.isValidLists(list_memberships);
            inputs.list_memberships = list_memberships;
            if (!_.isEmpty(error)) {
                errors.push(error);
            }

            if (_.contains(contact_fields, 'first_name')) {
                value = $('#first_name_' + form_index).val();

                error = SignUpFormWidget.Validation.Form.isValid(requiredFields, 'first_name', value);
                if (!_.isEmpty(error)) {
                    errors.push(error);
                } else if (!_.isEmpty(value)) {
                    inputs.first_name = value;
                }
            }

            if (_.contains(contact_fields, 'last_name')) {
                value = $('#last_name_' + form_index).val();

                error = SignUpFormWidget.Validation.Form.isValid(requiredFields, 'last_name', value);
                if (!_.isEmpty(error)) {
                    errors.push(error);
                } else if (!_.isEmpty(value)) {
                    inputs.last_name = value;
                }
            }

            if (_.contains(contact_fields, 'job_title')) {
                value = $('#job_title_' + form_index).val();

                error = SignUpFormWidget.Validation.Form.isValid(requiredFields, 'job_title', value);
                if (!_.isEmpty(error)) {
                    errors.push(error);
                } else if (!_.isEmpty(value)) {
                    inputs.job_title = value;
                }
            }

            if (_.contains(contact_fields, 'company')) {
                value = $('#company_' + form_index).val();

                error = SignUpFormWidget.Validation.Form.isValid(requiredFields, 'company', value);
                if (!_.isEmpty(error)) {
                    errors.push(error);
                } else if (!_.isEmpty(value)) {
                    inputs.company_name = value;
                }
            }

            if (_.contains(contact_fields, 'phone')) {
                value = $('#phone_' + form_index).val();

                error = SignUpFormWidget.Validation.Form.isValid(requiredFields, 'phone', value);
                if (!_.isEmpty(error)) {
                    errors.push(error);
                } else if (!_.isEmpty(value)) {
                    inputs.phone_number = value;
                }
            }

            if (!_.isEmpty(configCustomFields)) {
                var customFields = _getCustomFieldsInputs(configCustomFields, form_index, requiredFields, errors);
                if (!_.isEmpty(customFields)) {
                    inputs.custom_fields = customFields;
                }
            }

            if (_.contains(contact_fields, 'birthday')) {
                month = $('#birthday_month_' + form_index).val();
                day = $('#birthday_day_' + form_index).val();

                error = SignUpFormWidget.Validation.Form.isValidBirthday(requiredFields, month, day);
                if (!_.isEmpty(error)) {
                    errors.push(error);
                }
                // if both are empty, don't send the data in post
                else if (!_.isEmpty(month) || !_.isEmpty(day)) {
                        inputs.birthday_day = day;
                        inputs.birthday_month = month;
                    }
            }

            if (_.contains(contact_fields, 'anniversary')) {
                month = $('#anniversary_month_' + form_index).val();
                day = $('#anniversary_day_' + form_index).val();
                year = $('#anniversary_year_' + form_index).val();

                error = SignUpFormWidget.Validation.Form.isValidDate(requiredFields, 'anniversary', month, day, year);
                if (!_.isEmpty(error)) {
                    errors.push(error);
                } else if (!_.isEmpty(month) && !_.isEmpty(day) && !_.isEmpty(year)) {
                    inputs.anniversary = month + '/' + day + '/' + year;
                }
            }

            // street address needs a special object. Only add it if we're doing address things
            var streetAddress = _getStreetAddressInputs(requiredFields, contact_fields, form_index, errors);
            if (!_.isEmpty(streetAddress)) {
                inputs.street_address = streetAddress;
            }

            if (_.isEmpty(errors)) {
                return inputs;
            } else {
                SignUpFormWidget.Handlers.Error.display(formObj, errors);
                return {};
            }
        }
    };

    return api;
}();

SignUpFormWidget.Helpers.i18n = {
    DEFAULT: "en_US",

    load: function load(language) {
        this.activeLanguage = signup_form_widgeti18n[language] ? language : this.DEFAULT;
    },
    translate: function translate(key) {
        return signup_form_widgeti18n[this.getActiveLanguage()][key];
    },
    getActiveLanguage: function getActiveLanguage() {
        return this.activeLanguage || this.DEFAULT;
    }
};

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * This popup plugin is meant to be able to be broken out into a standalone widget in the
 * future. Its modeled after the jQuery widget pattern.
 *
 * Please keep it generic :)
 */
;(function ($, window, document, undefined) {
    var pluginName = 'ctctPopupForm';
    var toggleVisibilityClass = 'ctct-popup-is-visible';

    var defaults = {
        namespace: 'cats',
        autoOpen: true,
        timeDelay: 5000, // 5 seconds in milliseconds
        exitIntent: false
    };

    var CtctPopupForm = function () {
        function CtctPopupForm(element) {
            var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

            _classCallCheck(this, CtctPopupForm);

            this.$element = $(element);

            this.options = $.extend({}, defaults, options);

            this._defaults = defaults;
            this._name = pluginName;

            this._isShown = false;

            this.init();
        }

        _createClass(CtctPopupForm, [{
            key: 'init',
            value: function init() {
                var _this = this;

                this.$element.find('.js-popup-close').on('click.' + pluginName + '.' + this.options.namespace, function () {
                    _this.hide();
                });
                $('body').on('keydown.' + pluginName + '.' + this.options.namespace, function (e) {
                    var charCode = typeof e.which === 'number' ? e.which : e.keyCode;
                    if (charCode === 27) {
                        //esc
                        _this.hide();
                    }
                });
                this.$element.find('.ctct-popup-overlay').on('click.' + pluginName + '.' + this.options.namespace, function (e) {
                    _this.hide();
                });

                if (this.options.exitIntent) {
                    $(document).on('mouseleave.' + pluginName + '.' + this.options.namespace, function (e) {
                        _this.show(true);
                    });
                }

                if (this.options.autoOpen) {
                    this.show();
                }
            }
        }, {
            key: 'destroy',
            value: function destroy() {
                this.hide();

                this.$element.find('.js-popup-close').off('click.' + pluginName + '.' + this.options.namespace);
                $('body').off('keydown.' + pluginName + '.' + this.options.namespace + ' click.' + pluginName + '.' + this.options.namespace);
                if (this.options.exitIntent) {
                    $(document).off('mouseleave.' + pluginName + '.' + this.options.namespace);
                }
            }
        }, {
            key: 'show',
            value: function show() {
                var _this2 = this;

                var now = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

                if (!this.$element.hasClass(toggleVisibilityClass)) {
                    if (!now && this.options.timeDelay > 0) {
                        window.setTimeout(function () {
                            _this2.$element.addClass(toggleVisibilityClass);
                        }, this.options.timeDelay);
                    } else {
                        this.$element.addClass(toggleVisibilityClass);
                    }
                }
            }
        }, {
            key: 'hide',
            value: function hide() {
                if (this.$element.hasClass(toggleVisibilityClass)) {
                    this.$element.removeClass(toggleVisibilityClass);
                }
            }
        }]);

        return CtctPopupForm;
    }();

    $.fn[pluginName] = function (options) {
        var args = arguments;

        if (options === undefined || (typeof options === 'undefined' ? 'undefined' : _typeof(options)) === 'object') {
            return this.each(function () {
                if (!$.data(this, 'plugin_' + pluginName)) {
                    $.data(this, 'plugin_' + pluginName, new CtctPopupForm(this, options));
                }
            });
        } else if (typeof options === 'string' && options[0] !== '_' && options !== 'init') {
            var returns = void 0;

            this.each(function () {
                var instance = $.data(this, 'plugin_' + pluginName);
                if (instance instanceof CtctPopupForm && typeof instance[options] === 'function') {
                    returns = instance[options].apply(instance, _toConsumableArray(Array.prototype.slice.call(args, 1)));
                }
                if (options === 'destroy') {
                    $.data(this, 'plugin_' + pluginName, null);
                }
            });

            return returns !== undefined ? returns : this;
        }
    };
})(jQuery, window, document);

SignUpFormWidget.Validation.Form = function () {
    var api = void 0;

    function _buildErrors(field, codes, customFieldType) {
        var err = {};
        if (!_.isEmpty(codes)) {
            err['error_key'] = 'contacts.client.validation.error';
            err['error_field'] = field;
            err['error_codes'] = _.unique(codes);

            if (customFieldType) {
                err['custom_field_type'] = customFieldType;
            }
        }
        return err;
    }

    function monthIsValid(month) {
        return month < 13 && month > 0;
    }

    function dayIsValid(day, month) {
        if (_.isEmpty(month)) {
            return false;
        }
        if (day >= 1 && day <= 31) {
            // Thirty days hath September,
            // April, June and November.
            // All the rest have 31
            // except February which hath 28
            // and sometimes 29
            if (month === '2') {
                return day <= 29;
            } else if (month === '4' || month === '6' || month === '9' || month === '11') {
                return day <= 30;
            }
            return true;
        }

        return false;
    }

    function yearIsValid(year) {
        return year >= 1900 && year <= 9999;
    }

    api = {
        isValid: function isValid(requiredFields, fieldName, value, customFieldType) {
            var errors = [];

            if (_.contains(requiredFields, fieldName) && _.isEmpty(value)) {
                errors.push('is_missing');
            }

            return _buildErrors(fieldName, errors, customFieldType);
        },
        isValidEmail: function isValidEmail(email) {
            var errors = [];

            if (_.isEmpty(email)) {
                // email is always required
                errors.push('is_missing');
            }
            // validate a@b.c format
            if (!/\S+@\S+\.\S+/.test(email)) {
                errors.push('format');
            }

            return _buildErrors('email_address', errors);
        },
        isValidLists: function isValidLists(lists) {
            var errors = [];

            if (_.isEmpty(lists)) {
                // lists are always required
                errors.push('is_missing');
            }

            return _buildErrors('list_memberships', errors);
        },
        isValidBirthday: function isValidBirthday(requiredFields, month, day) {
            var errors = [];

            // when birthday is required, month has to be there, day doesn't.
            if (_.contains(requiredFields, 'birthday') && _.isEmpty(month)) {
                errors.push('is_missing');
            }

            // we need a month if there's a day
            if (_.isEmpty(month) && !_.isEmpty(day)) {
                errors.push('blank');
            }

            // if month is there and invalid it's not a valid date
            if (!_.isEmpty(month) && !monthIsValid(month)) {
                errors.push('not_a_date');
            }

            // we don't want to push 'not_a_date' if there is no birthday month
            if (!_.isEmpty(day) && !_.isEmpty(month) && !dayIsValid(day, month)) {
                errors.push('not_a_date');
            }

            return _buildErrors('birthday', errors);
        },
        isValidDate: function isValidDate(requiredFields, fieldName, month, day, year) {
            var fieldType = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : false;

            var errors = [];

            if (_.contains(requiredFields, fieldName) && _.isEmpty(year) && _.isEmpty(month) && _.isEmpty(day)) {
                errors.push('is_missing');
            } else if (!_.isEmpty(year) && !_.isEmpty(month) && !_.isEmpty(day)) {
                // all fields are full, validate each field
                if (!monthIsValid(month)) {
                    errors.push('not_a_date');
                }

                if (!dayIsValid(day, month)) {
                    errors.push('not_a_date');
                }

                if (!yearIsValid(year)) {
                    errors.push('after');
                }
            } else if (!_.isEmpty(year) || !_.isEmpty(month) || !_.isEmpty(day)) {
                // need a whole date or no date, eg 10// or //1000
                errors.push('format');
            }

            return _buildErrors(fieldName, errors, fieldType);
        }
    };

    return api;
}();

SignUpFormWidget.Handlers.Config = function () {
    var TEST_KEY = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';
    var config = {},
        api = void 0;

    function _getContactFields(contactFields, config) {
        var contactFieldConfig = _.where(config.contactFields, { customField: false });
        return _.filter(contactFieldConfig, function (contactField) {
            // ensure top level config contains contact field and wasn't removed
            return _.contains(contactFields, contactField.type);
        });
    }

    function _getCustomFields(customFields, config) {
        var customFieldConfig = _.where(config.contactFields, { customField: true });
        return _.filter(customFieldConfig, function (customField) {
            // ensure top level config contains custom field id and wasn't removed
            return _.contains(customFields, customField.id);
        });
    }

    function _getEmailLists(listIds, config) {
        return _.filter(config.emailLists, function (emailList) {
            // ensure top level config contains list id and wasn't removed
            return _.contains(listIds, emailList.id);
        });
    }

    function _sortAndPinCountries(countries) {
        // Keep a list of countries to be pinned to the top of the select
        // dropdown. This is the order they will be displayed
        var countriesToPin = [{ code: 'us', obj: undefined }, { code: 'ca', obj: undefined }];

        var sortedCountries = _.sortBy(countries, 'display');

        // Loop through the supplied countries and
        // If country is unpinned, add to the unpinned list
        // If country is pinned, update the object reference in countriesToPin
        //
        var unpinnedCountries = [];
        _.each(sortedCountries, function (country) {
            var pinned = false;
            _.each(countriesToPin, function (pinnedCountry) {
                if (pinnedCountry.code === country.countryCode) {
                    pinnedCountry.obj = country;
                    pinned = true;
                }
            });

            if (!pinned) {
                unpinnedCountries.push(country);
            }
        });

        //  Extract the country object from the sorted pinned country list
        var pinnedList = _.map(countriesToPin, function (country) {
            return country.obj;
        });

        // Throw away any pinned countries that weren't supplied by the service
        var validPinnedList = _.reject(pinnedList, function (country) {
            return country === undefined;
        });

        // Cocatenate the unpinned and pinned lists and return
        return validPinnedList.concat(unpinnedCountries);
    }

    api = {
        /**
        * Load config from s3 to get form data and other misc data needed (states, countries, etc)
        */
        loadConfig: function loadConfig() {
            var deferred = $.Deferred();

            if (!SignUpFormWidget.previewMode && (_ctct_m === undefined || typeof _ctct_m !== 'string')) {
                // if we're not in preview mode and _ctct_m is not there, do nothing because we can't do anything anyways
                window.console.error('Missing critical variable "_ctct_m". Please copy paste universal code from account again.');
                deferred.reject('Missing "_ctct_m".');
                return;
            }

            var configUrl = 'https://listgrowth' + SignUpFormWidget.assetEnv + '.ctctcdn.com/v1/' + _ctct_m + '.json';

            var xhr = $.ajax({
                url: configUrl
            });
            xhr.done(function (data, textStatus, jqXHR) {
                api.setCompanyName(data.companyName);
                api.setPrivacyUrl(data.privacyUrl);
                api.setCountries(data.countries);
                api.setStates(data.states);
                api.setForms(data.forms);

                var recaptchaHeader = jqXHR.getResponseHeader('recaptcha-key');
                var shouldUseTestKey = SignUpFormWidget.Helpers.Env.isUsingTestRecaptchaKey();

                if (!_.isString(recaptchaHeader)) {
                    // null is the kill switch
                    api.setRecaptchaKey(null);
                } else if (shouldUseTestKey) {
                    api.setRecaptchaKey(TEST_KEY);
                } else {
                    // it's the real deal!
                    api.setRecaptchaKey(recaptchaHeader);
                }

                deferred.resolve(api.getForms());
            });
            xhr.fail(function (jqXHR, textStatus, errorThrown) {
                deferred.reject(false, 'Failure to retrieve config from ' + configUrl + ', aborting.');
            });

            return deferred.promise();
        },
        setRecaptchaKey: function setRecaptchaKey(recaptchaKey) {
            config.recaptchaKey = recaptchaKey;
        },
        getRecaptchaKey: function getRecaptchaKey() {
            return config.recaptchaKey;
        },
        getLanguage: function getLanguage() {
            return config.language;
        },
        getCompanyName: function getCompanyName() {
            return config.companyName;
        },
        setCompanyName: function setCompanyName(companyName) {
            config.companyName = companyName;
        },
        getPrivacyUrl: function getPrivacyUrl() {
            return config.privacyUrl;
        },
        setPrivacyUrl: function setPrivacyUrl(privacyUrl) {
            config.privacyUrl = privacyUrl;
        },
        getCountries: function getCountries() {
            return config.countries;
        },
        setCountries: function setCountries(countries) {
            config.countries = _sortAndPinCountries(countries);
        },
        getStates: function getStates() {
            return config.states;
        },
        setStates: function setStates(states) {
            config.states = states;
        },
        getForms: function getForms() {
            return config.forms;
        },
        setForms: function setForms(forms) {
            var formsArr = [];
            _.each(forms, function (form, index) {
                // parse the form config for each form as it comes in
                try {
                    form.config = JSON.parse(form.config);
                    form.form_index = index;
                    formsArr.push(form);
                } catch (err) {
                    // reject the form if the config is not valid
                    window.console.warn('Form "' + form.name + '" has malformed configuration, please republish this form.');
                }
            });
            config.forms = formsArr;
        },
        getFormById: function getFormById(formId) {
            return _.findWhere(config.forms, { form_id: formId });
        },
        getCustomFields: function getCustomFields(formConfig) {
            return _getCustomFields(formConfig.custom_field_ids, formConfig.config);
        },


        /**
        * Gets the custom field type by name
        *
        * @param {Object} formConfig the form we want to scope our query to
        * @param {String} name the name of the field whose type we want
        * @returns {String} The type of the field (date or string)
        */
        getCustomFieldType: function getCustomFieldType(formConfig, name) {
            var customFields = this.getCustomFields(formConfig);
            var matchedField = _.findWhere(customFields, { name: name });

            return matchedField ? matchedField.type : matchedField;
        },


        /**
        * Parses out data needed for rendering from the form
        *
        * @param {Object} formConfig the form we want to render
        * @param {String} formConfig.config form must contain a stringified object as 'config' prop
        * @returns {Object} Contains all properties needed for rendering the form.
        */
        getRenderConfig: function getRenderConfig(formConfig) {
            if (!_.isObject(formConfig) || !_.isObject(formConfig.config)) {
                return undefined; // this is not a valid case
            }

            var renderConfig = $.extend({}, formConfig.config, true);

            renderConfig.list_ids = formConfig.list_ids;
            renderConfig.contact_fields = formConfig.contact_fields;
            renderConfig.custom_field_ids = formConfig.custom_field_ids;
            renderConfig.form_id = formConfig.form_id;
            renderConfig.form_index = formConfig.form_index;
            renderConfig.list_ids = formConfig.list_ids;
            renderConfig.type = formConfig.type;

            renderConfig.titleText = _.isObject(formConfig.config.title) ? formConfig.config.title.text : '';
            renderConfig.descriptionText = _.isObject(formConfig.config.description) ? formConfig.config.description.text : '';
            renderConfig.buttonText = _.isObject(formConfig.config.button) ? formConfig.config.button.text : '';

            var emailLists = _getEmailLists(formConfig.list_ids, renderConfig);
            renderConfig._emailLists = emailLists.sort(function (l1, l2) {
                return l1.label.toLowerCase() > l2.label.toLowerCase() ? 1 : -1;
            });
            renderConfig._customFields = _getCustomFields(formConfig.custom_field_ids, renderConfig);
            if (formConfig.config.hasOwnProperty('branding')) {
                renderConfig.hideBranding = formConfig.config.branding.hideBranding || false;
            } else {
                renderConfig.hideBranding = false;
            }

            renderConfig._defaults = {
                countries: SignUpFormWidget.Handlers.Config.getCountries(),
                states: SignUpFormWidget.Handlers.Config.getStates(),
                privacyUrl: SignUpFormWidget.Handlers.Config.getPrivacyUrl()
            };
            if (_.contains(renderConfig.contact_fields, 'anniversary')) {
                renderConfig.max_anniversary_year = SignUpFormWidget.Helpers.Date.getMaxAnniversaryYear();
            }
            renderConfig.recaptchaKey = SignUpFormWidget.Handlers.Config.getRecaptchaKey();

            return renderConfig;
        },


        /**
        * Parses out list of required fields from form
        *
        * @param {Object} formConfig the form we want to get data from
        * @returns {Array} Contains array of fields marked required
        */
        getRequiredFields: function getRequiredFields() {
            var formConfig = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : { config: '{"contactFields":[]}' };

            var reqFields = [],
                contactFields = void 0,
                customFields = void 0;

            var fieldsConfig = $.extend({}, formConfig.config, true);

            contactFields = _getContactFields(formConfig.contact_fields, fieldsConfig);
            customFields = _getCustomFields(formConfig.custom_field_ids, fieldsConfig);

            _.each(contactFields, function (contactField) {
                if (contactField.required) {
                    reqFields.push(contactField.type);
                }
            });

            _.each(customFields, function (customField) {
                if (customField.required) {
                    reqFields.push(customField.type + '_' + customField.name);
                }
            });

            return reqFields;
        }
    };

    return api;
}();

SignUpFormWidget.Handlers.Style = function () {
    var api = void 0;

    /**
     * Only create the element once. If its already there, reuse it!
     * @param formIndex The index of the form
     * @return {Element} The style element
     * @private
     */
    function _getFormStyleElement(formIndex) {
        var styleId = 'ctct-form-styles_' + formIndex;
        var style = document.getElementById(styleId);

        if (style === null) {
            style = document.createElement('style');
            style.id = styleId;
            style.type = 'text/css';
            style.media = 'all';
            document.head.appendChild(style);
        }

        return style;
    }

    api = {
        buildPopupStyles: function buildPopupStyles(formConfig) {
            var form_index = formConfig.form_index,
                config = formConfig.config;


            var style = _getFormStyleElement(form_index);
            var styleString = ''; // start empty, build it up!

            if (_.isObject(config.title) && _.isString(config.title.color)) {
                styleString += '.ctct-form-popup.form_' + form_index + ' .ctct-form-defaults .ctct-form-header {\n                    color: ' + config.title.color + ';\n                }\n';
            }

            if (_.isObject(config.description) && _.isString(config.description.color)) {
                styleString += '.ctct-form-popup.form_' + form_index + ' .ctct-form-defaults .ctct-form-text,\n                .ctct-form-popup.form_' + form_index + ' .ctct-form-custom .ctct-form-label,\n                .ctct-form-popup.form_' + form_index + ' .ctct-form-custom .ctct-form-listname,\n                .ctct-form-popup.form_' + form_index + ' .ctct-form-custom .ctct-form-lists-legend,\n                .ctct-form-popup.form_' + form_index + ' .ctct-form-defaults .ctct-form-footer,\n                .ctct-form-popup.form_' + form_index + ' .ctct-form-defaults .ctct-form-footer .ctct-form-footer-link {\n                    color: ' + config.description.color + ';\n                }\n                .form_' + form_index + ' .ctct-popup-content {\n                    fill: ' + config.description.color + ';\n                }\n';
            }

            if (_.isObject(config.button)) {
                var buttonBg = config.button.backgroundColor;
                var buttonBgActive = config.button.backgroundColorActive;
                var buttonBgHover = config.button.backgroundColorHover;
                var buttonColor = config.button.color;

                styleString += '.ctct-popup-content .ctct-form-popup.form_' + form_index + ' .ctct-form-custom .ctct-form-button {';
                if (buttonBg) {
                    styleString += 'background-color: ' + buttonBg + ';';
                    styleString += 'border: 1px solid ' + buttonBg + ';';
                }
                if (buttonColor) {
                    styleString += 'color: ' + buttonColor + ';';
                }
                styleString += '}\n';

                if (buttonBg) {
                    styleString += '.ctct-popup-content .ctct-form-popup.form_' + form_index + ' .ctct-form-custom .ctct-form-button:hover {';
                    if (buttonBgHover) {
                        styleString += 'background-color: ' + buttonBgHover + ';';
                        styleString += 'border: 1px solid ' + buttonBgHover + ';';
                    }
                    styleString += '}\n';

                    styleString += '.ctct-popup-content .ctct-form-popup.form_' + form_index + ' .ctct-form-custom .ctct-form-button:active {';
                    if (buttonBgActive) {
                        styleString += 'background-color: ' + buttonBgActive + ';';
                        styleString += 'border: 1px solid ' + buttonBgActive + ';';
                    }
                    styleString += '}\n';
                }
            }

            if (_.isObject(config.background) && _.isString(config.background.color)) {
                styleString += '.form_' + form_index + ' .ctct-popup-content,\n                 .ctct-form-popup.form_' + form_index + ' .ctct-form-defaults {\n                    background-color: ' + config.background.color + ';\n                }\n';
            }

            // update the DOM once we've parsed all the overrides
            style.innerHTML = styleString;
        },
        buildInlineStyles: function buildInlineStyles(formConfig) {
            var form_index = formConfig.form_index,
                config = formConfig.config;


            var style = _getFormStyleElement(form_index);
            var styleString = ''; // start empty, build it up!

            if (_.isObject(config.title) && _.isString(config.title.color)) {
                styleString += '.ctct-form-embed.form_' + form_index + ' .ctct-form-defaults .ctct-form-header {\n                    color: ' + config.title.color + ';\n                }\n';
            }

            if (_.isObject(config.description) && _.isString(config.description.color)) {
                styleString += '.ctct-form-embed.form_' + form_index + ' .ctct-form-defaults .ctct-form-text,\n                .ctct-form-embed.form_' + form_index + ' .ctct-form-custom .ctct-form-label,\n                .ctct-form-embed.form_' + form_index + ' .ctct-form-custom .ctct-form-listname,\n                .ctct-form-embed.form_' + form_index + ' .ctct-form-custom .ctct-form-lists-legend,\n                .ctct-form-embed.form_' + form_index + ' .ctct-form-defaults .ctct-form-footer,\n                .ctct-form-embed.form_' + form_index + ' .ctct-form-defaults .ctct-form-footer .ctct-form-footer-link {\n                    color: ' + config.description.color + ';\n                }\n';
            }

            if (_.isObject(config.button)) {
                var buttonBg = config.button.backgroundColor;
                var buttonBgActive = config.button.backgroundColorActive;
                var buttonBgHover = config.button.backgroundColorHover;
                var buttonColor = config.button.color;

                styleString += '.ctct-form-embed.form_' + form_index + ' .ctct-form-custom .ctct-form-button {';
                if (buttonBg) {
                    styleString += 'background-color: ' + buttonBg + ';';
                    styleString += 'border: 1px solid ' + buttonBg + ';';
                }
                if (buttonColor) {
                    styleString += 'color: ' + buttonColor + ';';
                }
                styleString += '}\n';

                if (buttonBg) {
                    styleString += '.ctct-form-embed.form_' + form_index + ' .ctct-form-custom .ctct-form-button:hover {';
                    if (buttonBgHover) {
                        styleString += 'background-color: ' + buttonBgHover + ';';
                        styleString += 'border: 1px solid ' + buttonBgHover + ';';
                    }
                    styleString += '}\n';

                    styleString += '.ctct-form-embed.form_' + form_index + ' .ctct-form-custom .ctct-form-button:active {';
                    if (buttonBgActive) {
                        styleString += 'background-color: ' + buttonBgActive + ';';
                        styleString += 'border: 1px solid ' + buttonBgActive + ';';
                    }
                    styleString += '}\n';
                }
            }

            if (_.isObject(config.background) && _.isString(config.background.color)) {
                styleString += '.ctct-form-embed.form_' + form_index + ' .ctct-form-defaults {\n                    background-color: ' + config.background.color + ';\n                }\n';
            }

            // update the DOM once we've parsed all the overrides
            style.innerHTML = styleString;
        },
        loadBaseStyles: function loadBaseStyles() {
            // grab src from script tag and replace the asset name with css
            var mainScript = $("script[src$='signup-form-widget.min.js'], script[src$='signup-form-widget.js']");
            if (!mainScript.length) {
                window.console.warn('ERROR: Failed to find main sign up form script, aborting.');
                return;
            } else if (mainScript.length > 1) {
                window.console.warn('Universal code snippet was installed twice. Please only include it once on each page.');
            }

            var baseSrc = mainScript.attr('src');
            var styleHref = baseSrc.replace('signup-form-widget.min.js', 'signup-form-widget.css').replace('signup-form-widget.js', 'signup-form-widget.css');

            if (typeof SignUpFormWidget.env !== 'string') {
                SignUpFormWidget.Helpers.Env.parseEnv(baseSrc);
            }

            var css_link = document.createElement('link');
            css_link.rel = 'stylesheet';
            css_link.type = 'text/css';
            css_link.media = 'all';
            css_link.href = styleHref;

            document.head.appendChild(css_link);
        }
    };

    return api;
}();

SignUpFormWidget.Handlers.Error = function () {
    var api = void 0;

    var ERROR_MAP = {
        email_address: {
            format: 'invalid_email_address'
        },
        anniversary: {
            format: 'invalid_anniversary_format',
            before: 'invalid_anniversary_year',
            after: 'invalid_anniversary_year'
        },
        birthday: {
            format: 'invalid_birthday_format',
            blank: 'invalid_birthday_format'
        },
        custom_field_date: {
            format: 'invalid_custom_date_format',
            before: 'invalid_custom_date_format',
            after: 'invalid_custom_date_year'
        },
        list_memberships: {
            is_missing: 'list_membership_missing'
        },
        is_missing: 'required_field_missing',
        not_a_date: 'invalid_date',
        network: 'general_network_error',
        unknown: 'general_field_error'
    };

    /*
     *
     * @param {String} code The error string
     * @param {String} field The field name string
     * @returns {String} The i18n key for the error we want to display to user.
     */
    function _mapErrors(code, field) {
        // rather than store every field in the map, we handle this case upfront.
        if (code === 'too_long') {
            return field + '_too_long';
        } else if (ERROR_MAP[field] && ERROR_MAP[field][code]) {
            return ERROR_MAP[field][code];
        } else if (ERROR_MAP[code]) {
            return ERROR_MAP[code];
        } else {
            return ERROR_MAP['unknown'];
        }
    }

    function _normalizeErrors(unmappedErrors, form) {
        return unmappedErrors.map(function (err) {
            // translate custom field names to type (String or Date)
            if (!_.isEmpty(err.error_field)) {
                if (err.error_field.indexOf('custom_fields.') > -1) {
                    var name = err.error_field.split('.')[1];
                    var type = SignUpFormWidget.Handlers.Config.getCustomFieldType(form, name);
                    err.error_field = type + '_' + name;
                    err.custom_field_type = type;
                }

                /*
                 * If fields are birthday_day and birthday_month, map them
                 * to the same key, then render whichever one comes last.
                 *
                 * Coded this way for performance reasons.
                 */
                err.error_field = err.error_field.replace('birthday_day', 'birthday').replace('birthday_month', 'birthday').replace('street_address.', '').replace('company_name', 'company').replace('phone_number', 'phone');
            }

            return err;
        });
    }

    function _getErrorText(err) {
        var error_codes = err.error_codes,
            error_field = err.error_field,
            custom_field_type = err.custom_field_type;

        var errKey = 'general_submit_error';

        // for the i18n key, parse out custom field type if it's a custom field
        if (!_.isEmpty(error_codes)) {
            var fieldCopyKey = custom_field_type || error_field;
            errKey = _mapErrors(error_codes[0], fieldCopyKey);
        }

        return SignUpFormWidget.Helpers.i18n.translate(errKey);
    }

    function _attachErrorClearCallback($form, form_index, elem) {
        var tag = elem.tagName,
            type = elem.type,
            eventType = void 0;

        // deduce which event to bind to for this element
        if (tag === 'INPUT' && _.contains(['number', 'checkbox'], type) || tag === 'SELECT') {
            eventType = 'change';
        } else if (tag === 'INPUT' && _.contains(['text', 'email', 'tel'], type)) {
            eventType = 'keyup';
        }

        // prevents double binding if {event}.clear is already bound on that element
        $(elem).off(eventType + '.clear');

        // bind to either keyup.clear or change.clear depending on the element
        $(elem).on(eventType + '.clear', function () {
            var $errorTextElement = void 0;
            // lists field renders errors on the level of the input's parent
            if (this.tagName === 'INPUT' && this.type === 'checkbox') {
                $errorTextElement = $(this).parent().siblings('.ctct-form-errorMessage');
            } else {
                $errorTextElement = $(this).siblings('.ctct-form-errorMessage');
            }

            // hide the error message for the edited element
            $errorTextElement.hide();
            // hide global failure messages
            $form.find('#error_message_' + form_index).hide();
            $form.find('#network_error_message_' + form_index).hide();

            // take element out of error state and unbind event
            $(this).removeClass('is-error');
            $(this).off(eventType + '.clear');

            // if element is a date, we must take all 2-3 inputs out of error state and unbind
            var isDate = this.placeholder === 'MM' || this.placeholder === 'DD' || this.placeholder === 'YYYY';
            if (isDate) {
                var $adjacentInputs = $(this).siblings('input');
                $adjacentInputs.removeClass('is-error');
                $adjacentInputs.off(eventType + '.clear');
            }
        });
    }

    api = {
        /*
         * Renders a list of errors on the form
         *
         * @param {Object} form The form that failed to submit
         * @param {Array} unmappedErrors A list of errors to render
         */
        display: function display(form, unmappedErrors) {
            var form_index = form.form_index;

            // normalize error format, whether they're client or server-made

            var errors = _normalizeErrors(unmappedErrors, form);

            var $form = $('#ctct_form_' + form_index);

            // loop over errors and display each one
            errors.forEach(function (err) {
                var error_field = err.error_field,
                    error_codes = err.error_codes;

                var errText = _getErrorText(err);

                if (!_.isEmpty(error_field)) {
                    // append text to the error container for this field
                    var problemField = $form.find('#' + error_field + '_field_' + form_index);
                    problemField.find('.ctct-form-errorMessage').html(errText).show();

                    // style the input or select to show error
                    problemField.find('input:visible, select:visible').addClass('is-error');
                } else if (err.error_codes === 'network') {
                    $form.find('#network_error_message_' + form_index).show();
                } else {
                    // show generic error
                    $form.find('#error_message_' + form_index).show();
                }
            });

            /*
             * Attach self-unbinding handler to clear all errors
             * jQuery's "one" will not work as it executes
             * once per element per event, and we have multiple elements
             * and events.
             */
            $form.find('input, select').each(function (idx, elem) {
                _attachErrorClearCallback($form, form_index, elem);
            });
        }
    };

    return api;
}();

SignUpFormWidget.Handlers.submitForm = function (token, $elem, form) {
    var SOURCE_NAMES = { POPUP: 'Popup Form', INLINE: 'Inline Form' };
    var deferred = $.Deferred();

    var form_id = form.form_id,
        group_id = form.group_id,
        form_index = form.form_index;

    var recaptcha_key = SignUpFormWidget.Handlers.Config.getRecaptchaKey();
    var contact = SignUpFormWidget.Helpers.Collector.getFormInputs(form);
    contact.source_name = SOURCE_NAMES[form.type] ? SOURCE_NAMES[form.type] : 'Unknown';

    var data = {
        group_id: group_id,
        contact: contact
    };

    if (recaptcha_key !== null) {
        // if recaptcha is in use, send the fields, otherwise skip them so stuff doesn't blow up catastrophically
        data.token = token;
        data.recaptcha_key = recaptcha_key;
        data.is_test = SignUpFormWidget.Helpers.Env.isUsingTestRecaptchaKey();
    }

    var xhr = $.ajax({
        type: 'POST',
        crossDomain: true,
        url: 'https://visitor2.' + SignUpFormWidget.env + 'constantcontact.com/api/v1/signup_forms/' + form_id,
        contentType: 'application/json',
        data: JSON.stringify(data)
    });

    xhr.done(function () {
        $elem.find('#success_message_' + form_index).show();
        $elem.find('#ctct_form_' + form_index).hide();
        deferred.resolve();
    });

    xhr.fail(function (jqXHR, textStatus, errorThrown) {
        var errors = void 0;
        try {
            errors = JSON.parse(jqXHR.responseText);
        } catch (e) {
            errors = [];
        }
        if (!_.isArray(errors) || errors.length === 0) {
            errors = [{
                error_key: 'contacts.client.validation.error',
                error_codes: 'network'
            }];
        }
        SignUpFormWidget.Handlers.Error.display(form, errors);
        deferred.reject(errors);
    });

    xhr.complete(function () {
        $elem.find('.ctct-form-button').removeAttr('disabled');
    });

    return deferred.promise();
};

SignUpFormWidget.Render = {
    /**
    *
    * @param {jQuery object} $elem The jQuery-wrapped element to render into.
    * @param {Object} formConfig The signup form config to define form copy and style
    * @returns {undefined}
    */
    inlineForm: function inlineForm($elem, formConfig) {
        var deferred = $.Deferred();

        if ($elem.length === 0) {
            deferred.reject('Element doesn\'t exist');
        }
        if (!_.isObject(formConfig)) {
            deferred.reject('Config is required');
        }
        if (deferred.state() === 'rejected') {
            return deferred.promise();
        }

        try {
            SignUpFormWidget.Helpers.i18n.load(formConfig.config.language);
            var activeLanguage = SignUpFormWidget.Helpers.i18n.getActiveLanguage();
            var templateIdentifier = 'dist/templates/' + activeLanguage + '/inline_form.html';

            var config = SignUpFormWidget.Handlers.Config.getRenderConfig(formConfig);
            var requiredFields = SignUpFormWidget.Handlers.Config.getRequiredFields(formConfig);

            // load styles before drawing to minimize flashing/reflow of the DOM
            SignUpFormWidget.Handlers.Style.buildInlineStyles(formConfig);

            // draw element in DOM
            $elem.html(SignUpFormWidget.JST[templateIdentifier](config));

            if (_.contains(config.contact_fields, 'country') && _.contains(config.contact_fields, 'state')) {
                // Attach change events to the form's specific country select
                // Note that this only happens once at initial form render
                this.attachCountryChangeEvents($elem, formConfig, config);

                this.renderStateSelect($elem, formConfig, config);
            }

            // Prevents typing anything but digits in date fields
            this.restrictDateInputs($elem);

            // process required contact fields
            _.each(requiredFields, function (requiredFieldType) {
                $elem.find('#' + requiredFieldType + '_label_' + config.form_index).addClass('ctct-form-required');
            });

            deferred.resolve(config);
        } catch (err) {
            deferred.reject('Error rendering template[' + formConfig.name + ']: ' + err.message, err);
        }

        return deferred.promise();
    },


    /**
    *
    * @param {jQuery object} $elem The jQuery-wrapped element to render into.
    * @param {Object} formConfig The signup form config to define form copy and style
    * @returns {Promise}
    */
    popupForm: function popupForm($elem, formConfig) {
        var styleMethod = 'buildPopupStyles';
        var outerTemplate = 'popup_wrapper.html';
        var innerTemplate = 'popup_form.html';

        return this._doRender($elem, formConfig, styleMethod, outerTemplate, innerTemplate);
    },


    /**
    *
    * @param {jQuery object} $elem The jQuery-wrapped element to render into.
    * @param {Object} formConfig The signup form config to define form copy and style
    * @param {String} styleMethod method to use for setting up style overrides
    * @param {String} outerTemplate name of template for form wrapper
    * @param {String} innerTemplate method to use for rendering form contents
    * @returns {Promise}
    */
    _doRender: function _doRender($elem, formConfig, styleMethod, outerTemplate, innerTemplate) {
        var deferred = $.Deferred();
        if ($elem.length === 0) {
            deferred.reject('Element doesn\'t exist');
        }
        if (!_.isObject(formConfig)) {
            deferred.reject('Config is required');
        }
        if (deferred.state() === 'rejected') {
            return deferred.promise();
        }

        try {
            SignUpFormWidget.Helpers.i18n.load(formConfig.config.language);

            var config = SignUpFormWidget.Handlers.Config.getRenderConfig(formConfig);
            var requiredFields = SignUpFormWidget.Handlers.Config.getRequiredFields(formConfig);

            // load styles before drawing to minimize flashing/reflow of the DOM
            SignUpFormWidget.Handlers.Style[styleMethod](formConfig);

            var outerTemplatePath = this.localizedTemplate(outerTemplate);
            $elem.html(SignUpFormWidget.JST[outerTemplatePath](config));

            var innerTemplatePath = this.localizedTemplate(innerTemplate);
            $elem.find('.ctct-form-container').html(SignUpFormWidget.JST[innerTemplatePath](config));

            if (_.contains(config.contact_fields, 'country') && _.contains(config.contact_fields, 'state')) {
                // Attach change events to the form's specific country select
                // Note that this only happens once at initial form render
                this.attachCountryChangeEvents($elem, formConfig, config);

                this.renderStateSelect($elem, formConfig, config);
            }

            // Prevents typing anything but digits in date fields
            this.restrictDateInputs($elem);

            // process required contact fields
            _.each(requiredFields, function (requiredFieldType) {
                $elem.find('#' + requiredFieldType + '_label_' + config.form_index).addClass('ctct-form-required');
            });

            deferred.resolve(config);
        } catch (err) {
            deferred.reject('Error rendering form ' + formConfig.name + ': ' + err.message, err);
        }

        return deferred.promise();
    },
    renderStateSelect: function renderStateSelect($elem, form, config) {
        var countrySelectId = '#country_' + form.form_index;
        var selectedCountry = $elem.find(countrySelectId).val();

        var stateInputElem = 'input.state_' + form.form_index;
        var stateSelectElem = 'select.state_' + form.form_index;

        var states = config._defaults.states;
        if (states[selectedCountry] === undefined) {
            $(stateInputElem).show();
            $(stateInputElem).attr("id", 'state_' + form.form_index);
            $(stateSelectElem).hide();
            $(stateSelectElem).removeAttr("id");
        } else {
            var selectDefaultOption = '<option value="" selected="selected">--</option>';
            var stateSelectContents = selectDefaultOption;
            _.each(states[selectedCountry], function (state) {
                var stateOption = '<option value="' + state.stateProvCode + '">' + state.display + '</option>';
                stateSelectContents += stateOption;
            });
            $elem.find(stateSelectElem).html(stateSelectContents);
            $elem.find(stateInputElem).hide();
            $elem.find(stateInputElem).removeAttr("id");
            $elem.find(stateSelectElem).show();
            $elem.find(stateSelectElem).attr("id", 'state_' + form.form_index);
        }
    },
    attachCountryChangeEvents: function attachCountryChangeEvents($elem, form, config) {
        var _this = this;

        var thisFormId = 'country_' + form.form_index;
        $elem.find('#' + thisFormId).change(function () {
            _this.renderStateSelect($elem, form, config);
        });
    },
    restrictDateInputs: function restrictDateInputs($elem) {
        var dateInputs = $elem.find('input[type="number"]');
        dateInputs.on('keypress paste', function (e) {
            // Check if input is tab or backspace
            if (e.which !== 9 && e.which !== 8) {
                // Check if input is non-digit character
                if (!String.fromCharCode(e.which).match(/^\d+$/)) {
                    return false;
                }
            }
        });
    },
    localizedTemplate: function localizedTemplate(templateName) {
        return 'dist/templates/' + SignUpFormWidget.Helpers.i18n.getActiveLanguage() + '/' + templateName;
    }
};

SignUpFormWidget.Handlers.Style.loadBaseStyles();

/**
 * Handles rendering of all forms by type
 *
 * Sets up submit handler
 */
SignUpFormWidget.main = function () {

    /**
     * Sets the form last seen time, so we don't show it too often.
     * @param form The form to set the last seen time on.
     * @private
     */
    var _setFormLastSeenTime = function _setFormLastSeenTime(form) {
        window.localStorage.setItem('ctct_popup_last_seen_' + form.form_id, Date.now());
    };

    /**
     * Checks the form last seen time, and makes sure its eligible.
     * @param form The form to check.
     * @return {boolean} Whether the form should be shown or not.
     * @private
     */
    var _formEligibleToBeShown = function _formEligibleToBeShown(form) {
        var timestampStr = window.localStorage.getItem('ctct_popup_last_seen_' + form.form_id);
        if (timestampStr) {
            try {
                var lastSeen = parseInt(timestampStr);
                var timestamp = Date.now();
                var timeSince = timestamp - lastSeen;

                //TODO: FIXME LESLEY
                return timeSince > 86400000;
            } catch (e) {
                // LOL THAT WASN'T A NUMBER
            }
            return false;
        } else {
            return true;
        }
    };

    /**
     * Handles form input collection, input validation, submission, and response handling.
     *
     * @param {Object} $elem the rendered form element
     * @param {Object} form the form config object
     * @returns {undefined}
     */
    var _handleClickSubmitForm = function _handleClickSubmitForm($elem, form) {
        var contactData = SignUpFormWidget.Helpers.Collector.getFormInputs(form);

        if (!_.isEmpty(contactData) && $elem.find('.ctct-form-button').attr('disabled') !== 'disabled') {
            $elem.find('.ctct-form-button').attr('disabled', 'disabled');

            if (SignUpFormWidget.Handlers.Config.getRecaptchaKey() === null) {
                SignUpFormWidget.Handlers.submitForm(null, $elem, form).done(function () {
                    _setFormLastSeenTime(form);
                });
            } else {
                var recaptchaId = SignUpFormWidget.RenderedCaptchas['captcha_' + form.form_index];

                // reset recaptcha on every submit so its ready to run
                grecaptcha.reset(recaptchaId);

                // shows the challenge
                grecaptcha.execute(recaptchaId);
            }
        }
    };

    var _renderInlineForm = function _renderInlineForm(form) {
        var $elem = $('.ctct-inline-form[data-form-id="' + form.form_id + '"]');
        if ($elem.length === 0) {
            window.console.warn('Div for inline form "' + form.name + '" is missing. Was inline code installed?');
        } else {
            SignUpFormWidget.Render.inlineForm($elem, form).done(function () {
                if (SignUpFormWidget.Handlers.Config.getRecaptchaKey() !== null) {
                    // Prepares the recaptcha container. Last param inherits sitekey from container DOM node.
                    try {
                        var $recaptchaElem = $elem.find('#ctct_recaptcha_' + form.form_index).get(0);
                        var recaptchaId = grecaptcha.render($recaptchaElem, {
                            'callback': function callback(token) {
                                SignUpFormWidget.Handlers.submitForm(token, $elem, form);
                            }
                        }, true);
                        // store reference to ID for submit handler
                        SignUpFormWidget.RenderedCaptchas['captcha_' + form.form_index] = recaptchaId;
                    } catch (e) {
                        window.console.error('Error registering recaptcha for form "' + form.name + '"', e);
                    }
                }

                var $submitBtn = $elem.find('.ctct-form-button');
                $submitBtn.on('click', { form: form }, function (e) {
                    _handleClickSubmitForm($elem, e.data.form);
                });
            }).fail(function (msg, err) {
                window.console.error('Error rendering form ' + form.name + ', please republish this form.', err);
            });
        }
    };

    var _renderPopupForm = function _renderPopupForm(form) {
        var timingOpts = form.config.timing;
        // check for wrapper and re-use, just in case
        var $popupElem = $('.ctct-popup-form[data-form-id="' + form.form_id + '"]');
        if ($popupElem.length === 0) {
            $popupElem = $('<div class="ctct-popup-form" data-form-id="' + form.form_id + '"></div>');
            $('body').append($popupElem);
        } else if ($popupElem.find('.ctct-popup-wrapper').length > 0) {
            $popupElem.find('.ctct-popup-wrapper').ctctPopupForm('destroy');
        }
        SignUpFormWidget.Render.popupForm($popupElem, form).done(function () {
            var $popupWrapper = $popupElem.find('.ctct-popup-wrapper');
            if (SignUpFormWidget.Handlers.Config.getRecaptchaKey() !== null) {
                // Prepares the recaptcha container. Last param inherits sitekey from container DOM node.
                try {
                    var $recaptchaElem = $popupElem.find('#ctct_recaptcha_' + form.form_index).get(0);
                    var recaptchaId = grecaptcha.render($recaptchaElem, {
                        'callback': function callback(token) {
                            SignUpFormWidget.Handlers.submitForm(token, $popupElem, form).done(function () {
                                _setFormLastSeenTime(form);
                            });
                        }
                    }, true);
                    // store reference to ID for submit handler
                    SignUpFormWidget.RenderedCaptchas['captcha_' + form.form_index] = recaptchaId;
                } catch (e) {
                    window.console.error('Error registering recaptcha for form "' + form.name + '"', e);
                }
            }

            var $submitBtn = $popupElem.find('.ctct-form-button');
            $submitBtn.on('click', { form: form }, function (e) {
                _handleClickSubmitForm($popupElem, e.data.form);
            });
            var $closeBtn = $popupElem.find('.js-popup-close');
            $closeBtn.on('click', { form: form }, function (e) {
                _setFormLastSeenTime(form);
            });

            var options = {
                namespace: form.form_index
            };
            if (_.isObject(timingOpts)) {
                options.autoOpen = timingOpts.useDelay;
                options.timeDelay = timingOpts.delaySeconds * 1000;
                options.exitIntent = timingOpts.useExitIntent;
            }
            $popupWrapper.ctctPopupForm(options);
        }).fail(function (msg, err) {
            window.console.error('Error rendering form ' + form.name + ', please republish this form.', err);
        });
    };

    SignUpFormWidget.Handlers.Config.loadConfig().done(function (forms) {
        $.each(forms, function (idx, form) {
            switch (form.type) {
                case 'INLINE':
                    _renderInlineForm(form);
                    break;
                case 'POPUP':
                    if (_formEligibleToBeShown(form)) {
                        _renderPopupForm(form);
                    }
                    break;
                default:
                    window.console.debug('Unknown form type ' + form.type);
            }
        });
    }).fail(function (error) {
        window.console.warn(error);
    });
};

if (!SignUpFormWidget.previewMode) {
    SignUpFormWidget.main();
}

SignUpFormWidget.Instance.Preview = function (deferred, config, namespace) {
    var api = {};
    var destroyed = false;
    var $elem = void 0;

    if (config.debug) {
        console.log('Creating preview["' + namespace + '"] with config:', config);
    }

    if (deferred.state() !== 'rejected') {
        if (config.debug) {
            console.log('Preview["' + namespace + '"] ready!');
        }

        deferred.resolve(api);
    }

    /**
     * Destroys this instance of Preview.
     * @returns {Promise} Promise that will resolve when its done, or reject on fail/error.
     * @name SignUpFormWidget.Api.Preview.destroy
     */
    api.destroy = function () {
        var def = $.Deferred();

        if (config.debug) {
            console.log('.destroy["' + namespace + '"]:', arguments);
        }
        if (destroyed) {
            // if already destroyed, just return
            def.resolve();
            return def.promise();
        }
        destroyed = true; // mark destroyed to reject future calls

        // empty the parent element - must be done after models are cleaned up
        if ($elem) {
            $elem.html('');
        }

        def.resolve();

        return def.promise();
    };

    /**
     * @param {Object} jqElem The jQuery element that the form should be rendered in.
     * @param {Object} formConfig The config object for a specific form.
     * @returns {Promise} Promise that will resolve when the form has been rendered.
     * @name SignUpFormWidget.Api.Preview.previewForm
     */
    api.previewForm = function (jqElem, formConfig) {
        var def = $.Deferred();

        if (destroyed) {
            if (config.debug) {
                console.log('.previewForm["' + namespace + '"]: instance destroyed!');
            }
            def.reject('instance_destroyed');
            return def.promise();
        }

        if (jqElem instanceof $) {
            $elem = jqElem;
        } else {
            def.reject('object provided must be a jquery element');
            return def.promise();
        }

        if (config.debug) {
            console.log('.previewForm["' + namespace + '"]:', arguments);
        }

        // set the form in the config handler
        SignUpFormWidget.Handlers.Config.setForms([formConfig]);

        var renderMethod = formConfig.type.toLowerCase() + 'Form';
        var promise = SignUpFormWidget.Render[renderMethod]($elem, formConfig);

        promise.done(function (renderConfig) {
            if (config.debug) {
                window.console.info('.previewForm["' + namespace + '"]: template rendered!', renderConfig);
            }
            if (formConfig.type === 'POPUP') {
                // make popup visible for preview
                $elem.find('.ctct-popup-wrapper').addClass('ctct-popup-is-visible');
            }
            def.resolve();
        }).fail(function (errorMsg) {
            if (config.debug) {
                window.console.warn('.previewForm["' + namespace + '"]: failure rendering template: ' + errorMsg);
            }
            def.reject(errorMsg);
        });

        return def.promise();
    };

    return api;
};

SignUpFormWidget.Api.instance = function (config, namespace) {
    var def = void 0;

    def = $.Deferred();

    if (namespace === undefined && config === undefined) {
        namespace = 'preview_NO_CONFIG';
    } else {
        namespace = namespace || 'preview_' + config.selector;
    }

    if (_.isUndefined(config) || !_.isObject(config) || _.isEmpty(config)) {
        def.reject('config is required');
    } else {
        // check for required config items
        if (config.companyName === undefined || !_.isString(config.companyName)) {
            def.reject('companyName must be a string');
        }

        if (config.privacyUrl === undefined || !_.isString(config.privacyUrl)) {
            def.reject('privacyUrl must be a string');
        }

        if (config.countries === undefined || !_.isArray(config.countries)) {
            def.reject('countries must be an array');
        }

        if (config.statesProvinces === undefined || !_.isArray(config.statesProvinces)) {
            def.reject('statesProvinces must be an array');
        }
    }

    if (!_.isString(namespace)) {
        def.reject('namespace must be a string');
    }

    if (def.state() !== 'rejected') {
        // set config items
        SignUpFormWidget.Handlers.Config.setCompanyName(config.companyName);
        SignUpFormWidget.Handlers.Config.setPrivacyUrl(config.privacyUrl);
        SignUpFormWidget.Handlers.Config.setCountries(config.countries);
        SignUpFormWidget.Handlers.Config.setStates(config.statesProvinces);

        // create Preview instance
        if (!SignUpFormWidget._instances[namespace]) {
            // only create each instance once
            SignUpFormWidget._instances[namespace] = new SignUpFormWidget.Instance.Preview(def, config, namespace);
        } else if (config.debug) {
            window.console.log('Preview["' + namespace + '"] previously instantiated! Doing nothing.');
        }
    }

    return def.promise();
};

/**
 * Destroys & cleans up all current instances.
 * @type {{instance: SignUpFormWidget.Api.destroyAll}}
 */
SignUpFormWidget.Api.destroyAll = function () {
    if (SignUpFormWidget._instances) {
        var keys = Object.keys(SignUpFormWidget._instances);
        _.each(keys, function (key) {
            SignUpFormWidget._instances[key].destroy();
            delete SignUpFormWidget._instances[key];
        });
    }
};

    SignUpFormWidget.VERSION = '1.0.79';

    SignUpFormWidget.noConflict = function() {
        root.SignUpFormWidget = SignUpFormWidget;
        return this;
    };

    return SignUpFormWidget;
}));

//# sourceMappingURL=signup-form-widget.js.map
