import {
  createContext,
  HTMLAttributes,
  MouseEvent,
  ReactNode,
  use,
  useCallback,
} from "react";

interface RootProps {
  value: string[]; // The keys of the nodes that are selected.
  onValueChange: (value: string[]) => void;

  collapsed: string[]; // The keys of the nodes that are collapsed.
  onCollapsedChange: (collapsed: string[]) => void;

  children: ReactNode;
}

const CollapsedContext = createContext<string[] | null>(null);
const CollapsedDispatchContext = createContext<
  ((collapsed: string[]) => void) | null
>(null);

const SelectedContext = createContext<string[] | null>(null);
const SelectedDispatchContext = createContext<
  ((value: string[]) => void) | null
>(null);

function Root(props: RootProps) {
  const { children, value, onValueChange, collapsed, onCollapsedChange } =
    props;

  return (
    <CollapsedContext.Provider value={collapsed}>
      <CollapsedDispatchContext.Provider value={onCollapsedChange}>
        <SelectedContext.Provider value={value}>
          <SelectedDispatchContext.Provider value={onValueChange}>
            {children}
          </SelectedDispatchContext.Provider>
        </SelectedContext.Provider>
      </CollapsedDispatchContext.Provider>
    </CollapsedContext.Provider>
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
  const { children, value, style, onClick, onDoubleClick, ...liProps } = props;

  const isSelected = useIsSelected(value);

  const isCollapsed = useIsCollapsed(value);

  const select = useSelectNode(value);
  const expand = useExpandNode(value);

  const ancestors = use(AncestorsContext);

  // The depth of the item in the tree (0-indexed) is the number of ancestors of the item.
  const depth = ancestors.length;

  function handleClick(event: MouseEvent<HTMLLIElement>) {
    onClick?.(event);
    if (event.defaultPrevented) return;

    select();
    event.stopPropagation();
  }

  function handleDoubleClick(event: MouseEvent<HTMLLIElement>) {
    onDoubleClick?.(event);
    if (event.defaultPrevented) return;

    expand();
    event.stopPropagation();
  }

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
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
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
  const select = useSelectNode(value);

  function handleClick(event: MouseEvent<HTMLSpanElement>) {
    onClick?.(event);
    if (event.defaultPrevented) return;

    select();
    if (isCollapsed) {
      expand();
    } else {
      collapse();
    }

    event.stopPropagation();
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

function useSelected(): string[] {
  const selected = use(SelectedContext);
  if (selected === null) {
    throw new Error("SelectedContext not found");
  }
  return selected;
}

function useDispatchSelected() {
  const dispatch = use(SelectedDispatchContext);
  if (dispatch === null) {
    throw new Error("useDispatchSelected must be used within a Root component");
  }
  return dispatch;
}

function useCollapsed(): string[] {
  const collapsed = use(CollapsedContext);
  if (collapsed === null) {
    throw new Error("CollapsedContext not found");
  }
  return collapsed;
}

function useDispatchCollapsed() {
  const dispatch = use(CollapsedDispatchContext);
  if (dispatch === null) {
    throw new Error("CollapsedDispatchContext not found");
  }
  return dispatch;
}

/**
 * Returns whether the node with the given key is collapsed or not.
 * @param key The key of the node to check.
 * @returns true if the node with the given key is collapsed, false otherwise.
 */
function useIsCollapsed(key: string): boolean {
  const collapsed = useCollapsed();
  const isCollapsed = collapsed.includes(key);
  return isCollapsed;
}

/**
 * Returns whether the node with the given key is selected or not.
 * @param key The key of the node to check.
 * @returns true if the node with the given key is selected, false otherwise.
 */
function useIsSelected(key: string): boolean {
  const selected = useSelected();
  const isSelected = selected.includes(key);
  return isSelected;
}

function useCollapseNode(key: string) {
  const collapsed = useCollapsed();
  const dispatch = useDispatchCollapsed();

  const collapse = useCallback(() => {
    if (collapsed.includes(key)) return;

    dispatch([...collapsed, key]);
  }, [collapsed, key, dispatch]);

  return collapse;
}

/**
 * Returns a function that expands the node with the given key. If the node is not expanded, the node will be expanded along with all its parent nodes.
 * @param key The key of the node to expand.
 * @returns A function that expands the node with the given key.
 */
function useExpandNode(key: string) {
  const collapsed = useCollapsed();
  const dispatch = useDispatchCollapsed();

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
    dispatch(collapsed.filter((k) => !keys.includes(k)));
  }, [ancestors, key, dispatch, collapsed]);

  return expandNode;
}

/**
 * Returns a function that selects the node with the given key. All of the nodes' ancestors will be expanded if they are not already expanded.
 * @param key The key of the node to select.
 * @returns A function that selects the node with the given key.
 */
function useSelectNode(key: string) {
  const isSelected = useIsSelected(key);
  const dispatchSelected = useDispatchSelected();

  const collapsed = useCollapsed();
  const dispatchCollapsed = useDispatchCollapsed();

  const ancestors = use(AncestorsContext);

  /**
   * Select the node with the given key. All of the nodes' ancestors will be expanded if they are not already expanded.
   */
  const selectNode = useCallback(() => {
    if (isSelected) return;

    // Expand all ancestors of the node to select
    dispatchCollapsed(collapsed.filter((k) => !ancestors.includes(k)));

    // Select the node
    dispatchSelected([key]);
  }, [
    isSelected,
    collapsed,
    dispatchCollapsed,
    ancestors,
    dispatchSelected,
    key,
  ]);

  return selectNode;
}

export {
  Root,
  Tree,
  Item,
  Trigger,
  RootProps,
  TreeProps,
  ItemProps,
  TriggerProps,
};
