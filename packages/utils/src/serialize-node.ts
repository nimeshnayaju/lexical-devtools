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
      group: "root",
      key: node.getKey(),
      type: node.getType(),
      children,
      meta,
    };
  }

  if ($isElementNode(node)) {
    const children = node.getChildren().map((child) => $serializeNode(child));
    return {
      group: "element",
      key: node.getKey(),
      type: node.getType(),
      children,
      meta,
    };
  }

  if ($isDecoratorNode(node)) {
    return {
      group: "decorator",
      key: node.getKey(),
      type: node.getType(),
      meta,
    };
  }

  if ($isTextNode(node)) {
    return {
      group: "text",
      key: node.getKey(),
      type: node.getType(),
      text: node.getTextContent(),
      meta,
    };
  }

  return {
    group: "unknown",
    key: node.getKey(),
    type: node.getType(),
    meta,
  };
}

export interface BaseSerializedNode {
  key: string;
  type: string;
  meta: JsonObject;
}

export interface SerializedRootNode extends BaseSerializedNode {
  group: "root";
  children: SerializedLexicalNode[];
}

export interface SerializedElementNode extends BaseSerializedNode {
  group: "element";
  children: SerializedLexicalNode[];
}

export interface SerializedTextNode extends BaseSerializedNode {
  group: "text";
  text: string;
}

export interface SerializedDecoratorNode extends BaseSerializedNode {
  group: "decorator";
}

export interface SerializedLineBreakNode extends BaseSerializedNode {
  group: "line-break";
}

export interface SerializedUnknownNode extends BaseSerializedNode {
  group: "unknown";
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
