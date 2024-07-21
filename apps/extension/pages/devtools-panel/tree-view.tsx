import {
  createContext,
  HTMLAttributes,
  MouseEvent,
  ReactNode,
  RefObject,
  use,
  useCallback,
} from "react";

type SelectedStateProps =
  | {
      selected: string[]; // The keys of the nodes that are selected.
      onSelectedChange: (selected: string[]) => void;
    }
  | {
      selected?: never;
      onSelectedChange?: never;
    };

type CollapsedStateProps = {
  collapsed: string[]; // The keys of the nodes that are collapsed.
  onCollapsedChange: (collapsed: string[]) => void;
};

type RootProps = SelectedStateProps &
  CollapsedStateProps & {
    children: ReactNode;
  };

type SelectedState = [string[], (selected: string[]) => void];
const SelectedStateContext = createContext<SelectedState | null>(null);

type CollapsedState = [string[], (collapsed: string[]) => void];
const CollapsedStateContext = createContext<CollapsedState | null>(null);

function Root(props: RootProps) {
  const { children, selected, onSelectedChange, collapsed, onCollapsedChange } =
    props;

  const selectedState: SelectedState | null =
    selected !== undefined ? [selected, onSelectedChange] : null;

  const collapsedState: CollapsedState | null =
    collapsed !== undefined ? [collapsed, onCollapsedChange] : null;

  return (
    <SelectedStateContext.Provider value={selectedState}>
      <CollapsedStateContext.Provider value={collapsedState}>
        {children}
      </CollapsedStateContext.Provider>
    </SelectedStateContext.Provider>
  );
}

interface TreeProps extends HTMLAttributes<HTMLUListElement> {}

function Tree(props: TreeProps) {
  const { children, ...ulProps } = props;

  const value = use(ItemValueContext);

  if (value === null) {
    return (
      <ul role="tree" {...ulProps}>
        {children}
      </ul>
    );
  }

  return <SubTree {...props} value={value} />;
}

interface SubTreeProps extends TreeProps {
  value: string;
}

function SubTree(props: SubTreeProps) {
  const { children, value, ...ulProps } = props;

  const isCollapsed = useIsCollapsed(value);

  if (isCollapsed) return null;

  return (
    <ul role="group" {...ulProps}>
      {children}
    </ul>
  );
}

const ItemValueContext = createContext<string | null>(null);

const AncestorsContext = createContext<string[]>([]);

interface ItemProps extends HTMLAttributes<HTMLLIElement> {
  value: string;
}

function Item(props: ItemProps) {
  const { children, value, style, ...liProps } = props;

  const isSelected = useIsSelected(value);
  const isCollapsed = useIsCollapsed(value);

  const ancestors = use(AncestorsContext);

  // The depth of the item in the tree (0-indexed) is the number of ancestors of the item.
  const depth = ancestors.length;

  return (
    <AncestorsContext.Provider value={ancestors.concat(value)}>
      <ItemValueContext.Provider value={value}>
        <li
          role="treeitem"
          aria-selected={isSelected}
          aria-expanded={isCollapsed}
          data-state={isCollapsed ? "closed" : "open"}
          data-selected={isSelected ? "" : undefined}
          data-depth={depth}
          {...liProps}
          style={{
            ["--depth" as any]: depth,
            ...style,
          }}
        >
          {children}
        </li>
      </ItemValueContext.Provider>
    </AncestorsContext.Provider>
  );
}

interface TriggerProps extends HTMLAttributes<HTMLSpanElement> {}

function Trigger(props: TriggerProps) {
  const { children, onClick, ...spanProps } = props;

  const value = use(ItemValueContext);
  if (value === null) {
    throw new Error("Trigger must be used within an Item component");
  }

  const collapse = useCollapseNode(value);
  const expand = useExpandNode(value);

  const isCollapsed = useIsCollapsed(value);

  function handleClick(event: MouseEvent<HTMLSpanElement>) {
    onClick?.(event);
    if (event.defaultPrevented) return;

    if (isCollapsed) {
      expand();
    } else {
      collapse();
    }
  }

  return (
    <span
      data-state={isCollapsed ? "closed" : "open"}
      {...spanProps}
      onClick={handleClick}
    >
      {children}
    </span>
  );
}

