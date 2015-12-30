/**
 * Main JS file for Casper behaviours
 */

/* globals jQuery, document */
(function ($, sr, undefined) {
    "use strict";

    var $document = $(document),

        // debouncing function from John Hann
        // http://unscriptable.com/index.php/2009/03/20/debouncing-javascript-methods/
        debounce = function (func, threshold, execAsap) {
            var timeout;

            return function debounced () {
                var obj = this, args = arguments;
                function delayed () {
                    if (!execAsap) {
                        func.apply(obj, args);
                    }
                    timeout = null;
                }

                if (timeout) {
                    clearTimeout(timeout);
                } else if (execAsap) {
                    func.apply(obj, args);
                }

                timeout = setTimeout(delayed, threshold || 100);
            };
        };

    $document.ready(function () {

        var $postContent = $(".post-content");
        $postContent.fitVids();

        function updateImageWidth() {
            var $this = $(this),
                contentWidth = $postContent.outerWidth(), // Width of the content
                imageWidth = this.naturalWidth; // Original image resolution

            if (imageWidth >= contentWidth) {
                $this.addClass('full-img');
            } else {
                $this.removeClass('full-img');
            }
        }

        var $img = $("img").on('load', updateImageWidth);
        function casperFullImg() {
            $img.each(updateImageWidth);
        }

        casperFullImg();
        $(window).smartresize(casperFullImg);

        // Add images lightbox
        $('.post-header img, .post-content img').each(function(img){
            if ($(this).parents('a').length == 0){
                $(this).wrap('<a href="' + $(this).attr('src') + '" data-lightbox="lightbox">');
            }else{
                $(this).closest('a').data('lightbox', 'lightbox');
            }
        })
        lightbox.option({
            'resizeDuration': 200,
            'wrapAround': true
        })

        $(".scroll-down").arctic_scroll();

        // Handle subscribe form
        $(document).on('submit', 'form.subscribe-form', function(e){
            e.preventDefault();
            var form = $(e.currentTarget);
            var input = form.find('.email');
            var status = form.find('#subscribeStatus');

            if (input.val()){
                // Disable form while processing
                form.attr('disabled', true);
                form.find(':input, button').attr('disabled', true);

                // Clear status message
                status.attr('class', '').html('');

                $.ajax({
                    method: "PUT",
                    url: 'https://api.sameroom.io/mailinglist',
                    dataType: 'json',
                    contentType: 'application/json',
                    data: JSON.stringify({
                        email: input.val()
                    }),
                    success: function (response) {
                        // Success
                        input.val('');
                        status.html('Thank you!').addClass('success');
                    },
                    error: function () {
                        // Error
                        status.html('Sorry, an error occurred').addClass('error');

                    },
                    complete: function(){
                        // Re-enable form
                        form.attr('disabled', false);
                        form.find(':input, button').attr('disabled', false);
                    }
                });
            }
            return false;
        })

    });

    // smartresize
    jQuery.fn[sr] = function(fn) { return fn ? this.bind('resize', debounce(fn)) : this.trigger(sr); };

    // Arctic Scroll by Paul Adam Davis
    // https://github.com/PaulAdamDavis/Arctic-Scroll
    $.fn.arctic_scroll = function (options) {

        var defaults = {
            elem: $(this),
            speed: 500
        },

        allOptions = $.extend(defaults, options);

        allOptions.elem.click(function (event) {
            event.preventDefault();
            var $this = $(this),
                $htmlBody = $('html, body'),
                offset = ($this.attr('data-offset')) ? $this.attr('data-offset') : false,
                position = ($this.attr('data-position')) ? $this.attr('data-position') : false,
                toMove;

            if (offset) {
                toMove = parseInt(offset);
                $htmlBody.stop(true, false).animate({scrollTop: ($(this.hash).offset().top + toMove) }, allOptions.speed);
            } else if (position) {
                toMove = parseInt(position);
                $htmlBody.stop(true, false).animate({scrollTop: toMove }, allOptions.speed);
            } else {
                $htmlBody.stop(true, false).animate({scrollTop: ($(this.hash).offset().top) }, allOptions.speed);
            }
        });

    };

    $(document).ready(function(){
        function randomString(length) {
            var part = 10;
            if (length > part) {
                return randomString(part) + randomString(length - part);
            }
            return Math.round((Math.pow(36, length + 1) - Math.random() * Math.pow(36, length))).toString(36).slice(1);
        }

        var deviceId = '';
        try {
            deviceId = localStorage['deviceId'];
        } catch (e) {}
        var deviceId = deviceId || randomString(36);

        try {
            localStorage['deviceId'] = deviceId;
        } catch (e) {}

        var token;
        try {
            token = localStorage['token'];
        } catch (e) { }

        var beforeSend = function(xhr) {
            if (token) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + token);
            }
        };

        var data = {
            url: window.location.pathname + window.location.search,
            referrer: document.referrer,
            device_id: deviceId
        };

        var data = {
            id: randomString(36),
            name: 'page_view',
            data: data
        };

        $.ajax({
            type: 'POST',
            dataType: 'json',
            url: "https://api.sameroom.io/events",
            contentType: 'application/json',
            data: JSON.stringify(data),
            beforeSend: beforeSend
        });

        if (window.Intercom) {
            var INTERCOM_APP_ID="e1h1ux8b";

            Intercom('boot', {
                app_id: INTERCOM_APP_ID,
            });

            if (token) {
                $.ajax({
                    type: 'GET',
                    dataType: 'json',
                    url: "https://api.sameroom.io/session",
                    beforeSend: beforeSend
                }).done(function(data) {
                    var agent = data.agent || {};
                    var agentParams = {
                        name: agent.display_name || agent.common_name,
                        email: agent.email,
                        user_id: agent.id,
                        user_hash: agent.intercom_user_hash,
                    };
                    Intercom('update', agentParams)
                });
            }
        }
    });

})(jQuery, 'smartresize');
