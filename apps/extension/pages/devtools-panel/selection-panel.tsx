import { createContext, useState } from "react";
import {
  SerializedLexicalNode,
  SerializedPoint,
  SerializedRootNode,
  SerializedSelection,
} from "@lexical-devtools/utils";
import * as Collapsible from "./collapsible";
import TriangleRightIcon from "./icons/triangle-right-icon";
import TextSelectionOffIcon from "./icons/text-selection-off-icon";

const TreeContext = createContext<SerializedRootNode | null>(null);

const SelectedStateContext = createContext<
  [string[], (selected: string[]) => void] | null
>(null);

const CollapsedStateContext = createContext<
  [string[], (collapsed: string[]) => void] | null
>(null);

export default function SelectionPanel({
  selection,
  data,
  selected,
  onSelectedChange,
  collapsed,
  onCollapsedChange,
}: {
  selection: SerializedSelection | null;
  data: SerializedRootNode;

  selected: string[];
  onSelectedChange: (selected: string[]) => void;

  collapsed: string[];
  onCollapsedChange: (collapsed: string[]) => void;
}) {
  /**
   * Selects the specified node and expands its ancestors.
   * @param key The key of the node to select.
   */
  function handleNodeSelect(key: string) {
    // Select the specified node
    onSelectedChange([key]);

    const ancestors = getAncestors(data, key) ?? [];
    // Expand the ancestors of the selected node
    onCollapsedChange(collapsed.filter((key) => !ancestors.includes(key)));
  }

  if (selection === null) {
    return (
      <div className="flex w-full h-full items-center justify-center gap-2 text-[rgb(71_71_71)] dark:text-[rgb(143_143_143)]">
        <TextSelectionOffIcon className="h-4 w-4" /> No selection
      </div>
    );
  }

  // Map the selected node keys to their corresponding nodes in the tree
  const nodes = selection.nodes
    .map((key) => getNodeByKey(data, key))
    .filter((node): node is SerializedLexicalNode => node !== null);

  return (
    <TreeContext.Provider value={data}>
      <SelectedStateContext.Provider value={[selected, onSelectedChange]}>
        <CollapsedStateContext.Provider value={[collapsed, onCollapsedChange]}>
          <NodesTable nodes={nodes} onNodeSelect={handleNodeSelect} />

          {selection.type === "range" && (
            <RangeTable anchor={selection.anchor} focus={selection.focus} />
          )}
        </CollapsedStateContext.Provider>
      </SelectedStateContext.Provider>
    </TreeContext.Provider>
  );
}

