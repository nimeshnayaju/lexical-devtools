import { SerializedEditorState } from "@lexical-devtools/utils";

export default async function getLexicalEditorStates(): Promise<
  SerializedEditorState[]
> {
  const results = await chrome.scripting.executeScript({
    target: { tabId: chrome.devtools.inspectedWindow.tabId },
    func: function () {
      function isLexicalHTMLElement(node: Element): node is LexicalHTMLElement {
        if ("__serialize" in node && typeof node.__serialize === "function") {
          return true;
        }
        return false;
      }

      return Array.from(
        document.querySelectorAll("div[data-lexical-editor-key]")
      )
        .filter(isLexicalHTMLElement)
        .map((node) => node.__serialize());
    },
    world: "MAIN",
  });

  return results
    .flatMap(({ result }) => result)
    .map((state) => state)
    .filter(Boolean) as SerializedEditorState[];
}

type LexicalHTMLElement = HTMLElement & {
  __serialize: () => SerializedEditorState;
};
