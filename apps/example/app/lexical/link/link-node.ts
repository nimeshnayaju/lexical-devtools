/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * MIT License
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.

 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import type {
  BaseSelection,
  DOMConversionMap,
  DOMConversionOutput,
  EditorConfig,
  LexicalNode,
  NodeKey,
  RangeSelection,
  SerializedElementNode,
} from "lexical";

import {
  $applyNodeReplacement,
  $isRangeSelection,
  ElementNode,
  Spread,
} from "lexical";

export type LinkAttributes = {
  rel?: null | string;
  target?: null | string;
  title?: null | string;
};

export type SerializedLinkNode = Spread<
  {
    url: string;
  },
  Spread<LinkAttributes, SerializedElementNode>
>;

const SUPPORTED_URL_PROTOCOLS = new Set([
  "http:",
  "https:",
  "mailto:",
  "sms:",
  "tel:",
]);

/** @noInheritDoc */
export class LinkNode extends ElementNode {
  /** @internal */
  __url: string;
  /** @internal */
  __target: null | string;
  /** @internal */
  __rel: null | string;
  /** @internal */
  __title: null | string;

  static getType(): string {
    return "link";
  }

  static clone(node: LinkNode): LinkNode {
    return new LinkNode(
      node.__url,
      { rel: node.__rel, target: node.__target, title: node.__title },
      node.__key
    );
  }

  constructor(url: string, attributes: LinkAttributes = {}, key?: NodeKey) {
    super(key);
    const { target = null, rel = null, title = null } = attributes;
    this.__url = url;
    this.__target = target;
    this.__rel = rel;
    this.__title = title;
  }

  createDOM(config: EditorConfig): HTMLAnchorElement {
    const element = document.createElement("a");
    element.href = this.sanitizeUrl(this.__url);
    if (this.__target !== null) {
      element.target = this.__target;
    }
    if (this.__rel !== null) {
      element.rel = this.__rel;
    }
    if (this.__title !== null) {
      element.title = this.__title;
    }
    addClassNamesToElement(element, config.theme.link);

    element.addEventListener("click", (event) => {
      event.preventDefault();
      window.open(element.href, "_blank");
    });
    return element;
  }

  updateDOM(
    prevNode: LinkNode,
    anchor: HTMLAnchorElement,
    config: EditorConfig
  ): boolean {
    const url = this.__url;
    const target = this.__target;
    const rel = this.__rel;
    const title = this.__title;
    if (url !== prevNode.__url) {
      anchor.href = url;
    }

    if (target !== prevNode.__target) {
      if (target) {
        anchor.target = target;
      } else {
        anchor.removeAttribute("target");
      }
    }

    if (rel !== prevNode.__rel) {
      if (rel) {
        anchor.rel = rel;
      } else {
        anchor.removeAttribute("rel");
      }
    }

    if (title !== prevNode.__title) {
      if (title) {
        anchor.title = title;
      } else {
        anchor.removeAttribute("title");
      }
    }
    return false;
  }

  static importDOM(): DOMConversionMap | null {
    return {
      a: (node: Node) => ({
        conversion: $convertAnchorElement,
        priority: 1,
      }),
    };
  }

  static importJSON(
    serializedNode: SerializedLinkNode | SerializedAutoLinkNode
  ): LinkNode {
    const node = $createLinkNode(serializedNode.url, {
      rel: serializedNode.rel,
      target: serializedNode.target,
      title: serializedNode.title,
    });
    node.setFormat(serializedNode.format);
    node.setIndent(serializedNode.indent);
    node.setDirection(serializedNode.direction);
    return node;
  }

  sanitizeUrl(url: string): string {
    try {
      const parsedUrl = new URL(url);
      // eslint-disable-next-line no-script-url
      if (!SUPPORTED_URL_PROTOCOLS.has(parsedUrl.protocol)) {
        return "about:blank";
      }
    } catch {
      return url;
    }
    return url;
  }

  exportJSON(): SerializedLinkNode {
    return {
      ...super.exportJSON(),
      rel: this.getRel(),
      target: this.getTarget(),
      title: this.getTitle(),
      type: "link",
      url: this.getURL(),
      version: 1,
    };
  }

  getURL(): string {
    return this.getLatest().__url;
  }

  setURL(url: string): void {
    const writable = this.getWritable();
    writable.__url = url;
  }

