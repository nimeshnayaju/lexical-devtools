import { useEffect, useState } from "react";
import "./styles.css";
import {
  useRootStore,
  useEditors,
  useRevalidateEditors,
} from "./root-store-provider";
import { SerializedEditorState } from "@lexical-devtools/utils";
import NodeTree from "./node-tree";
import Separator from "./separator";
import ReloadIcon from "../icons/reload-icon";

export default function App() {
  const revalidate = useRevalidateEditors();
  const store = useRootStore();
  const state = useEditors();

  useEffect(() => {
    void revalidate();
  }, [revalidate]);

  useEffect(() => {
    chrome.webNavigation.onCommitted.addListener(revalidate);
    return () => {
      chrome.webNavigation.onCommitted.removeListener(revalidate);
    };
  }, [revalidate]);

  useEffect(() => {
    function handleBeforeUnload() {
      chrome.tabs.sendMessage(chrome.devtools.inspectedWindow.tabId, {
        type: "DEVTOOLS_PANEL_UNLOADED",
      });
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    function handleEditorsUpdate(editors: Map<string, SerializedEditorState>) {
      store.set({
        isLoading: false,
        isRevalidating: false,
        editors,
      });
    }

    function handleExternalMessage(message: any) {
      const state = store.get();
      if (state === undefined || state.isRevalidating) return;
      if (state.error !== undefined) return;

      if (message.type === "LEXICAL_EDITOR_MOUNTED") {
        if (message.payload === undefined) return;
        if (message.payload.id === undefined) return;
        if (message.payload.state === undefined) return;

        const editors = new Map(state.editors);
        editors.set(message.payload.id, message.payload.state);
        handleEditorsUpdate(editors);
      } else if (message.type === "LEXICAL_EDITOR_UNMOUNTED") {
        if (message.payload === undefined) return;
        if (message.payload.id === undefined) return;

        const editors = new Map(state.editors);
        editors.delete(message.payload.id);
        handleEditorsUpdate(editors);
      } else if (message.type === "UPDATE_EDITOR_STATE") {
        if (message.payload === undefined) return;
        if (message.payload.id === undefined) return;
        if (message.payload.state === undefined) return;

        const editors = new Map(state.editors);
        editors.set(message.payload.id, message.payload.state);
        handleEditorsUpdate(editors);
      }
    }

    chrome.runtime.onMessageExternal.addListener(handleExternalMessage);
    return () => {
      chrome.runtime.onMessageExternal.removeListener(handleExternalMessage);
    };
  }, [store]);

  if (state === undefined || state.isLoading) {
    return (
      <div className="h-screen bg-white dark:bg-[rgb(40_40_40)] text-black dark:text-white flex items-center justify-center p-4">
        Loading...
      </div>
    );
  }

  if (state.error !== undefined) {
    return (
      <div className="h-screen bg-white dark:bg-[rgb(40_40_40)] text-black dark:text-white flex items-center justify-center p-4">
        There was an error loading the editors.
      </div>
    );
  }

  const editors = Array.from(state.editors.values());

  return (
    <div className="h-screen bg-white dark:bg-[rgb(40_40_40)] text-black dark:text-white">
      <Panel editors={editors} />
    </div>
  );
}

function Panel({ editors }: { editors: SerializedEditorState[] }) {
  const revalidate = useRevalidateEditors();
  const state = useEditors();

  const [selectedEditorId, setSelectedEditorId] = useState<string | null>(null);

  function handleEditorChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    // If the selected editor is not in the list of editors, we do not update the selected editor
    if (editors.find((e) => e.id === value) === undefined) return;
    setSelectedEditorId(value);
  }

  if (editors.length === 0) {
    return (
      <div className="h-full w-full flex flex-col gap-2 items-center justify-center p-4">
        <h1 className="font-semibold text-sm">No editors found.</h1>
        <p className="text-xs text-[rgb(71_71_71)] dark:text-[rgb(143_143_143)]">
          In order to integrate developer tools for Lexical.js with your React
          application, install <code>@lexical-devtools/react</code> and import{" "}
          <code>{`<DevtoolsPlugin />`}</code> inside your{" "}
          <code>{`LexicalComposer`}</code> component.
        </p>
      </div>
    );
  }

  // If no editor is selected OR the selected editor is not in the list of editors, select the first editor in the list
  if (
    selectedEditorId === null ||
    editors.find((e) => e.id === selectedEditorId) === undefined
  ) {
    setSelectedEditorId(editors[0].id);
    return null;
  }

  const selectedEditor = editors.find((e) => e.id === selectedEditorId);

  if (selectedEditor === undefined) {
    return null;
  }

  return (
    <div className="h-full w-full flex flex-col">
      {/* Header */}
      <div className="h-[25px] flex flex-row items-center py-1 px-2 border-b bg-[rgb(238_242_249)] dark:bg-[rgb(60_60_60)] border-[rgb(214_226_251)] dark:border-[rgb(94_94_94)]">
        <div className="flex flex-row gap-3 items-center h-full">
          {/* Editor select */}
          <select
            value={selectedEditorId}
            onChange={handleEditorChange}
            className="outline-none bg-transparent"
          >
            {editors.map((editor) => (
              <option key={editor.id} value={editor.id}>
                <span>
                  {editor.id} ({editor.namespace})
                </span>
              </option>
            ))}
          </select>

          <Separator
            orientation="vertical"
            className="bg-[rgb(214_226_251)] dark:bg-[rgb(94_94_94)] data-[orientation=horizontal]:h-px data-[orientation=vertical]:h-full data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-px"
          />

          <button
            className="inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={revalidate}
            disabled={state === undefined || state.isRevalidating}
            title="Refresh editors"
          >
            <ReloadIcon className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="h-[calc(100%-25px)] w-full flex flex-row">
        <div className="relative h-full overflow-auto flex-1">
          <Editor state={selectedEditor} />
        </div>
      </div>
    </div>
  );
}

function Editor({ state }: { state: SerializedEditorState }) {
  const [selected, setSelected] = useState<string[]>(["root"]);
  const [collapsed, setCollapsed] = useState<string[]>([]);

  return (
    <NodeTree
      id={state.id}
      data={state.root}
      selected={selected}
      onSelectedChange={setSelected}
      collapsed={collapsed}
      onCollapsedChange={setCollapsed}
      className="h-full w-full"
    />
  );
}
