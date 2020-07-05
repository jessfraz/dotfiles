// ==UserScript==
// @name         GitHub Collapse In Comment
// @version      1.0.4
// @description  A userscript that adds a header that can toggle long code and quote blocks in comments
// @license      https://creativecommons.org/licenses/by-sa/4.0/
// @namespace    https://github.com/Mottie
// @include      https://github.com/*
// @include      https://gist.github.com/*
// @run-at       document-idle
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @author       Rob Garrison
// @updateURL    https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-collapse-in-comment.user.js
// @downloadURL  https://raw.githubusercontent.com/Mottie/GitHub-userscripts/master/github-collapse-in-comment.user.js
// ==/UserScript==
/* global GM_addStyle, GM_getValue, GM_setValue, GM_registerMenuCommand */
/* jshint esnext:true, unused:true */
(() => {
    "use strict";
    /*
     Idea from: https://github.com/dear-github/dear-github/issues/166 & https://github.com/isaacs/github/issues/208
     examples:
     https://github.com/Mottie/tablesorter/issues/569
     https://github.com/jquery/jquery/issues/3195
     */
    let timer,
        busy = false,

        // hide code/quotes longer than this number of lines
        minLines = GM_getValue("gcic-max-lines", 10),
        startCollapsed = GM_getValue("gcic-start-collapsed", true);

    // syntax highlight class name lookup table
    const syntaxClass = {
        basic: "HTML",
        cs: "C#",
        fsharp: "F#",
        gfm: "Markdown",
        jq: "JSONiq",
        shell: "Bash (shell)",
        tcl: "Glyph",
        tex: "LaTex"
    };

    GM_addStyle(`
    .gcic-block {
      border:#eee 1px solid;
      padding:2px 8px 2px 10px;
      border-radius:5px 5px 0 0;
      position:relative;
      top:1px;
      cursor:pointer;
      font-weight:bold;
      display:block;
    }
    .gcic-block + .highlight {
      border-top:none;
    }
    .gcic-block + .email-signature-reply {
      margin-top:0;
    }
    .gcic-block:after {
      content:"\u25bc ";
      float:right;
    }
    .gcic-block-closed {
      border-radius:5px;
      margin-bottom:10px;
    }
    .gcic-block-closed:after {
      transform: rotate(90deg);
    }
    .gcic-block-closed + .highlight, .gcic-block-closed + .email-signature-reply,
    .gcic-block-closed + pre {
      display:none;
    }
  `);

    function makeToggle(name, lines) {
        /* full list of class names from (look at "tm_scope" value)
         https://github.com/github/linguist/blob/master/lib/linguist/languages.yml
         here are some example syntax highlighted class names:
         highlight-text-html-markdown-source-gfm-apib
         highlight-text-html-basic
         highlight-source-fortran-modern
         highlight-text-tex
         */
        let n = (name || "").replace(
            /(highlight[-\s]|(source-)|(text-)|(html-)|(markdown-)|(-modern))/g, ""
        );
        n = (syntaxClass[n] || n).toUpperCase().trim();
        return `${n || "Block"} (${lines} lines)`;
    }

    function addToggles() {
        busy = true;
        // issue comments
        if ($("#discussion_bucket")) {
            let indx = 0;
            const block = document.createElement("a"),
                els = $$(".markdown-body pre, .email-signature-reply"),
                len = els.length;

            // "flash" = blue box styling
            block.className = `gcic-block border flash${
                startCollapsed ? " gcic-block-closed" : ""
                }`;
            block.href = "#";

            // loop with delay to allow user interaction
            const loop = () => {
                let el, wrap, node, syntaxClass, numberOfLines,
                    // max number of DOM insertions per loop
                    max = 0;
                while (max < 20 && indx < len) {
                    if (indx >= len) {
                        return;
                    }
                    el = els[indx];
                    if (el && !el.classList.contains("gcic-has-toggle")) {
                        numberOfLines = el.innerHTML.split("\n").length;
                        if (numberOfLines > minLines) {
                            syntaxClass = "";
                            wrap = closest(el, ".highlight");
                            if (wrap && wrap.classList.contains("highlight")) {
                                syntaxClass = wrap.className;
                            } else {
                                // no syntax highlighter defined (not wrapped)
                                wrap = el;
                            }
                            node = block.cloneNode();
                            node.innerHTML = makeToggle(syntaxClass, numberOfLines);
                            wrap.parentNode.insertBefore(node, wrap);
                            el.classList.add("gcic-has-toggle");
                            if (startCollapsed) {
                                el.display = "none";
                            }
                            max++;
                        }
                    }
                    indx++;
                }
                if (indx < len) {
                    setTimeout(() => {
                        loop();
                    }, 200);
                }
            };
            loop();
        }
        busy = false;
    }

    function addBindings() {
        document.addEventListener("click", event => {
            let els, indx, flag;
            const el = event.target;
            if (el && el.classList.contains("gcic-block")) {
                event.preventDefault();
                // shift + click = toggle all blocks in a single comment
                // shift + ctrl + click = toggle all blocks on page
                if (event.shiftKey) {
                    els = $$(".gcic-block", event.ctrlKey ? "" : (el, ".markdown-body"));
                    indx = els.length;
                    flag = el.classList.contains("gcic-block-closed");
                    while (indx--) {
                        els[indx].classList[flag ? "remove" : "add"]("gcic-block-closed");
                    }
                } else {
                    el.classList.toggle("gcic-block-closed");
                }
                removeSelection();
            }
        });
    }

    function update() {
        busy = true;
        let toggles = $$(".gcic-block"),
            indx = toggles.length;
        while (indx--) {
            toggles[indx].parentNode.removeChild(toggles[indx]);
        }
        toggles = $$(".gcic-has-toggle");
        indx = toggles.length;
        while (indx--) {
            toggles[indx].classList.remove("gcic-has-toggle");
        }
        addToggles();
    }

    function $(selector, el) {
        return (el || document).querySelector(selector);
    }

    function $$(selector, el) {
        return Array.from((el || document).querySelectorAll(selector));
    }

    function closest(el, selector) {
        while (el && el.nodeName !== "BODY" && !el.matches(selector)) {
            el = el.parentNode;
        }
        return el && el.matches(selector) ? el : null;
    }

    function removeSelection() {
        // remove text selection - http://stackoverflow.com/a/3171348/145346
        const sel = window.getSelection ? window.getSelection() : document.selection;
        if (sel) {
            if (sel.removeAllRanges) {
                sel.removeAllRanges();
            } else {
                if (sel.empty) {
                    sel.empty();
                }
            }
        }
    }

    GM_registerMenuCommand("Set GitHub Collapse In Comment Max Lines", () => {
        let val = prompt("Minimum number of lines before adding a toggle:",
            minLines);
        val = parseInt(val, 10);
        if (val) {
            minLines = val;
            GM_setValue("gcic-max-lines", val);
            update();
        }
    });

    GM_registerMenuCommand("Set GitHub Collapse In Comment Initial State", () => {
        let val = prompt(
            "Start with blocks (c)ollapsed or (e)xpanded (first letter necessary):",
            startCollapsed ? "collapsed" : "expanded"
        );
        if (val) {
            val = /^c/.test(val || "");
            startCollapsed = val;
            GM_setValue("gcic-start-collapsed", val);
            update();
        }
    });

    $$("#js-repo-pjax-container, #js-pjax-container").forEach(target => {
        new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                const mtarget = mutation.target;
                // preform checks before adding code wrap to minimize function calls
                // update after comments are edited
                if (!busy && (mtarget === target || mtarget.matches(
                        ".js-comment-body, .js-preview-body"))) {
                    clearTimeout(timer);
                    timer = setTimeout(() => {
                        addToggles();
                    }, 100);
                }
            });
        }).observe(target, {
            childList: true,
            subtree: true
        });
    });

    addBindings();
    addToggles();
})();