  getTarget(): null | string {
    return this.getLatest().__target;
  }

  setTarget(target: null | string): void {
    const writable = this.getWritable();
    writable.__target = target;
  }

  getRel(): null | string {
    return this.getLatest().__rel;
  }

  setRel(rel: null | string): void {
    const writable = this.getWritable();
    writable.__rel = rel;
  }

  getTitle(): null | string {
    return this.getLatest().__title;
  }

  setTitle(title: null | string): void {
    const writable = this.getWritable();
    writable.__title = title;
  }

  insertNewAfter(
    _: RangeSelection,
    restoreSelection = true
  ): null | ElementNode {
    const linkNode = $createLinkNode(this.__url, {
      rel: this.__rel,
      target: this.__target,
      title: this.__title,
    });
    this.insertAfter(linkNode, restoreSelection);
    return linkNode;
  }

  canInsertTextBefore(): false {
    return false;
  }

  canInsertTextAfter(): false {
    return false;
  }

  canBeEmpty(): false {
    return false;
  }

  isInline(): true {
    return true;
  }

  extractWithChild(
    child: LexicalNode,
    selection: BaseSelection,
    destination: "clone" | "html"
  ): boolean {
    if (!$isRangeSelection(selection)) {
      return false;
    }

    const anchorNode = selection.anchor.getNode();
    const focusNode = selection.focus.getNode();

    return (
      this.isParentOf(anchorNode) &&
      this.isParentOf(focusNode) &&
      selection.getTextContent().length > 0
    );
  }
}

function $convertAnchorElement(domNode: Node): DOMConversionOutput {
  let node = null;
  if (isHTMLAnchorElement(domNode)) {
    const content = domNode.textContent;
    if ((content !== null && content !== "") || domNode.children.length > 0) {
      node = $createLinkNode(domNode.getAttribute("href") || "", {
        rel: domNode.getAttribute("rel"),
        target: domNode.getAttribute("target"),
        title: domNode.getAttribute("title"),
      });
    }
  }
  return { node };
}

/**
 * Takes a URL and creates a LinkNode.
 * @param url - The URL the LinkNode should direct to.
 * @param attributes - Optional HTML a tag attributes \\{ target, rel, title \\}
 * @returns The LinkNode.
 */
export function $createLinkNode(
  url: string,
  attributes?: LinkAttributes
): LinkNode {
  return $applyNodeReplacement(new LinkNode(url, attributes));
}

/**
 * Determines if node is a LinkNode.
 * @param node - The node to be checked.
 * @returns true if node is a LinkNode, false otherwise.
 */
export function $isLinkNode(
  node: LexicalNode | null | undefined
): node is LinkNode {
  return node instanceof LinkNode;
}

/**
 * Takes an HTML element and adds the classNames passed within an array,
 * ignoring any non-string types. A space can be used to add multiple classes
 * eg. addClassNamesToElement(element, ['element-inner active', true, null])
 * will add both 'element-inner' and 'active' as classes to that element.
 * @param element - The element in which the classes are added
 * @param classNames - An array defining the class names to add to the element
 */
function addClassNamesToElement(
  element: HTMLElement,
  ...classNames: Array<typeof undefined | boolean | null | string>
): void {
  const classesToAdd = normalizeClassNames(...classNames);
  if (classesToAdd.length > 0) {
    element.classList.add(...classesToAdd);
  }
}

function normalizeClassNames(
  ...classNames: Array<typeof undefined | boolean | null | string>
): Array<string> {
  const rval = [];
  for (const className of classNames) {
    if (className && typeof className === "string") {
      for (const [s] of className.matchAll(/\S+/g)) {
        rval.push(s);
      }
    }
  }
  return rval;
}

/**
 * @param x - The element being tested
 * @returns Returns true if x is an HTML anchor tag, false otherwise
 */
function isHTMLAnchorElement(x: Node): x is HTMLAnchorElement {
  return isHTMLElement(x) && x.tagName === "A";
}

/**
 * @param x - The element being testing
 * @returns Returns true if x is an HTML element, false otherwise.
 */
function isHTMLElement(x: Node | EventTarget): x is HTMLElement {
  // @ts-ignore-next-line - strict check on nodeType here should filter out non-Element EventTarget implementors
  return x.nodeType === 1;
}
