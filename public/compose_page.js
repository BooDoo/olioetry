var alreadySaved = false,
	draggingMagnet,
	$magnets;

function togglePoemLanguage() {
	var targetBox = $(this).closest(".en,.jp");
        $('.magnet.hidden, .magnet.force', targetBox).removeClass('hidden force');
        if (targetBox.hasClass('en')) {
                targetBox.removeClass('en').addClass('jp')
        }
        else {
                targetBox.removeClass('jp').addClass('en');
        }
}

function handleMagnetDragStart(e) {
	// alert("dragstart");
	e.originalEvent.dataTransfer.setData('text/plain', this.innerText); //TODO: Go up a level?
	e.originalEvent.dataTransfer.effectAllowed = 'move';
	draggingMagnet = this;
}

function handleMagnetDragEnd(e) {
	// draggingMagnet = undefined;
}

function handleMagnetDragOver(e) {
	//alert("dragover");

	if ($(e.target).closest(".composerLineContent") ||
		$(e.target).closest(".wordList")) {
		if (e.preventDefault) {
			e.preventDefault();
		}

		e.originalEvent.dataTransfer.dropEffect = 'move';

		return false;
	} else {
		//console.log("non-composer/wordList dragOver");
		return true;
	}
}

function toggleForce() {
        $(this).removeClass("force").addClass("hidden");
        $(this).siblings().removeClass("hidden").addClass("force");
	if ($(this, 'table').length) {
		var cousins = $("." + $(this).siblings().get(0).classList[1], '.composerTable');
		console.log(cousins.length);
		if (cousins.length === cousins.map(function () {if ($(this).hasClass("force")) return true;}).length)
			togglePoemLanguage.call($('#composeModal .toggleButton')[0]);
	}
}

function canSave() {
	return (alreadySaved == false) && ($(".composerLineContent .words").length > 0);
}

function updateSaveState() {
	if (canSave()) {
		$("#saveButton").removeClass("disabled");
	} else {
		$("#saveButton").addClass("disabled");
	}
}

function dropIntoComposer(e) {
	var dropX, dropY;
	dropX = e.originalEvent.x;
	dropY = e.originalEvent.y;
        doSwap = false;

	var realDropTarget = $(e.target).closest(".composerLineContent");
	var insertMagnet = undefined;

	// if we're dragging the word from the word list, clone it
	// otherwise, move it.
	if ($(draggingMagnet).closest(".wordList").length > 0) {
		//console.log("dragging from word list; cloning");
		insertMagnet = $(draggingMagnet).clone(true);
		$(insertMagnet).children().removeClass("hidden force");
	} else if ($(draggingMagnet).closest("#composerDragDrop").length > 0) {
		//console.log("dragging from composer; moving/swapping");
                doSwap = true;
		insertMagnet = $(draggingMagnet);
	} else {
		//console.log("dragging from somewhere else?");
	}

        if (realDropTarget.children().length) {
                //console.log("Already a line here...");
                if (doSwap) {
                        //console.log("...swapping lines.");
                        realDropTarget.children().appendTo($(draggingMagnet).parent());
                }
                else {
                        //console.log("...replacing it.");
                        realDropTarget.children().remove();
                }
        }

	realDropTarget.append(insertMagnet);
	draggingMagnet = undefined;

	alreadySaved = false;
	updateSaveState();
	return false;
}

function dropIntoWordList(e) {
	if ($(draggingMagnet).closest(".wordList").length > 0) {
		//console.log("moving from word list; do nothing");
		e.preventDefault();
	} else if ($(draggingMagnet).closest("#composerDragDrop").length > 0) {
		//console.log("moving from composer; delete");
		alreadySaved = false;
		$(draggingMagnet).remove();
		e.preventDefault();
	} else {
		//console.log("moving from somewhere else?");
	}

	updateSaveState();
}

function clearComposer() {
	$(".composerLineContent").empty();
}

function startEditingAuthor() {
	var dom = $("#authorName")[0];
	dom.focus();
	window.getSelection().selectAllChildren(dom);

	return true;
}

function startEditingTitle() {
	var dom = $("#poemTitle")[0];
	dom.focus();
	window.getSelection().selectAllChildren(dom);

	return true;
}

function buildWord(titlebox, word) {
	var magnet = $('<div draggable="true" class="words"><h1 class="magnet en" /><h1 class="magnet jp"></div>');
	magnet.children(".magnet.en").text(word.e);
	magnet.children(".magnet.jp").text(word.j);

        magnet.children().on("click", toggleForce);
	magnet.on("dragstart", handleMagnetDragStart);
	magnet.on("dragend", handleMagnetDragEnd);
	$(titlebox).find('.wordList').append(magnet);
}

function buildWords(titlebox, words) {
	for (var idx in words) {
		buildWord(titlebox, words[idx]);
	}
        $magnets = $('.wordList > .words'); //TODO : load in batches (button? infinite scroll?)
}

function getWords(themeId) {
	$.getJSON('/api/newpoem', function(data) {
		buildWords($("#thematicWords"), data.words);
	});
}

function showSaved() {
	$("#savedMessage").removeClass("hidden");
}

function authorChanged() {
	$("#authorName").removeClass("anonymous");
	$("#authorName").addClass("nonymous");
	$("#authorEditHint").addClass("hidden");
}

function titleChanged() {
	$("#poemTitle").removeClass("untitled");
	$("#poemTitle").addClass("titled");
}

function submit() {
	if (!canSave()) {
		return;
	}

	var lines = [];

	$('.composerLineContent').each(function (index) {
		//MAYBE: Support multiple tokens on a line?
		lines[index] = {en: $('.en', this).text(), jp: $('.jp', this).text()};
	});

	var poem = {
		title: $("#poemTitle").text() || "untitled",
		author: $("#authorName").text(),
		lines: lines
	};

	$.post('/api/submitpoem', poem, showSaved);
	alreadySaved = true;
	updateSaveState();

	// return words;
}

function magnetFilter() {
	var criterion = new RegExp($(this).val().replace(/ +/g, ' ').replace(/\s+$/, "(?:\\s|$)").replace(/^\s/, "(?:^|\\s)").toLowerCase());
	console.log(criterion);
	$magnets.show().filter(function() {
		var enText = $(".en", this).text().replace(/\s+/g, ' ').toLowerCase();
		var jpText = $(".jp", this).text().replace(/\s+/g, ' ').toLowerCase();
		return (!~enText.search(criterion) && !~jpText.search(criterion));
	}).hide();
}

$(window).load(function () {
	$("#saveButton").click(submit);
	$("#clearButton").click(clearComposer);
	$(".toggleButton").click(togglePoemLanguage);

	$(".wordList").on("dragover", handleMagnetDragOver);
	$(".wordList").on("drop", dropIntoWordList);

	$(".composerLineContent").on("dragover", handleMagnetDragOver);
	$(".composerLineContent").on("drop", dropIntoComposer);

	$("#authorName").on("keyup", authorChanged);

	$("#authorName").on("focus", startEditingAuthor);
	$("#authorEditHint").click(startEditingAuthor);

        $("#poemTitle").on("focus", startEditingTitle);
        $("#poemTitle").on("keyup", titleChanged);

	$("#filterBox").on("keyup", magnetFilter);

	//Scope this better? e.g. make a trash can icon?
	$("body").on("dragover", handleMagnetDragOver);
	$("body").on("drop", dropIntoWordList)

	getWords(1);

	//console.log("hey hey hey");
});