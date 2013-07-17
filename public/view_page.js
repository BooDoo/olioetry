function togglePoemLanguage() {
	var targetBox = $(this).closest(".contentBox");
        $('span', targetBox).removeClass('hidden').removeClass('force');
        if (targetBox.hasClass('en')) {
                targetBox.removeClass('en').addClass('jp')
        }
        else {
                targetBox.removeClass('jp').addClass('en');
        }
}

function toggleForce(e) {
        $(this).removeClass("force").addClass("hidden");
        $(this).siblings().addClass("force").removeClass("hidden");
        var cousins = $("." + $(this).siblings().get(0).classList[0], $(this).parent().parent());
        if (cousins.length === cousins.map(function () {if ($(this).hasClass("force")) return true;}).length)
                togglePoemLanguage.call($(this)[0]);
}

$(window).load(function () {
        $(".toggleButton").click(togglePoemLanguage);
        $(".poem > .line > span").click(toggleForce);
});