interface ItemTextProps extends HTMLAttributes<HTMLDivElement> {
  ref?: RefObject<HTMLDivElement>;
}

function ItemText(props: ItemTextProps) {
  const { ref, onClick, onDoubleClick, ...divProps } = props;

  const value = use(ItemValueContext);
  if (value === null) {
    throw new Error("Trigger must be used within an Item component");
  }

  const isSelected = useIsSelected(value);
  const isCollapsed = useIsCollapsed(value);

  const select = useSelectNode(value);
  const expand = useExpandNode(value);

  function handleClick(event: MouseEvent<HTMLDivElement>) {
    onClick?.(event);
    if (event.defaultPrevented) return;

    select?.();
  }

  function handleDoubleClick(event: MouseEvent<HTMLDivElement>) {
    onDoubleClick?.(event);
    if (event.defaultPrevented) return;

    expand();
  }

  return (
    <div
      ref={ref}
      data-state={isCollapsed ? "closed" : "open"}
      data-selected={isSelected ? "" : undefined}
      {...divProps}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    />
  );
}

function useCollapsedState(): CollapsedState {
  const state = use(CollapsedStateContext);
  if (state === null) {
    throw new Error("useCollapsedState must be used within a Root component");
  }
  return state;
}

/**
 * Returns whether the node with the given key is collapsed or not.
 * @param key The key of the node to check.
 * @returns true if the node with the given key is collapsed, false otherwise.
 */
function useIsCollapsed(key: string): boolean {
  const [collapsed] = useCollapsedState();
  const isCollapsed = collapsed.includes(key);
  return isCollapsed;
}

/**
 * Returns whether the node with the given key is selected or not.
 * @param key The key of the node to check.
 * @returns true if the node with the given key is selected, false otherwise. If SelectedStateContext is not found, returns undefined.
 */
function useIsSelected(key: string): boolean | undefined {
  const selected = use(SelectedStateContext);
  const isSelected = selected !== null ? selected[0].includes(key) : undefined;
  return isSelected;
}

function useCollapseNode(key: string) {
  const [collapsed, setCollapsed] = useCollapsedState();

  const collapse = useCallback(() => {
    if (collapsed.includes(key)) return;

    setCollapsed([...collapsed, key]);
  }, [collapsed, key, setCollapsed]);

  return collapse;
}

/**
 * Returns a function that expands the node with the given key. If the node is not expanded, the node will be expanded along with all its parent nodes.
 * @param key The key of the node to expand.
 * @returns A function that expands the node with the given key.
 */
function useExpandNode(key: string) {
  const [collapsed, setCollapsed] = useCollapsedState();

  const ancestors = use(AncestorsContext);

  /**
   * Expand the node with the given key. If the node is not expanded, the node will be expanded along with all its parent nodes.
   * @param key The key of the node to expand.
   */
  const expandNode = useCallback(() => {
    // If the node is not collapsed (i.e., the node is expanded), we do not need to expand it or its parent nodes
    if (!collapsed.includes(key)) return;

    // Include the current node in the list of keys to expand
    const keys = [...ancestors, key];
    setCollapsed(collapsed.filter((k) => !keys.includes(k)));
  }, [ancestors, key, setCollapsed, collapsed]);

  return expandNode;
}

/**
 * Returns a function that selects the node with the given key.
 * @param key The key of the node to select.
 * @returns A function that selects the node with the given key.
 */
function useSelectNode(key: string): (() => void) | null {
  const state = use(SelectedStateContext);
  if (state === null) return null;

  const [selected, setSelected] = state;
  const isSelected = selected.includes(key);

  /**
   * Select the node with the given key.
   */
  const selectNode = useCallback(() => {
    if (isSelected) return;

    // Select the node
    setSelected([key]);
  }, [isSelected, setSelected, key]);

  return selectNode;
}

export {
  Root,
  Tree,
  Item,
  ItemText,
  Trigger,
  RootProps,
  TreeProps,
  TriggerProps,
  ItemTextProps,
};
