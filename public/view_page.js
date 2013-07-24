var voted = ",";

function togglePoemLanguage() {
	var targetBox = $(this).closest(".contentBox");
        $('span', targetBox).removeClass('hidden force');
        if (targetBox.hasClass('en')) {
                targetBox.removeClass('en').addClass('jp')
        }
        else {
                targetBox.removeClass('jp').addClass('en');
        }
}

function votePoemUp() {
        var poem_id = $(this).closest(".contentBox")[0].id;

        if (localStorage && localStorage.voted)
                voted = localStorage.getItem('voted');

        if (voted.indexOf("," + poem_id + ",") === -1) {
                $.post('/api/upvote/' + poem_id, "", 
                        function (e) { return; });

                voted += poem_id + ",";
        }

        if (localStorage)
                localStorage.setItem('voted', voted)

        $(this).remove();
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
        $(".upvote").click(votePoemUp);

});