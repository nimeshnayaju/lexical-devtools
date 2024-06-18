"use client";

import { useEffect } from "react";
import Composer, { useComposer } from "./lexical/composer";
import ContentEditable from "./lexical/content-editable";
import DecoratorsPlugin from "./lexical/decorator-plugin";
import HistoryPlugin from "./lexical/history-plugin";
import Placeholder from "./lexical/placeholder";
import RichTextPlugin from "./lexical/rich-text-plugin";
import { $getRoot, $createParagraphNode, $createTextNode } from "lexical";
import {
  $createHeadingNode,
  $createQuoteNode,
  HeadingNode,
  QuoteNode,
} from "@lexical/rich-text";
import {
  ListNode,
  ListItemNode,
  $createListNode,
  $createListItemNode,
} from "@lexical/list";
import DevtoolsPlugin from "./lexical/devtools-plugin";
import { $createLinkNode, AutoLinkNode, LinkNode } from "@lexical/link";

export default function Home() {
  return (
    <main className="h-screen bg-white font-sans dark:bg-zinc-900 w-[875px] m-auto p-8">
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
          ],
          theme: {
            text: {
              bold: "font-bold",
              italic: "italic",
              underline: "underline",
              strikethrough: "line-through",
            },
            heading: {
              h1: "text-4xl font-bold mb-4",
              h2: "text-3xl font-bold mb-4",
              h3: "text-2xl font-bold mb-4",
              h4: "text-xl font-bold mb-4",
              h5: "text-lg font-bold mb-4",
              h6: "text-base font-bold mb-4",
            },
            paragraph: "text-base mb-4",
            quote: "text-base text-gray-500 border-l-4 pl-4 mb-4",
            code: "text-base font-mono",
            link: "text-blue-500 underline",
            list: {
              ul: "list-disc",
              ol: "list-decimal",
              listitem: "ml-4",
            },
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

            <DevtoolsPlugin />

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

      // Heading
      const heading = $createHeadingNode("h1");
      heading.append($createTextNode("Lexical developer tools"));
      root.append(heading);

      // Quote
      const quote = $createQuoteNode();
      quote.append(
        $createTextNode(
          `In case you were wondering what the black box at the bottom is – it's the debug view, showing the current state of the editor. ` +
            `You can disable it by pressing on the settings control in the bottom-left of your screen and toggling the debug view setting.`
        )
      );
      root.append(quote);

      // Paragraph
      const paragraph = $createParagraphNode();
      paragraph.append(
        $createTextNode("The playground is a demo environment built with "),
        $createTextNode("@lexical/react").toggleFormat("code"),
        $createTextNode("."),
        $createTextNode(" Try typing in "),
        $createTextNode("some text").toggleFormat("bold"),
        $createTextNode(" with "),
        $createTextNode("different").toggleFormat("italic"),
        $createTextNode(" formats.")
      );
      root.append(paragraph);

      // List
      const list = $createListNode("bullet");
      list.append(
        $createListItemNode().append(
          $createTextNode(`Visit the `),
          $createLinkNode("https://lexical.dev/").append(
            $createTextNode("Lexical website")
          ),
          $createTextNode(` for documentation and more information.`)
        ),
        $createListItemNode().append(
          $createTextNode(`Check out the code on our `),
          $createLinkNode("https://github.com/facebook/lexical").append(
            $createTextNode("GitHub repository")
          ),
          $createTextNode(`.`)
        ),
        $createListItemNode().append(
          $createTextNode(`Playground code can be found `),
          $createLinkNode(
            "https://github.com/facebook/lexical/tree/main/packages/lexical-playground"
          ).append($createTextNode("here")),
          $createTextNode(`.`)
        ),
        $createListItemNode().append(
          $createTextNode(`Join our `),
          $createLinkNode("https://discord.com/invite/KmG4wQnnD9").append(
            $createTextNode("Discord Server")
          ),
          $createTextNode(` and chat with the team.`)
        )
      );
      root.append(list);
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
