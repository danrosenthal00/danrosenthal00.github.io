jQuery.fn.setTileHeight = function () {
    $(this).each(function () {
        var $frontCard = $(this).find('.flip-front');
        var $backCard = $(this).find('.flip-back');

        var topMargin = $frontCard.height();
        $backCard.css('margin-top', (topMargin * -1) + "px");
    });
}

jQuery.fn.flip = function () {
    $(this).setTileHeight();
    $(this).on('click', function (e) {
        if ($(e.target).is('a:not(.flip-enabled),button:not(.flip-enabled),input:not(.flip-enabled),select:not(.flip-enabled),.flip-disabled') || $(e.target).parents('.flip-disabled').length) return;
        $(this).find('.flip-container').toggleClass('flipped');
    });
}