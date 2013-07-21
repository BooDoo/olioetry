var draggingMagnet = undefined;
var alreadySaved = false;

function handleMagnetDragStart(e) {
	// alert("dragstart");
	e.originalEvent.dataTransfer.setData('text/plain', this.innerText);
	e.originalEvent.dataTransfer.effectAllowed = 'move';
	draggingMagnet = this;
}

function handleMagnetDragEnd(e) {
	// draggingMagnet = undefined;
}

function handleMagnetDragOver(e) {
	// alert("dragover");

	if ($(e.target).closest(".composerLineContent") ||
		$(e.target).closest(".wordList")) {
		if (e.preventDefault) {
			e.preventDefault();
		}

		e.originalEvent.dataTransfer.dropEffect = 'move';

		return false;
	} else {
		return true;
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

	var realDropTarget = $(e.target).closest(".composerLineContent");
	var insertMagnet = undefined;

	// if we're dragging the word from the word list, clone it
	// otherwise, move it
	if ($(draggingMagnet).closest(".wordList").length > 0) {
		console.log("dragging from word list; cloning");
		insertMagnet = $(draggingMagnet).clone(true);
	} else if ($(draggingMagnet).closest("#composerDragDrop").length > 0) {
		console.log("dragging from composer; moving");
		insertMagnet = draggingMagnet;
	} else {
		console.log("dragging from somewhere else?");
	}

	for (var childIndex = 0; childIndex < realDropTarget.children().length; childIndex++) {
		var child = realDropTarget.children()[childIndex];

		var leftCoord = $(child).offset().left + ($(child).width() / 2);

		if (dropX < leftCoord) {
			console.log("drop X (" + dropX + ") before child " + childIndex + " middle (" + leftCoord + ")");
			$(child).before(insertMagnet);
			draggingMagnet = undefined;
			return false;
		} else {
			console.log("drop X (" + dropX + ") after child " + childIndex + " middle (" + leftCoord + ")");
		}
	}

	console.log("drop X (" + dropX + ") after all children, appending");
	realDropTarget.append(insertMagnet);
	draggingMagnet = undefined;

	alreadySaved = false;
	updateSaveState();
	return false;
}

function dropIntoWordList(e) {
	if ($(draggingMagnet).closest(".wordList").length > 0) {
		console.log("moving from word list; do nothing");
		e.preventDefault();
	} else if ($(draggingMagnet).closest("#composerDragDrop").length > 0) {
		console.log("moving from composer; delete");
		alreadySaved = false;
		$(draggingMagnet).remove();
		e.preventDefault();
	} else {
		console.log("moving from somewhere else?");
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

function themeMode() {
	$('.wordTitlebox').addClass('hidden');
	$('.realTitlebox').removeClass('hidden');
}

function wordMode() {
	$('.realTitlebox').addClass('hidden');
	$('.wordTitlebox').removeClass('hidden');
}

// translateTouchEvents() by StackOverflow user Erwinus:
// http://stackoverflow.com/questions/5186441/javascript-drag-and-drop-for-touch-devices/12558033#12558033
function translateTouchEvents(oo,bIgnoreChilds)
	{
	 if( !$(oo)[0] )
		{ return false; }

	 if( !window.__touchTypes )
	 {
		 window.__touchTypes  = {touchstart:'mousedown',touchmove:'mousemove',touchend:'mouseup'};
		 window.__touchInputs = {INPUT:1,TEXTAREA:1,SELECT:1,OPTION:1,'input':1,'textarea':1,'select':1,'option':1};
	 }

	$(oo).bind('touchstart touchmove touchend', function(ev)
	{
			var bSame = (ev.target == this);
			if( bIgnoreChilds && !bSame )
			 { return; }

			var b = (!bSame && ev.target.__ajqmeclk), // Get if object is already tested or input type
					e = ev.originalEvent;
			if( b === true || !e.touches || e.touches.length > 1 || !window.__touchTypes[e.type]  )
			 { return; } //allow multi-touch gestures to work

			var oEv = ( !bSame && typeof b != 'boolean')?$(ev.target).data('events'):false,
					b = (!bSame)?(ev.target.__ajqmeclk = oEv?(oEv['click'] || oEv['mousedown'] || oEv['mouseup'] || oEv['mousemove']):false ):false;

			if( b || window.__touchInputs[ev.target.tagName] )
			 { return; } //allow default clicks to work (and on inputs)

			// https://developer.mozilla.org/en/DOM/event.initMouseEvent for API
			var touch = e.changedTouches[0], newEvent = document.createEvent("MouseEvent");
			newEvent.initMouseEvent(window.__touchTypes[e.type], true, true, window, 1,
							touch.screenX, touch.screenY,
							touch.clientX, touch.clientY, false,
							false, false, false, 0, null);

			touch.target.dispatchEvent(newEvent);
			e.preventDefault();
			ev.stopImmediatePropagation();
			ev.stopPropagation();
			ev.preventDefault();
	});

	return true;
};

function buildWord(titlebox, word) {
	var magnet = $('<div draggable="true" class="words"><h1 class="magnet" /></div>');
	magnet.children(".magnet").text(word);

	magnet.on("dragstart", handleMagnetDragStart);
	magnet.on("dragend", handleMagnetDragEnd);
  translateTouchEvents(magnet, true);
	$(titlebox).find('.wordList').append(magnet);
}

function buildWords(titlebox, theme, words) {
	$(titlebox).find(".titleLine").text(theme);

	words.sort();

	for (var idx in words) {
		buildWord(titlebox, words[idx]);
	}

	wordMode();
}

function getWords(themeId) {
	$.getJSON('/api/newpoem/' + themeId, function(data) {
		buildWords($("#thematicWords"), "thematic words", data.words);
		buildWords($("#commonWords"), "common words", data.common_words);
	});
}

function chooseTheme(eventObject) {
	// walk up to the theme ID
	var themeId = $(this).closest('.themeId');
	$('#composeTitle').text(themeId.find('.title').text());
	$('#composeTitle').removeClass("select-title");

	getWords(themeId[0].themeId);
}

function buildTheme(id, theme) {
	var dom = $('<li class="themeId"><h1 class="title"></h1></li>');
	dom.children(".title").text(theme);
	dom[0].themeId = id;

	dom.on("click", chooseTheme);
	$('.titleList').append(dom);
}

function buildThemes(themes) {
	for (var id in themes) {
		buildTheme(id, themes[id]);
	}

	themeMode();
}

function getThemes() {
	$.getJSON('/api/themes', function(data) {
		buildThemes(data);
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

function submit() {
	if (!canSave()) {
		return;
	}

	var lines = [];

	$('.composerLineContent').each(function (index) {
		lines[index] = $(this).find('.magnet')
							  .map(function (index, word) { return word.innerText })
							  .get();
	});

	var poem = {
		title: $("#composeTitle").text(),
		author: $("#authorName").text(),
		lines: lines
	};

	$.post('/api/submitpoem', JSON.stringify(poem), showSaved);
	alreadySaved = true;
	updateSaveState();

	// return words;
}

$(window).load(function () {
	$("#saveButton").click(submit);
	$("#clearButton").click(clearComposer);

	$(".wordList").on("dragover", handleMagnetDragOver);
	$(".wordList").on("drop", dropIntoWordList);

	$(".composerLineContent").on("dragover", handleMagnetDragOver);
	$(".composerLineContent").on("drop", dropIntoComposer);

	$("#authorName").on("keyup", authorChanged);

	$("#authorName").on("focus", startEditingAuthor);
	$("#authorEditHint").click(startEditingAuthor);

	getThemes();

	console.log("hey hey hey");
});