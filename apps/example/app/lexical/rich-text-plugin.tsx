import { registerDragonSupport } from "@lexical/dragon";
import { registerRichText } from "@lexical/rich-text";
import { useEffect } from "react";
import { useComposer } from "./composer";

export default function RichTextPlugin() {
  const editor = useComposer();

  useEffect(() => {
    return registerRichText(editor);
  }, [editor]);

  useEffect(() => {
    return registerDragonSupport(editor);
  }, [editor]);

  return null;
}
