/*global debug, description, shouldBe shouldBeNull, shouldBeNonNull,
         window, document, Cursor*/
description(
"Test the Cursor class."
);

var t = null; // t is a variable to put the test context
(function () {
    function setSelection(selection, startnode, startoffset, endnode,
            endoffset) {
        // call createRange() on the document, even if startnode is the document
        var range = (startnode.ownerDocument || startnode).createRange();
        selection.removeAllRanges();
        range.setStart(startnode, startoffset);
        if (endnode) {
            range.setEnd(endnode, endoffset);
        } else {
            range.setEnd(startnode, startoffset);
        }
        selection.addRange(range);
    }

    function setupEmptyDoc() {
        var selection = window.getSelection(),
            doc = document.implementation.createDocument(null, "p", null),
            cursor = new Cursor(selection, doc);
        shouldBeNonNull(selection);
        t = { selection: selection, doc: doc, cursor: cursor };
    }
 
    function setupSimpleTextDoc() {
        setupEmptyDoc();
        t.textnode = t.doc.createTextNode("abc");
        t.doc.documentElement.appendChild(t.textnode);
    }
    
    var tests = {
        // create a document, add a cursor and check that the cursor is present
        testOnEmptyDocument1: function () {
            // if the document is the container of the selection, the cursor
            // can not be in the DOM
            setupEmptyDoc(); 
            setSelection(t.selection, t.doc, 0);
            t.cursor.updateToSelection();
            shouldBeNull("t.cursor.getNode().parentNode");
        },
        testOnEmptyDocument2: function () {
            setupEmptyDoc(); 
            setSelection(t.selection, t.doc.documentElement, 0);
            t.cursor.updateToSelection();
            shouldBeNonNull("t.cursor.getNode().parentNode");
            shouldBeNull("t.cursor.getNode().previousSibling");
            shouldBeNull("t.cursor.getNode().nextSibling");
        },
        testOnSimpleText: function () { 
            setupSimpleTextDoc(); 
            // put the cursor at the start of the text node 
            setSelection(t.selection, t.textnode, 0);
            t.cursor.updateToSelection();
            shouldBeNonNull("t.cursor.getNode().parentNode");
            shouldBeNull("t.cursor.getNode().previousSibling");
            shouldBe("t.cursor.getNode().nextSibling.nodeValue", "'abc'");
        },
        testOnSimpleText2: function () { 
            setupSimpleTextDoc(); 
            // put the cursor in the middle of the text node 
            setSelection(t.selection, t.textnode, 1);
            t.cursor.updateToSelection();
            shouldBeNonNull("t.cursor.getNode().parentNode");
            shouldBe("t.cursor.getNode().previousSibling.nodeValue", "'a'");
            shouldBe("t.cursor.getNode().nextSibling.nodeValue", "'bc'");
        },
        testOnSimpleText3: function () { 
            setupSimpleTextDoc(); 
            // put the cursor at the end of the text node
            setSelection(t.selection, t.textnode, 3);
            t.cursor.updateToSelection();
            shouldBeNonNull("t.cursor.getNode().parentNode");
            shouldBe("t.cursor.getNode().previousSibling.nodeValue", "'abc'");
            shouldBeNull("t.cursor.getNode().nextSibling");
        },
        testOnSimpleText4: function () {
            var textnode2; 
            setupSimpleTextDoc(); 
            // put the cursor between 'a' and 'b', then change the selection to
            // be between 'b' and 'c' and update the cursor
            setSelection(t.selection, t.textnode, 1);
            t.cursor.updateToSelection();
            textnode2 = t.cursor.getNode().nextSibling;
            setSelection(t.selection, textnode2, 1);
            t.cursor.updateToSelection();
            shouldBeNonNull("t.cursor.getNode().parentNode");
            shouldBe("t.cursor.getNode().previousSibling.nodeValue", "'ab'");
            shouldBe("t.cursor.getNode().nextSibling.nodeValue", "'c'");
        },
        testOnSimpleText5: function () {
            var textnode2; 
            setupSimpleTextDoc(); 
            // put the cursor between 'a' and 'b', then change the selection to
            // span the entire text and update the cursor
            setSelection(t.selection, t.textnode, 1);
            t.cursor.updateToSelection();
            textnode2 = t.cursor.getNode().nextSibling;
            setSelection(t.selection, t.textnode, 0, textnode2, 2);
            t.cursor.updateToSelection();
            shouldBe("t.selection.rangeCount", "1");
            shouldBeNull("t.cursor.getNode().parentNode");
            t.range = t.selection.getRangeAt(0);
            shouldBe("t.range.startContainer", "t.textnode");
            shouldBe("t.range.startOffset", "0");
            shouldBe("t.range.endContainer", "t.textnode");
            shouldBe("t.range.endOffset", "3");
        },
        testOnSimpleText5b: function () {
            var textnode2; 
            setupSimpleTextDoc(); 
            setSelection(t.selection, t.textnode, 1);
            t.cursor.updateToSelection();
            textnode2 = t.cursor.getNode().nextSibling;
            setSelection(t.selection, t.textnode.parentNode, 1, textnode2, 2);
            t.cursor.updateToSelection();
            shouldBe("t.selection.rangeCount", "1");
            shouldBeNull("t.cursor.getNode().parentNode");
            t.range = t.selection.getRangeAt(0);
            shouldBe("t.range.startContainer", "t.textnode");
            shouldBe("t.range.startOffset", "1");
            shouldBe("t.range.endContainer", "t.textnode");
            shouldBe("t.range.endOffset", "3");
        },
        testOnSimpleText6: function () {
            var somenode, textnode2;
            setupSimpleTextDoc();
            // add a child node to the cursor
            somenode = t.doc.createElement("p");
            t.cursor.getNode().appendChild(somenode);
            // select a single position so the cursor is put in the document
            setSelection(t.selection, t.textnode, 1);
            t.cursor.updateToSelection();
            shouldBeNonNull("t.cursor.getNode().parentNode");
            textnode2 = t.cursor.getNode().nextSibling;
            // select a range starting at the node in the cursor, but extends
            // out of the the cursor
            // this should have the result that the cursor is removed from the
            // document and that the text nodes around the cursor are
            // merged
            setSelection(t.selection, somenode, 0, textnode2, 2);
            t.cursor.updateToSelection();
            shouldBeNull("t.cursor.getNode().parentNode");
            t.range = t.selection.getRangeAt(0);
            shouldBe("t.range.startContainer", "t.textnode");
            shouldBe("t.range.startOffset", "1");
            shouldBe("t.range.endContainer", "t.textnode");
            shouldBe("t.range.endOffset", "3");
            shouldBe("t.range.collapsed", "false");
        }
    };

    (function () {
        var test, t;
        for (test in tests) {
            if (tests.hasOwnProperty(test)) {
                debug(test + ":");
                tests[test]();
            }
        }
    }()); 
}());

var successfullyParsed = true;
