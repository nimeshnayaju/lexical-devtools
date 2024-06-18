import * as TreeView from "./tree-view";
import {
  SerializedElementNode,
  SerializedTextNode,
  SerializedLexicalNode,
  SerializedRootNode,
} from "@lexical-devtools/utils";
import TriangleRightIcon from "../icons/triangle-right-icon";
import { createContext, HTMLAttributes, use } from "react";
import { classNames } from "./class-names";

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
  top: number;
  right: number;
}

const SelectedContext = createContext<string[] | null>(null);

const CreateHighlightContext = createContext<((key: string) => void) | null>(
  null
);

const RemoveHighlightContext = createContext<(() => void) | null>(null);

type LexicalHTMLElement = HTMLElement & {
  __getHTMLElement: (key: string) => HTMLElement | null;
};

interface NodeTreeProps extends HTMLAttributes<HTMLUListElement> {
  id: string; // The id of the editor

  data: SerializedRootNode; // The (serialized) root node of the tree

  selected: string[];
  onSelectedChange: (selected: string[]) => void;

  collapsed: string[];
  onCollapsedChange: (collapsed: string[]) => void;
}

export default function NodeTree(props: NodeTreeProps) {
  const {
    id,
    data,
    selected,
    onSelectedChange,
    collapsed,
    onCollapsedChange,
    ...ulProps
  } = props;

  async function handleCreateHighlight(key: string) {
    const results = await chrome.scripting.executeScript({
      target: { tabId: chrome.devtools.inspectedWindow.tabId },

      func: function (editor: string, key: string): Rect | null {
        function isLexicalHTMLElement(
          node: Element
        ): node is LexicalHTMLElement {
          if (
            "__getHTMLElement" in node &&
            typeof node.__getHTMLElement === "function"
          ) {
            return true;
          }
          return false;
        }
        const element = document.querySelector(
          `div[data-lexical-editor-key="${editor}"]`
        );
        if (element === null) return null;

        if (!isLexicalHTMLElement(element)) return null;

        const node = element.__getHTMLElement(key);
        if (node === null) return null;

        const rect = node.getBoundingClientRect();
        return {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          top: rect.top,
          right: rect.right,
        };
      },
      args: [id, key],
      world: "MAIN",
    });

    const rects = results
      .flatMap(({ result }) => result)
      .filter(Boolean) as Rect[];

    if (rects.length === 0) return;

    const rect = rects[0];

    await chrome.tabs.sendMessage(chrome.devtools.inspectedWindow.tabId, {
      type: "CREATE_HIGHLIGHT",
      payload: { rect },
    });
  }

  async function handleRemoveHighlight() {
    await chrome.tabs.sendMessage(chrome.devtools.inspectedWindow.tabId, {
      type: "REMOVE_HIGHLIGHT",
    });
  }

  return (
    <SelectedContext.Provider value={selected}>
      <CreateHighlightContext.Provider value={handleCreateHighlight}>
        <RemoveHighlightContext.Provider value={handleRemoveHighlight}>
          <TreeView.Root
            value={selected}
            onValueChange={onSelectedChange}
            collapsed={collapsed}
            onCollapsedChange={onCollapsedChange}
          >
            <TreeView.Tree {...ulProps}>
              <ElementNodeTreeItem node={data} />
            </TreeView.Tree>
          </TreeView.Root>
        </RemoveHighlightContext.Provider>
      </CreateHighlightContext.Provider>
    </SelectedContext.Provider>
  );
}

function ElementNodeTreeItem({
  node,
}: {
  node: SerializedRootNode | SerializedElementNode;
}) {
  const isSelected = useIsSelected(node.key);

  const createHighlight = useCreateHighlight(node.key);
  const removeHighlight = useRemoveHighlight();

  return (
    <TreeView.Item value={node.key}>
      <div
        data-selected={isSelected ? "" : undefined}
        className={classNames(
          "flex flex-row gap-0.5 items-center select-none",
          "ps-[calc(var(--depth)*1rem+4px)]",
          "data-[selected]:bg-[rgb(214_226_251)] dark:data-[selected]:bg-[rgb(29_73_115)] text-black dark:text-white",
          "hover:bg-[rgb(242_242_242)] dark:hover:bg-[rgb(60_60_60)]"
        )}
        onPointerEnter={createHighlight}
        onPointerLeave={removeHighlight}
      >
        <TreeView.Trigger className="group">
          <TriangleRightIcon
            className="group-data-[state=open]:rotate-90 h-4 w-4"
            aria-hidden
          />
        </TreeView.Trigger>

        <div className="flex flex-row gap-1 items-center">
          <span>{node.class}</span>
        </div>
      </div>

      <TreeView.Tree>
        {node.children.map((child) => {
          if (child.type === "element") {
            return <ElementNodeTreeItem key={child.key} node={child} />;
          } else if (child.type === "text") {
            return <TextNodeTreeItem key={child.key} node={child} />;
          } else {
            return <MiscllaneousNodeTreeItem key={child.key} node={child} />;
          }
        })}
      </TreeView.Tree>
    </TreeView.Item>
  );
}

function TextNodeTreeItem({ node }: { node: SerializedTextNode }) {
  const createHighlight = useCreateHighlight(node.key);
  const removeHighlight = useRemoveHighlight();

  return (
    <TreeView.Item
      value={node.key}
      className={classNames(
        "flex flex-row gap-1 items-center select-none",
        "ps-[calc(var(--depth)*1rem+16px+4px)]",
        "data-[selected]:bg-[rgb(214_226_251)] dark:data-[selected]:bg-[rgb(29_73_115)] text-black dark:text-white",
        "hover:bg-[rgb(242_242_242)] dark:hover:bg-[rgb(60_60_60)]"
      )}
      onPointerEnter={createHighlight}
      onPointerLeave={removeHighlight}
    >
      {node.text}
    </TreeView.Item>
  );
}

function MiscllaneousNodeTreeItem({ node }: { node: SerializedLexicalNode }) {
  const createHighlight = useCreateHighlight(node.key);
  const removeHighlight = useRemoveHighlight();

  return (
    <TreeView.Item
      value={node.key}
      className={classNames(
        "flex flex-row gap-1 items-center select-none",
        "ps-[calc(var(--depth)*1rem+16px+4px)]",
        "data-[selected]:bg-[rgb(214_226_251)] dark:data-[selected]:bg-[rgb(29_73_115)] text-black dark:text-white",
        "hover:bg-[rgb(242_242_242)] dark:hover:bg-[rgb(60_60_60)]"
      )}
      onPointerEnter={createHighlight}
      onPointerLeave={removeHighlight}
    >
      {node.class}
    </TreeView.Item>
  );
}

function useCreateHighlight(key: string) {
  const context = use(CreateHighlightContext);
  if (context === null) {
    throw new Error(
      "useCreateHighlight must be used within a NodeTree component"
    );
  }

  return () => context(key);
}

function useRemoveHighlight() {
  const context = use(RemoveHighlightContext);
  if (context === null) {
    throw new Error(
      "useRemoveHighlight must be used within a NodeTree component"
    );
  }

  return () => context();
}

export function useIsSelected(key: string): boolean {
  const selected = use(SelectedContext);
  if (selected === null) {
    throw new Error("useIsSelected must be used within a NodeTree component");
  }

  return selected.includes(key);
}
