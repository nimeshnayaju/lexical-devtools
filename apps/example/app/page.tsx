"use client";

import { useEffect } from "react";
import Composer, { useComposer } from "./lexical/composer";
import ContentEditable from "./lexical/content-editable";
import DecoratorsPlugin from "./lexical/decorator-plugin";
import HistoryPlugin from "./lexical/history-plugin";
import Placeholder from "./lexical/placeholder";
import RichTextPlugin from "./lexical/rich-text-plugin";
import { $getRoot, $createParagraphNode, $createTextNode } from "lexical";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";

export default function Home() {
  return (
    <main className="h-screen bg-white font-sans dark:bg-zinc-900">
      <Composer
        config={{
          namespace: "devtools",
          nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode],
          theme: {
            text: {
              bold: "font-bold",
              italic: "italic",
              underline: "underline",
              strikethrough: "line-through",
            },
            heading: {
              h1: "text-4xl font-bold",
              h2: "text-3xl font-bold",
              h3: "text-2xl font-bold",
              h4: "text-xl font-bold",
              h5: "text-lg font-bold",
              h6: "text-base font-bold",
            },
            paragraph: "text-base",
            code: "text-base font-mono",
          },
          onError: (error) => {
            console.error(error);
          },
        }}
      >
        <div className="flex flex-row relative text-base h-full w-full flex-grow overflow-scroll">
          <div className="relative w-full">
            <ContentEditable className="h-full w-full outline-none" />

            <Placeholder>
              <div className="pointer-events-none absolute top-0 left-0 text-gray-400 dark:text-gray-500">
                Start typing...
              </div>
            </Placeholder>

            <DecoratorsPlugin />
            <RichTextPlugin />
            <HistoryPlugin />

            <InitialEditorValuePlugin />
          </div>
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
      const paragraph = $createParagraphNode();
      paragraph.append($createTextNode("Hello World"));
      root.append(paragraph);
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
