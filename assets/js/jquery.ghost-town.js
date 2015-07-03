/**
* This software has been modified - see "EDIT:" comments inline
*
**/
/*!
 * @package jquery.ghostTown
 * @version 0.1.0
 * @Copyright (C) 2014 Kris Van Houten (krivaten@gmail.com)
 * @License MIT
 */
;(function($) {

    defaults = {
        feed: '/rss',
        limit: 0,
        content: function(post) {
            return '<li><a href="' + post.url + '""><strong>' + post.title + '</strong><br /><small>' + post.pubDate + '</small></a></li>';
        }
    }

    // Set up necessary element and properties
    function GhostTown(element, options) {
        // Empty element and get tag name
        this.tag = $(element).empty().data('tag').split('::');

        // Set element
        this.element = element;

        // Establish options
        this.options = $.extend({}, defaults, options);

        // Go get the RSS feed of the specified tag
        this.fetchTagRss();
    };

    // Render tag contents
    GhostTown.prototype.displayTagContents = function(posts) {
        var self = this,
            limit = self.options.limit,
            liClass = self.options.liClass,
            aClass = self.options.aClass,
            content = self.options.content,
            count = 0;

        // Append posts to element
        posts.forEach(function(post) {
            if (!limit || count < self.options.limit) {
                $(self.element).append($(content(post)));
            }
            count++;
        });

        // Notify if no posts present
        if (count == 0) {
            $(this.element).append($('<li class="' + liClass + '">No posts found with tag: <strong>' +  this.tag + '</strong></li>'));
        }
    };

    // Go get the RSS feed of the specified tag
    GhostTown.prototype.fetchTagRss = function() {
        var feeds = [],
            self = this;

        // Check if we're on the live site (hosted under '/blog')
        var pathSegment = window.location.pathname.replace(/^\//,'').split('/',1)[0];
        var subdirectory = '';

        if (pathSegment == 'blog') subdirectory = '/blog';

        var url = subdirectory + this.options.feed;
        var url2 = null;

        if (typeof(this.tag[0]) != 'undefined' && this.tag[0]){
            var tag1 = this.tag[0].replace(/[:\/\?#\[\]@!$&'()*+,;=\\]/g, '').replace(/[\:\s]/g,'-');
            url = subdirectory + '/tag/' + tag1.toLowerCase() + this.options.feed;
        }
        if (typeof(this.tag[1]) != 'undefined'){
            var tag2 = this.tag[1].replace(/[:\/\?#\[\]@!$&'()*+,;=\\]/g, '').replace(/[\:\s]/g,'-');
            url2 = subdirectory + '/tag/' + tag2.toLowerCase() + this.options.feed;
        }

        $.ajax({
            url: url,
            type: 'GET'
        })
            .done(function(data, textStatus, xhr) {
                var posts;

                // Collect posts
                posts = self.extractPosts(new Array(data));

                // If there's a second tag, grab that one as well
                if (url2){
                    $.ajax({
                        url: url2,
                        type: 'GET'
                    })
                        .done(function(data, textStatus, xhr) {
                            // Collect posts
                            var posts2 = self.extractPosts(new Array(data));

                            // take 3 posts from the first tag, and 2 from the second, and combine them
                            posts = posts.slice(0,3);
                            posts2 = posts2.slice(0,2);
                            posts = posts.concat(posts2);

                            // Render tag contents
                            self.displayTagContents(posts);
                        });

                }else {
                    // Render tag contents
                    self.displayTagContents(posts);
                }
            })
            .fail(function(error) {
                $(self.element).append($('<li class="' + self.options.liClass + '">' + error.statusText + '</li>'));
            });

    };

    // Extract posts from RSS feed
    GhostTown.prototype.extractPosts = function(feeds) {
        var posts = [], items = [];

        feeds.forEach(function(feed) {
            items = $.merge(items, $(feed).find('item'));
        });

        for (var i = 0; i < items.length; i++) {
            var item = $(items[i]);

            // Extract necessary properties
            if (item.find('title').text()) {
                if (item.find('link').text() != location.href) { // EDIT: Exclude the current page
                    posts.push({
                        title: item.find('title').text(),
                        url: item.find('link').text(),
                        pubDate: item.find('pubDate').text()
                    });
                }
            }
        }

        return posts;
    };

    // Instantiate ghostTown
    $.fn.ghostTown = function(options) {
        return this.each(function() {
            new GhostTown(this, options);
        });
    };


})(jQuery);