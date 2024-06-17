import { createEditor, CreateEditorArgs, LexicalEditor } from "lexical";
import { createContext, PropsWithChildren, useContext, useRef } from "react";

const ComposerContext = createContext<LexicalEditor | null>(null);

interface ComposerProps extends PropsWithChildren {
  config: Readonly<CreateEditorArgs>;
}

export default function Composer(props: PropsWithChildren<ComposerProps>) {
  const { children, config } = props;

  const editorRef = useRef<LexicalEditor | null>(null);

  if (editorRef.current === null) {
    const editor = createEditor(config);
    editorRef.current = editor;
  }

  return (
    <ComposerContext.Provider value={editorRef.current}>
      {children}
    </ComposerContext.Provider>
  );
}

export function useComposer() {
  const editor = useContext(ComposerContext);
  if (editor === null) {
    throw new Error("useLexicalComposerContext: Cannot find Composer");
  }
  return editor;
}
