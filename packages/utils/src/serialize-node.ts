import {
  $isDecoratorNode,
  $isElementNode,
  $isRootNode,
  $isTextNode,
  ElementNode,
  LexicalNode,
  RootNode,
  TextNode,
} from "lexical";

export default function $serializeNode(node: RootNode): SerializedRootNode;
export default function $serializeNode(
  node: ElementNode
): SerializedElementNode;
export default function $serializeNode(node: TextNode): SerializedTextNode;
export default function $serializeNode(
  node: LexicalNode
): SerializedLexicalNode;
export default function $serializeNode(
  node: LexicalNode
): SerializedLexicalNode {
  const meta = node.exportJSON();

  if ($isRootNode(node)) {
    const children = node.getChildren().map((child) => $serializeNode(child));
    return {
      type: "root",
      key: node.getKey(),
      class: node.constructor.name,
      children,
      meta,
    };
  }

  if ($isElementNode(node)) {
    const children = node.getChildren().map((child) => $serializeNode(child));
    return {
      type: "element",
      key: node.getKey(),
      class: node.constructor.name,
      children,
      meta,
    };
  }

  if ($isDecoratorNode(node)) {
    return {
      type: "decorator",
      key: node.getKey(),
      class: node.constructor.name,
      meta,
    };
  }

  if ($isTextNode(node)) {
    return {
      type: "text",
      key: node.getKey(),
      class: node.constructor.name,
      text: node.getTextContent(),
      meta,
    };
  }

  return {
    type: "unknown",
    key: node.getKey(),
    class: node.constructor.name,
    meta,
  };
}

export interface BaseSerializedNode {
  key: string;
  class: string;
  meta: JsonObject;
}

export interface SerializedRootNode extends BaseSerializedNode {
  type: "root";
  children: SerializedLexicalNode[];
}

export interface SerializedElementNode extends BaseSerializedNode {
  type: "element";
  children: SerializedLexicalNode[];
}

export interface SerializedTextNode extends BaseSerializedNode {
  type: "text";
  text: string;
}

export interface SerializedDecoratorNode extends BaseSerializedNode {
  type: "decorator";
}

export interface SerializedLineBreakNode extends BaseSerializedNode {
  type: "line-break";
}

export interface SerializedUnknownNode extends BaseSerializedNode {
  type: "unknown";
}

export type SerializedLexicalNode =
  | SerializedRootNode
  | SerializedElementNode
  | SerializedTextNode
  | SerializedDecoratorNode
  | SerializedLineBreakNode
  | SerializedUnknownNode;

export type Json = JsonScalar | JsonArray | JsonObject;
export type JsonScalar = string | number | boolean | null;
export type JsonArray = Json[];
export type JsonObject = { [key: string]: Json | undefined };

export function isJsonScalar(data: Json): data is JsonScalar {
  return (
    data === null ||
    typeof data === "string" ||
    typeof data === "number" ||
    typeof data === "boolean"
  );
}

export function isJsonArray(data: Json): data is JsonArray {
  return Array.isArray(data);
}

export function isJsonObject(data: Json): data is JsonObject {
  return !isJsonScalar(data) && !isJsonArray(data);
}
