"use client";

import { useEffect } from "react";
import Composer, { useComposer } from "./lexical/composer";
import ContentEditable from "./lexical/content-editable";
import DecoratorsPlugin from "./lexical/decorator-plugin";
import HistoryPlugin from "./lexical/history-plugin";
import Placeholder from "./lexical/placeholder";
import RichTextPlugin from "./lexical/rich-text-plugin";
import { $getRoot, $createParagraphNode, $createTextNode } from "lexical";
import { $createHeadingNode, HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import DevToolsPlugin from "./lexical/devtools-plugin";
import { $createLinkNode, AutoLinkNode, LinkNode } from "@lexical/link";
import {
  $createCodeHighlightNode,
  $createCodeNode,
  CodeHighlightNode,
  CodeNode,
} from "@lexical/code";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col max-w-[935px] m-auto p-14">
      <Composer
        config={{
          namespace: "devtools",
          nodes: [
            HeadingNode,
            QuoteNode,
            ListNode,
            ListItemNode,
            LinkNode,
            AutoLinkNode,
            CodeNode,
            CodeHighlightNode,
          ],
          theme: {
            text: {
              bold: "font-bold",
              italic: "italic",
              underline: "underline",
              strikethrough: "line-through",
              code: "font-mono bg-gray-100 dark:bg-gray-800 p-1 rounded text-sm",
            },
            quote: "border-l-4 border-gray-300 dark:border-gray-700 pl-4 mb-4",
            heading: {
              h1: "text-4xl font-bold mb-4",
              h2: "text-3xl font-bold mb-4",
              h3: "text-2xl font-bold mb-4",
              h4: "text-xl font-bold mb-4",
              h5: "text-lg font-bold mb-4",
              h6: "text-base font-bold mb-4",
            },
            paragraph: "text-base mb-4",
            link: "text-blue-500 underline",
            list: {
              ul: "list-disc mb-4",
              ol: "list-decimal mb-4",
              listitem: "ml-4 mb-1",
            },
            code: "block font-mono bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded text-sm mb-4",
          },
          onError: (error) => {
            console.error(error);
          },
        }}
      >
        <div className="relative text-base flex-1 flex">
          <ContentEditable className="outline-none flex-1" />

          <Placeholder>
            <div className="pointer-events-none absolute top-0 left-0 text-gray-400 dark:text-gray-500">
              Start typing...
            </div>
          </Placeholder>

          <DevToolsPlugin />

          <DecoratorsPlugin />
          <RichTextPlugin />
          <HistoryPlugin />

          <InitialEditorValuePlugin />
        </div>
      </Composer>
    </main>
  );
}

function InitialEditorValuePlugin() {
  const editor = useComposer();

  useEffect(() => {
    editor.update(() => {
      const root = $getRoot();

      root.append(
        $createHeadingNode("h1").append($createTextNode("Lexical DevTools"))
      );

      root.append(
        $createParagraphNode().append(
          $createTextNode(
            `Lexical DevTools is a browser devtools extension that lets you inspect your Lexical.js editor state.`
          )
        )
      );

      root.append(
        $createParagraphNode().append(
          $createTextNode(`To get started, install `),
          $createLinkNode(
            "https://chromewebstore.google.com/detail/lexical-devtools/dmbopeepjkdlplkjcjbnfiikajiddhnd"
          ).append($createTextNode("Lexical Developer Tools")),
          $createTextNode(
            " from the Chrome Web Store. After installation, you can inspect the editor state of this page by opening the Chrome DevTools and navigating to the Lexical tab."
          )
        )
      );

      root.append(
        $createParagraphNode().append(
          $createTextNode(
            "To inspect the editor state of the Lexical.js editor in your React project, install "
          ),
          $createTextNode("@lexical-devtools/react").toggleFormat("code"),
          $createTextNode(".")
        )
      );

      root.append(
        $createCodeNode().append(
          $createCodeHighlightNode("npm i @lexical-devtools/react")
        )
      );

      root.append(
        $createParagraphNode().append(
          $createTextNode("Next, import "),
          $createTextNode("DevtoolsPlugin").toggleFormat("code"),
          $createTextNode(" into your "),
          $createTextNode("LexicalComposer").toggleFormat("code"),
          $createTextNode(" component.")
        )
      );

      root.append(
        $createCodeNode("javascript").append(
          $createCodeHighlightNode(
            `import { LexicalComposer } from "@lexical/react/LexicalComposer";\n`
          ),
          $createCodeHighlightNode(
            `import DevtoolsPlugin from "@lexical/react";\n\n`
          ),
          $createCodeHighlightNode(`export default function Page() {\n`),
          $createCodeHighlightNode(`  const config = {\n`),
          $createCodeHighlightNode(`    // ...\n`),
          $createCodeHighlightNode(`  };\n\n`),
          $createCodeHighlightNode(`  return (\n`),
          $createCodeHighlightNode(
            `    <LexicalComposer initialConfig={config}>\n`
          ),
          $createCodeHighlightNode(`      // ...\n`),
          $createCodeHighlightNode(`      <DevtoolsPlugin />\n`),
          $createCodeHighlightNode(`    </LexicalComposer>\n`),
          $createCodeHighlightNode(`  );\n`),
          $createCodeHighlightNode(`}\n`)
        )
      );

      root.append(
        $createParagraphNode().append(
          $createTextNode(
            "If you find Lexical DevTools helpful, consider giving the project a star on "
          ),
          $createLinkNode(
            "https://github.com/nimeshnayaju/lexical-devtools"
          ).append($createTextNode("GitHub")),
          $createTextNode(".")
        )
      );
    });

    return () => {
      editor.update(() => {
        const root = $getRoot();
        root.clear();
      });
    };
  }, [editor]);

  return null;
}
