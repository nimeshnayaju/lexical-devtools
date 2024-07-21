import { createContext, HTMLAttributes, use, useId, useState } from "react";
import {
  Json,
  JsonArray,
  JsonObject,
  JsonScalar,
} from "@lexical-devtools/utils";
import * as TreeView from "./tree-view";
import classNames from "./class-names";
import TriangleRightIcon from "./icons/triangle-right-icon";

const CollapsedStateContext = createContext<
  [string[], (collapsed: string[]) => void] | null
>(null);

const HighlightedStateContext = createContext<
  [string | null, (highlighted: string | null) => void] | null
>(null);

interface JsonTreeProps extends HTMLAttributes<HTMLUListElement> {
  data: JsonObject;
}

export default function JsonTree({ data, ...props }: JsonTreeProps) {
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [highlighted, setHighlighted] = useState<string | null>(null);

  return (
    <CollapsedStateContext.Provider value={[collapsed, setCollapsed]}>
      <HighlightedStateContext.Provider value={[highlighted, setHighlighted]}>
        <TreeView.Root collapsed={collapsed} onCollapsedChange={setCollapsed}>
          <TreeView.Tree {...props}>
            {Object.entries(data).map(([key, value]) => (
              <TreeItem key={key} data={{ key, value }} />
            ))}
          </TreeView.Tree>
        </TreeView.Root>
      </HighlightedStateContext.Provider>
    </CollapsedStateContext.Provider>
  );
}

function ItemText({ children, className }: TreeView.ItemTextProps) {
  return (
    <TreeView.ItemText
      className={classNames(
        className,
        "flex flex-row gap-1 items-center select-none outline-none",
        "pe-2 py-[2px] min-h-[18px]"
      )}
    >
      {children}
    </TreeView.ItemText>
  );
}

function ScalarItem({ data }: { data: { key: string; value: JsonScalar } }) {
  const { key, value } = data;
  const id = useId();

  return (
    <TreeView.Item value={id}>
      <ItemText className="px-[calc(var(--depth)*1rem+4px+16px+4px)]">
        {/* <JsonIcon data={value} className="w-3 h-3" /> */}
        <span>{key}:</span>
        <span className="truncate">{stringify(value)}</span>
      </ItemText>
    </TreeView.Item>
  );
}

function ArrayItem({ data }: { data: { key: string; value: JsonArray } }) {
  const { key, value } = data;
  const id = useId();
  const [collapsed] = useCollapsedState();
  const isCollapsed = collapsed.includes(id);

  return (
    <TreeView.Item value={id}>
      <ItemText className="px-[calc(var(--depth)*1rem+4px)]">
        <TreeView.Trigger className="group">
          <TriangleRightIcon
            className="group-data-[state=open]:rotate-90 h-4 w-4"
            aria-hidden
          />
        </TreeView.Trigger>

        <div className="flex flex-row gap-1 items-center truncate">
          <span className="text-mono">{key}:</span>

          <span className="text-[rgb(161_161_161)] dark:text-[rgb(143_143_143)] text-[10px] truncate">
            {isCollapsed ? stringify(value) : <>[{value.length} items]</>}
          </span>
        </div>
      </ItemText>

      <TreeView.Tree>
        {value.map((item, index) => (
          <TreeItem key={index} data={{ key: String(index), value: item }} />
        ))}
      </TreeView.Tree>
    </TreeView.Item>
  );
}

function ObjectItem({ data }: { data: { key: string; value: JsonObject } }) {
  const { key, value } = data;
  const id = useId();
  const [collapsed] = useCollapsedState();
  const isCollapsed = collapsed.includes(id);

  return (
    <TreeView.Item value={id}>
      <ItemText className="px-[calc(var(--depth)*1rem+4px)]">
        <TreeView.Trigger className="group">
          <TriangleRightIcon
            className="group-data-[state=open]:rotate-90 h-4 w-4"
            aria-hidden
          />
        </TreeView.Trigger>

        <div className="flex flex-row gap-1 items-center truncate">
          <span>{key}:</span>

          <span className="text-[rgb(161_161_161)] dark:text-[rgb(143_143_143)] text-[10px] truncate">
            {isCollapsed ? (
              stringify(value)
            ) : (
              <>[{Object.keys(value).length} items]</>
            )}
          </span>
        </div>
      </ItemText>

      <TreeView.Tree>
        {Object.entries(value).map(([key, value]) => (
          <TreeItem key={key} data={{ key, value }} />
        ))}
      </TreeView.Tree>
    </TreeView.Item>
  );
}

function TreeItem({
  data,
}: {
  data: { key: string; value: Json | undefined };
}) {
  const { key, value } = data;

  if (value === undefined) return null;

  if (isJsonScalar(value)) {
    return <ScalarItem data={{ key, value }} />;
  }

  if (isJsonArray(value)) {
    return <ArrayItem data={{ key, value }} />;
  }

  if (isJsonObject(value)) {
    return <ObjectItem data={{ key, value }} />;
  }

  return null;
}

function stringify(
  value: Json | undefined,
  maxDepth = 2,
  depth = 0,
  seen = new WeakSet<JsonObject | Json[]>()
): string {
  if (Array.isArray(value)) {
    const isCircular = seen.has(value);

    seen.add(value);

    if (value.length === 0) {
      return wrapArray();
    } else if (depth >= maxDepth || isCircular) {
      return wrapArray(ELLIPSIS);
    } else {
      const values = value
        .map((value) => stringify(value, maxDepth, depth + 1, seen))
        .join(SEPARATOR);

      return wrapArray(values);
    }
  } else if (typeof value === "object" && value !== null) {
    const keys = Object.keys(value);
    const isCircular = seen.has(value);

    seen.add(value);

    if (keys.length === 0) {
      return wrapObject();
    } else if (depth >= maxDepth || isCircular) {
      return wrapObject(ELLIPSIS);
    } else {
      const values = keys
        .map((key) =>
          wrapProperty(key, stringify(value[key], maxDepth, depth + 1, seen))
        )
        .join(SEPARATOR);
      return wrapObject(values);
    }
  } else {
    return JSON.stringify(value);
  }
}

const SEPARATOR = ", ";
const ELLIPSIS = "…";

function wrapProperty(key: string | number, value: string) {
  return `${key}: ${value}`;
}

function wrapArray(values?: string) {
  return `[${values ?? ""}]`;
}

function wrapObject(values?: string) {
  return values ? `{ ${values} }` : "{}";
}

function useCollapsedState() {
  const state = use(CollapsedStateContext);
  if (state === null) {
    throw new Error(
      "useCollapsedState must be used within the JsonTree component"
    );
  }
  return state;
}

function useHighlightedState() {
  const state = use(HighlightedStateContext);
  if (state === null) {
    throw new Error(
      "useHighlightedState must be used within the JsonTree component"
    );
  }
  return state;
}

function isJsonScalar(data: Json): data is JsonScalar {
  return (
    data === null ||
    typeof data === "string" ||
    typeof data === "number" ||
    typeof data === "boolean"
  );
}

function isJsonArray(data: Json): data is JsonArray {
  return Array.isArray(data);
}

function isJsonObject(data: Json): data is JsonObject {
  return !isJsonScalar(data) && !isJsonArray(data);
}
