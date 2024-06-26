import { useCallback, useEffect, useSyncExternalStore } from "react";
import { useComposer } from "./composer";
import { $serializeEditor } from "@lexical-devtools/utils";
import { LexicalEditor } from "lexical";

const EXTENSION_ID = "dmbopeepjkdlplkjcjbnfiikajiddhnd";

export default function DevToolsPlugin() {
  if (typeof chrome === "undefined") return null;

  if (chrome.runtime === undefined) return null;

  return <DevToolsPluginImpl />;
}

function DevToolsPluginImpl() {
  const editor = useComposer();
  const root = useRootElement(editor);
  const key = editor.getKey();

  useEffect(() => {
    if (root === null) return;

    chrome.runtime
      .sendMessage(EXTENSION_ID, {
        type: "LEXICAL_EDITOR_MOUNTED",
        payload: {
          id: key,
          state: editor.getEditorState().read(() => $serializeEditor(editor)),
        },
      })
      .catch(() => {
        // `chrome.runtime.sendMessage` throws an error if the extension is not installed or if devtools has not mounted.
      });

    return () => {
      chrome.runtime
        .sendMessage(EXTENSION_ID, {
          type: "LEXICAL_EDITOR_UNMOUNTED",
          payload: {
            id: key,
          },
        })
        .catch(() => {
          // `chrome.runtime.sendMessage` throws an error if the extension is not installed or if devtools has not mounted.
        });
    };
  }, [editor, key, root]);

  useEffect(() => {
    if (root === null) return;

    root.setAttribute("data-lexical-editor-key", key);

    // @ts-ignore
    root.__serialize = function () {
      return editor.getEditorState().read(() => $serializeEditor(editor));
    };

    // @ts-ignore
    root.__getHTMLElement = function (key: string) {
      return editor.getElementByKey(key);
    };

    return () => {
      root.removeAttribute("data-lexical-editor-key");

      // @ts-ignore
      root.__serialize = undefined;

      // @ts-ignore
      root.__getHTMLElement = undefined;
    };
  }, [root, editor, key]);

  useEffect(() => {
    if (root === null) return;

    async function handleEditorUpdate() {
      const state = editor
        .getEditorState()
        .read(() => $serializeEditor(editor));

      chrome.runtime
        .sendMessage(EXTENSION_ID, {
          type: "UPDATE_EDITOR_STATE",
          payload: {
            id: key,
            state,
          },
        })
        .catch(() => {
          // `chrome.runtime.sendMessage` throws an error if the extension is not installed or if devtools has not mounted.
        });
    }

    return editor.registerUpdateListener(handleEditorUpdate);
  }, [editor, key, root]);

  return null;
}

function useRootElement(editor: LexicalEditor): HTMLElement | null {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      return editor.registerRootListener(onStoreChange);
    },
    [editor]
  );

  const getSnapshot = useCallback(() => {
    return editor.getRootElement();
  }, [editor]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
