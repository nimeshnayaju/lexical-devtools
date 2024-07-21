import * as TreeView from "./tree-view";
import type {
  SerializedElementNode,
  SerializedTextNode,
  SerializedLexicalNode,
  SerializedRootNode,
} from "@lexical-devtools/utils";
import TriangleRightIcon from "./icons/triangle-right-icon";
import {
  createContext,
  DetailedHTMLProps,
  FocusEvent,
  HTMLAttributes,
  KeyboardEvent,
  PointerEvent,
  use,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import classNames from "./class-names";

const TreeContext = createContext<SerializedRootNode | null>(null);

const SelectedStateContext = createContext<
  [string[], (selected: string[]) => void] | null
>(null);

const CollapsedStateContext = createContext<
  [string[], (collapsed: string[]) => void] | null
>(null);

const ItemsContext = createContext<Map<string, HTMLElement> | null>(null);

const ItemLifecycleContext = createContext<{
  onItemAdd: (key: string, element: HTMLElement) => void;
  onItemRemove: (key: string) => void;
} | null>(null);

const EditorIdContext = createContext<string | null>(null);

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
  top: number;
  right: number;
}

type LexicalHTMLElement = HTMLElement & {
  __getHTMLElement: (key: string) => HTMLElement | null;
};

interface NodeTreeProps
  extends Omit<
    DetailedHTMLProps<HTMLAttributes<HTMLUListElement>, HTMLUListElement>,
    "children"
  > {
  id: string; // The id of the editor

  data: SerializedRootNode; // The (serialized) root node of the tree

  selected: string[];
  onSelectedChange: (selected: string[]) => void;

  collapsed: string[];
  onCollapsedChange: (collapsed: string[]) => void;
}

export default function NodeTree({
  id,
  data,
  selected,
  onSelectedChange,
  collapsed,
  onCollapsedChange,
  ...props
}: NodeTreeProps) {
  const [items, setItems] = useState<Map<string, HTMLElement>>(new Map());

  const onItemAdd = useCallback((key: string, element: HTMLElement) => {
    setItems((items) => new Map(items).set(key, element));
  }, []);

  const onItemRemove = useCallback((key: string) => {
    setItems((items) => {
      const newItems = new Map(items);
      newItems.delete(key);
      return newItems;
    });
  }, []);

  return (
    <TreeContext.Provider value={data}>
      <SelectedStateContext.Provider value={[selected, onSelectedChange]}>
        <CollapsedStateContext.Provider value={[collapsed, onCollapsedChange]}>
          <EditorIdContext.Provider value={id}>
            <ItemsContext.Provider value={items}>
              <ItemLifecycleContext.Provider
                value={{ onItemAdd, onItemRemove }}
              >
                <TreeView.Root
                  selected={selected}
                  onSelectedChange={onSelectedChange}
                  collapsed={collapsed}
                  onCollapsedChange={onCollapsedChange}
                >
                  <TreeView.Tree {...props}>
                    <ElementNodeTreeItem node={data} />
                  </TreeView.Tree>
                </TreeView.Root>
              </ItemLifecycleContext.Provider>
            </ItemsContext.Provider>
          </EditorIdContext.Provider>
        </CollapsedStateContext.Provider>
      </SelectedStateContext.Provider>
    </TreeContext.Provider>
  );
}

