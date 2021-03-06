"use strict";

import {
  Range,
  ExtensionContext,
  commands,
  window,
  TextDocument,
  Uri,
  workspace
} from "vscode";
import { open } from "opn-url";
import { URL } from "url";

function getLanguage(languageId: string) {
  const languageMap = new Map([
    ["c", "text/x-csrc"],
    ["csharp", "text/x-csharp"],
    ["cpp", "text/x-c++src"],
    ["diff", "text/x-diff"],
    ["fsharp", "mllike"],
    ["html", "htmlmixed"],
    ["java", "text/x-java"],
    ["javascriptreact", "jsx"],
    ["json", "application/json"],
    ["objective-c", "text/x-objectivec"],
    ["php", "text/x-php"],
    ["plaintext", "text"],
    ["shellscript", "application/x-sh"]
  ]);

  if (languageMap.has(languageId)) {
    return languageMap.get(languageId);
  } else {
    return "auto";
  }
}

export function activate(context: ExtensionContext) {
  const disposable = commands.registerCommand("carbon.show", () => {
    const editor = window.activeTextEditor;

    if (!editor) return window.showErrorMessage("😱 Feed me code!");

    const { languageId, lineAt, getText } = editor.document;
    const settings = workspace.getConfiguration("carbon");
    const language = getLanguage(languageId);

    const { start, end, active } = editor.selection;

    const selection = (start.isEqual(end)
      ? lineAt(active.line).text
      : getText(new Range(start, end))
    ).trim();

    const maxCharacterLength = 1000;
    if (selection.length > maxCharacterLength)
      return window.showErrorMessage(
        `Selected code is longer than ${maxCharacterLength} characters, refusing to send to carbon.`
      );

    const url = new URL(settings.get("url"));

    if (settings.get("useBrowserCache")) {
      url.searchParams.set("code", encodeURIComponent(selection));
      open(
        url.toString(),
        err =>
          err &&
          (() => {
            window.showErrorMessage(
              `There was an issue sending code to carbon. Please try again.`
            );
  
            console.error(`
              URL: ${url}
              Code: ${selection}
              Error: ${err}
            `);
          })()
      );
      context.subscriptions.push(disposable);
      return;
    }

    url.searchParams.set("bg", settings.get("backgroundColor"));
    url.searchParams.set("t", settings.get("theme"));
    url.searchParams.set("wt", settings.get("windowTheme"));
    url.searchParams.set("l", language);
    url.searchParams.set("ds", settings.get("dropShadow"));
    url.searchParams.set("dsyoff", `${settings.get("dropShadowOffset")}px`);
    url.searchParams.set("dsblur", `${settings.get("dropShadowBlurRadius")}px`);
    url.searchParams.set("wc", settings.get("windowControls"));
    url.searchParams.set("wa", settings.get("autoAdjustWidth"));
    url.searchParams.set("pv", `${settings.get("paddingVertical")}px`);
    url.searchParams.set("ph", `${settings.get("paddingHorizontal")}px`);
    url.searchParams.set("ln", settings.get("lineNumbers"));
    url.searchParams.set("f", settings.get("fontFamily"));
    url.searchParams.set("fs", `${settings.get("fontSize")}px`);
    url.searchParams.set("lh", `${settings.get("lineHeight")}%`);
    url.searchParams.set("wm", settings.get("showWatermark"))
    url.searchParams.set("code", encodeURIComponent(selection));

    open(
      url.toString(),
      err =>
        err &&
        (() => {
          window.showErrorMessage(
            `There was an issue sending code to carbon. Please try again.`
          );

          console.error(`
            URL: ${url}
            Code: ${selection}
            Error: ${err}
          `);
        })()
    );
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}