function RangeTable({
  anchor,
  focus,
}: {
  anchor: SerializedPoint;
  focus: SerializedPoint;
}) {
  const [open, setOpen] = useState(true);

  const [anchorOpen, setAnchorOpen] = useState(true);
  const [focusOpen, setFocusOpen] = useState(true);

  return (
    <Collapsible.Root open={open} onOpenChange={setOpen} className="w-full">
      <Collapsible.Trigger className="group flex flex-row w-full gap-1 items-center bg-[rgb(238_242_249)] dark:bg-[rgb(42_44_48)] border-b border-[rgb(214_226_251)] dark:border-[rgb(94_94_94)] h-[25px]">
        <TriangleRightIcon className="group-data-[state=open]:rotate-90 h-4 w-4" />
        <span className="flex items-center gap-2 text-[11px]">Range</span>
      </Collapsible.Trigger>

      <Collapsible.Content className="w-full bg-[rgb(255_255_255)] dark:bg-[rgb(40_40_40)] text-[11px]">
        {/* Anchor */}
        <Collapsible.Root
          open={anchorOpen}
          onOpenChange={setAnchorOpen}
          className="w-full pl-2"
        >
          <Collapsible.Trigger className="group flex flex-row w-full gap-1 items-center py-[2px]">
            <TriangleRightIcon className="group-data-[state=open]:rotate-90 h-4 w-4" />
            <span>Anchor</span>
          </Collapsible.Trigger>

          <Collapsible.Content className="w-full bg-[rgb(255_255_255)] dark:bg-[rgb(40_40_40)] pl-5">
            <dl className="flex flex-col">
              <div className="grid grid-cols-2 gap-2 py-[2px]">
                <dt>Key</dt>
                <dl>{anchor.key}</dl>
              </div>

              <div className="grid grid-cols-2 gap-2 py-[2px]">
                <dt>Offset</dt>
                <dl>{anchor.offset}</dl>
              </div>
            </dl>
          </Collapsible.Content>
        </Collapsible.Root>

        {/* Focus */}
        <Collapsible.Root
          open={focusOpen}
          onOpenChange={setFocusOpen}
          className="w-full pl-2"
        >
          <Collapsible.Trigger className="group flex flex-row w-full gap-1 items-center py-[2px]">
            <TriangleRightIcon className="group-data-[state=open]:rotate-90 h-4 w-4" />
            <span>Focus</span>
          </Collapsible.Trigger>

          <Collapsible.Content className="w-full bg-[rgb(255_255_255)] dark:bg-[rgb(40_40_40)] pl-5">
            <dl className="flex flex-col">
              <div className="grid grid-cols-2 gap-2 py-[2px]">
                <dt>Key</dt>
                <dl>{focus.key}</dl>
              </div>

              <div className="grid grid-cols-2 gap-2 py-[2px]">
                <dt>Offset</dt>
                <dl>{focus.offset}</dl>
              </div>
            </dl>
          </Collapsible.Content>
        </Collapsible.Root>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}

function NodesTable({
  nodes,
}: {
  nodes: SerializedLexicalNode[];
  onNodeSelect: (key: string) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <Collapsible.Root open={open} onOpenChange={setOpen} className="w-full">
      <Collapsible.Trigger className="group flex flex-row w-full gap-1 items-center bg-[rgb(238_242_249)] dark:bg-[rgb(42_44_48)] border-b border-[rgb(214_226_251)] dark:border-[rgb(94_94_94)] h-[25px]">
        <TriangleRightIcon className="group-data-[state=open]:rotate-90 h-4 w-4" />
        <span className="flex items-center gap-2 text-[11px]">Nodes</span>
      </Collapsible.Trigger>

      <Collapsible.Content className="w-full bg-[rgb(255_255_255)] dark:bg-[rgb(40_40_40)] text-[11px]">
        <table className="w-full text-left table-fixed border-b border-[rgb(214_226_251)] dark:border-[rgb(94_94_94)]">
          <thead className="border-b border-[rgb(214_226_251)] dark:border-[rgb(94_94_94)]">
            <tr>
              <th className="px-2 font-medium">Key</th>
              <th className="px-2 font-medium">Type</th>
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {nodes.map((node) => {
              return (
                <tr
                  key={node.key}
                  className="w-full border-b border-[rgb(214_226_251)] dark:border-[rgb(94_94_94)] h-6"
                >
                  <td className="p-0">
                    <span className="px-2">{node.key}</span>
                  </td>

                  <td className="font-light px-2 py-[1px] p-0">{node.type}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}

/**
 * Retrieve a node from the tree by its key.
 * @param node The node to search in for the child.
 * @param key The key of the child node to find.
 * @returns The child node if found, otherwise null.
 */
function getNodeByKey(
  node: SerializedLexicalNode,
  key: string
): SerializedLexicalNode | null {
  if (node.key === key) return node;

  if (node.group === "element" || node.group === "root") {
    for (const child of node.children) {
      const result = getNodeByKey(child, key);
      // If a matching child was found, return the child
      if (result !== null) return result;

      // Otherwise, continue searching in the next child
      continue;
    }
  }

  return null;
}

/**
 * Retrieve the ancestors of a node by its key. The ancestors are returned in order from the root to the parent of the node.
 * For example, given the following tree:
 *
 * ```
 * root
 * ├── element-1
 * │   ├── element-2
 * │   │   └── element-3
 * │   └── element-4
 * └── element-5
 * ```
 *
 * The ancestors of `element-3` would be `["root", "element-1", "element-2"]`.
 *
 * @param node The node to search in for the ancestors.
 * @param key The key of the node to find the ancestors of.
 * @returns The ancestors of the node if found, otherwise null.
 */
function getAncestors(
  node: SerializedLexicalNode,
  key: string
): string[] | null {
  if (node.key === key) return [];

  if (node.group === "element" || node.group === "root") {
    for (const child of node.children) {
      const ancestors = getAncestors(child, key);
      if (ancestors !== null) return [node.key, ...ancestors];
    }
  }

  return null;
}