function ElementNodeTreeItem({
  node,
}: {
  node: SerializedRootNode | SerializedElementNode;
}) {
  return (
    <TreeView.Item value={node.key}>
      <NodeTreeItemText
        id={node.key}
        className="ps-[calc(var(--depth)*1rem+4px)]"
      >
        <TreeView.Trigger className="group">
          <TriangleRightIcon
            className="group-data-[state=open]:rotate-90 h-4 w-4"
            aria-hidden
          />
        </TreeView.Trigger>

        <div className="flex flex-row gap-1.5 items-center">
          <span>{node.type}</span>

          {node.group === "element" && (
            <span className="inline-flex font-mono items-center rounded-full text-[8px] bg-[rgb(242_242_242)] dark:bg-[rgb(60_60_60)] px-[4px] border py-0 border-[rgb(199_199_199)] dark:border-[rgb(56_100_135)]">
              {node.key}
            </span>
          )}
        </div>
      </NodeTreeItemText>

      <TreeView.Tree>
        {node.children.map((child) => {
          if (child.group === "element") {
            return <ElementNodeTreeItem key={child.key} node={child} />;
          } else if (child.group === "text") {
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
  return (
    <TreeView.Item value={node.key}>
      <NodeTreeItemText
        id={node.key}
        className="ps-[calc(var(--depth)*1rem+4px+16px+4px)]"
      >
        <span className="inline-flex items-center gap-1.5">
          {node.text}

          <span className="inline-flex font-mono items-center rounded-full text-[8px] bg-[rgb(242_242_242)] dark:bg-[rgb(60_60_60)] px-[4px] border py-0 border-[rgb(199_199_199)] dark:border-[rgb(56_100_135)]">
            {node.key}
          </span>
        </span>
      </NodeTreeItemText>
    </TreeView.Item>
  );
}

function MiscllaneousNodeTreeItem({ node }: { node: SerializedLexicalNode }) {
  return (
    <TreeView.Item value={node.key}>
      <NodeTreeItemText
        id={node.key}
        className="ps-[calc(var(--depth)*1rem+4px+16px+4px)]"
      >
        <span className="inline-flex items-center gap-1.5">
          {node.type}

          <span className="inline-flex font-mono items-center rounded-full text-[8px] bg-[rgb(242_242_242)] dark:bg-[rgb(60_60_60)] px-[4px] border py-0 border-[rgb(199_199_199)] dark:border-[rgb(56_100_135)]">
            {node.key}
          </span>
        </span>
      </NodeTreeItemText>
    </TreeView.Item>
  );
}

function NodeTreeItemText({
  id,
  children,
  onPointerEnter,
  onPointerLeave,
  onFocus,
  onBlur,
  onKeyDown,
  className,
  ...props
}: TreeView.ItemTextProps & { id: string }) {
  const ref = useRef<HTMLDivElement>(null);

  const tree = useTree();
  const [selected, setSelected] = useSelectedState();
  const [collapsed, setCollapsed] = useCollapsedState();

  const editorId = useEditorId();

  const items = useItems();
  const lifecycleCallbacks = useContext(ItemLifecycleContext);

  if (lifecycleCallbacks === null) {
    throw new Error(
      "NodeTreeItemText must be used within the NodeTree component"
    );
  }

  const { onItemAdd, onItemRemove } = lifecycleCallbacks;

  useEffect(() => {
    const item = ref.current;
    if (item === null) return;

    onItemAdd(id, item);
    return () => {
      onItemRemove(id);
    };
  }, [id]);

  async function handleFocus(event: FocusEvent<HTMLDivElement>) {
    onFocus?.(event);
    if (event.defaultPrevented) return;

    setSelected([id]);
    await createHighlight();
  }

  async function handleBlur(event: FocusEvent<HTMLDivElement>) {
    onBlur?.(event);
    if (event.defaultPrevented) return;

    await handleRemoveHighlight();
  }

  async function createHighlight() {
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
      args: [editorId, id],
      world: "MAIN",
    });

    const rects = results
      .flatMap(({ result }) => result)
      .filter(Boolean) as Rect[];

    if (rects.length === 0) return;

    const rect = rects[0];

    try {
      await chrome.tabs.sendMessage(chrome.devtools.inspectedWindow.tabId, {
        type: "CREATE_HIGHLIGHT",
        payload: { rect },
      });
    } catch (error) {
      // `chrome.tabs.sendMessage` throws an error if the content script is not loaded yet
    }
  }

  async function handleRemoveHighlight() {
    try {
      await chrome.tabs.sendMessage(chrome.devtools.inspectedWindow.tabId, {
        type: "REMOVE_HIGHLIGHT",
      });
    } catch (error) {
      // `chrome.tabs.sendMessage` throws an error if the content script is not loaded yet
    }
  }

  async function handlePointerEnter(event: PointerEvent<HTMLDivElement>) {
    onPointerEnter?.(event);
    if (event.defaultPrevented) return;

    await createHighlight();
  }

  async function handlePointerLeave(event: PointerEvent<HTMLDivElement>) {
    onPointerLeave?.(event);
    if (event.defaultPrevented) return;

    await handleRemoveHighlight();
  }

  function getNextNode(): SerializedLexicalNode | null {
    let found = false;

    // Traverse the tree in a depth-first manner
    function traverse(
      node: SerializedLexicalNode
    ): SerializedLexicalNode | null {
      if (found) return node;

      if (node.key === id) {
        found = true;
      }

      if (
        (node.group === "root" || node.group === "element") &&
        !collapsed.includes(node.key)
      ) {
        for (const child of node.children) {
          const next = traverse(child);

          // If the next node is found, return it
          if (next !== null) return next;
        }
      }

      return null;
    }

    return traverse(tree);
  }

  function getPreviousNode(): SerializedLexicalNode | null {
    let previous: SerializedLexicalNode | null = null;

    // Traverse the tree in a depth-first manner
    function traverse(
      node: SerializedLexicalNode
    ): SerializedLexicalNode | null {
      if (node.key === id) {
        return previous;
      }

      previous = node;

      if (
        (node.group === "root" || node.group === "element") &&
        !collapsed.includes(node.key)
      ) {
        for (const child of node.children) {
          const next = traverse(child);

          // If the next node is found, return it
          if (next !== null) return next;
        }
      }

      return null;
    }

    return traverse(tree);
  }

  function getParentNode(): SerializedLexicalNode | null {
    let parent: SerializedLexicalNode | null = null;

    function traverse(
      node: SerializedLexicalNode
    ): SerializedLexicalNode | null {
      if (node.key === id) {
        return parent;
      }

      if (node.group === "root" || node.group === "element") {
        const previous = parent;
        parent = node;

        for (const child of node.children) {
          const next = traverse(child);

          if (next !== null) return next;
        }

        parent = previous; // Restore the parent node after returning from recursion
      }

      return null;
    }

    return traverse(tree);
  }

  function getFirstChildNode(): SerializedLexicalNode | null {
    const node = getNodeByKey(tree, id);
    if (node === null) return null;
    if (node.group !== "root" && node.group !== "element") return null;

    return node.children[0] ?? null;
  }

  function focusItem(key: string) {
    const item = items.get(key);
    if (item === undefined) return;

    item.focus();
  }

  // See: https://www.w3.org/WAI/ARIA/apg/patterns/treeview/#keyboardinteraction
  async function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;

    if (event.key === "ArrowUp") {
      event.preventDefault();

      const previous = getPreviousNode();
      if (previous === null) return;

      focusItem(previous.key);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      const next = getNextNode();
      if (next === null) return;

      focusItem(next.key);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();

      const node = getNodeByKey(tree, id);
      if (node === null) return;

      // If the node is not a leaf node (i.e., node with children - root or element), we collapse the node if it is expanded or select the parent node if it is collapsed
      if (node.group === "root" || node.group === "element") {
        const isCollapsed = collapsed.includes(id);
        // If the node is expanded, we collapse it
        if (!isCollapsed) {
          setCollapsed([...collapsed, id]);
          return;
        }
      }
      // If the node is collapsed, we select the parent node if it exists
      const parent = getParentNode();
      if (parent === null) return;

      focusItem(parent.key);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();

      const node = getNodeByKey(tree, id);
      if (node === null) return;

      // If the node is not a leaf node (i.e., node with children - root or element), we expand the node if it is collapsed or select the first child node if it is expanded
      if (node.group === "root" || node.group === "element") {
        const isCollapsed = collapsed.includes(id);

        // If the node is collapsed, we expand it
        if (isCollapsed) {
          setCollapsed(collapsed.filter((key) => key !== id));
          return;
        }

        // If the node is expanded, we select the first child node
        else {
          const child = getFirstChildNode();
          if (child === null) return;

          focusItem(child.key);
        }
      }
    }
  }

  const isLastSelected = selected[selected.length - 1] === id;

  function isNodeVisible(
    node: SerializedElementNode | SerializedRootNode,
    key: string
  ): boolean {
    // If the node is the target node, the node can be reached
    if (node.key === key) return true;

    // We do not traverse the children of a collapsed node
    if (!collapsed.includes(node.key)) {
      for (const child of node.children) {
        if (child.key === key) return true;

        if (child.group === "root" || child.group === "element") {
          if (isNodeVisible(child, key)) return true;
        }
      }
    }

    return false;
  }

  /**
   * Read more: https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/tabindex
   * 1. A negative value means that the element is not reachable via sequential keyboard navigation.
   * 2. A positive value means the element should be focusable in sequential keyboard navigation, with its order defined by the value of the number.
   * 3. tabindex="0" means that the element should be focusable in sequential keyboard navigation, after any positive tabindex values.
   */
  function getTabIndex() {
    // See: https://www.w3.org/WAI/ARIA/apg/patterns/treeview/#keyboardinteraction
    // When a single-select tree receives focus:
    // 1. If none of the nodes are selected before the tree receives focus, focus is set on the first node.
    // 2. If a node is selected before the tree receives focus, focus is set on the selected node.
    if (tree.key === id) {
      if (selected.length === 0) return 0;

      const lastSelectedNode = selected[selected.length - 1];
      const isLastSelectedNodeVisible = isNodeVisible(tree, lastSelectedNode);
      if (!isLastSelectedNodeVisible) return 0;
    }

    // If the item is the last selected item, return 0
    if (isLastSelected) return 0;
    return -1;
  }

  const tabIndex = getTabIndex();

  return (
    <TreeView.ItemText
      {...props}
      ref={ref}
      tabIndex={tabIndex}
      className={classNames(
        className,
        "flex flex-row gap-1 items-center select-none outline-none",
        "pe-2 py-[2px] min-h-[18px]",
        "data-[selected]:bg-[rgb(242_242_242)] dark:data-[selected]:bg-[rgb(60_60_60)] data-[selected]:focus:bg-[rgb(214_226_251)] dark:data-[selected]:dark:focus:bg-[rgb(29_73_115)] text-black dark:text-white",
        "hover:bg-[rgb(242_242_242)] dark:hover:bg-[rgb(60_60_60)]"
      )}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      {children}
    </TreeView.ItemText>
  );
}

function useTree() {
  const tree = use(TreeContext);
  if (tree === null) {
    throw new Error("useTree must be used within the NodeTree component");
  }
  return tree;
}

function useSelectedState() {
  const state = use(SelectedStateContext);
  if (state === null) {
    throw new Error(
      "useSelectedState must be used within the NodeTree component"
    );
  }
  return state;
}

function useCollapsedState() {
  const state = use(CollapsedStateContext);
  if (state === null) {
    throw new Error(
      "useCollapsedState must be used within the NodeTree component"
    );
  }
  return state;
}

function useEditorId() {
  const id = use(EditorIdContext);
  if (id === null) {
    throw new Error("useEditorId must be used within the NodeTree component");
  }
  return id;
}

function useItems() {
  const items = useContext(ItemsContext);
  if (items === null) {
    throw new Error("useItems must be used within the NodeTree component");
  }
  return items;
}

/**
 * Retrieve a node from the tree by its key.
 * @param node The node to search in for the child.
 * @param key The key of the child node to find.
 * @returns The child node if found, otherwise null.
 */
export function getNodeByKey(
  node: SerializedLexicalNode,
  key: string
): SerializedLexicalNode | null {
  if (node.key === key) return node;

  if (node.group === "root" || node.group === "element") {
    for (const child of node.children) {
      // If a matching child was found, return the child
      const node = getNodeByKey(child, key);
      if (node !== null) return node;

      // Otherwise, continue searching in the next child
    }
  }

  return null;
}
