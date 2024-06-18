import { SerializedEditorState } from "@lexical-devtools/utils";
import {
  createContext,
  ReactNode,
  use,
  useCallback,
  useRef,
  useSyncExternalStore,
} from "react";
import createStore, { type Store } from "./create-store";
import getLexicalEditorStates from "./get-lexical-editor-states";

export type EditorStateLoading = {
  isLoading: true;
  isRevalidating: true;
  editors?: never;
  error?: never;
};

export type EditorStateResolved = {
  isLoading: false;
  isRevalidating: boolean;
  editors: Map<string, SerializedEditorState>;
  error?: Error;
};

export type EditorState = EditorStateLoading | EditorStateResolved;

export type RootStore = Store<EditorState>;

const RootStoreContext = createContext<RootStore | null>(null);
export function RootStoreProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<RootStore | null>(null);

  if (storeRef.current === null) {
    storeRef.current = createStore();
  }

  return (
    <RootStoreContext.Provider value={storeRef.current}>
      {children}
    </RootStoreContext.Provider>
  );
}

export function useRootStore(): RootStore {
  const store = use(RootStoreContext);
  if (store === null) {
    throw new Error("useRootStore must be used inside RootStoreProvider");
  }

  return store;
}

export function useEditors(): EditorState | undefined {
  const store = use(RootStoreContext);
  if (store === null) {
    throw new Error("useEditorStore must be used inside RootStoreProvider");
  }

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      return store.subscribe(onStoreChange);
    },
    [store]
  );

  const getSnapShot = useCallback(() => {
    return store.get();
  }, [store]);

  return useSyncExternalStore(subscribe, getSnapShot, getSnapShot);
}

let getLexicalEditorStatesPromise: Promise<SerializedEditorState[]> | undefined;

export function useRevalidateEditors() {
  const store = use(RootStoreContext);
  if (store === null) {
    throw new Error(
      "useRevalidateEditors must be used inside RootStoreProvider"
    );
  }

  /**
   * Revalidates the editor states. If there was an existing request in progress, the request is overwritten by the new request.
   */
  const revalidate = useCallback(async () => {
    try {
      const _getLexicalEditorStatesPromise = getLexicalEditorStates();

      const state = store.get();
      if (state === undefined) {
        store.set({
          isLoading: true,
          isRevalidating: true,
        });
      } else {
        store.set({
          ...state,
          isRevalidating: true,
        });
      }

      getLexicalEditorStatesPromise = _getLexicalEditorStatesPromise;
      const data = await getLexicalEditorStatesPromise;

      // If the promise has changed since the request was made (i.e., a new request was made while the previous request was still in progress), we do not update the store as the data may be stale
      if (getLexicalEditorStatesPromise !== _getLexicalEditorStatesPromise) {
        return;
      }

      store.set({
        isLoading: false,
        isRevalidating: false,
        editors: new Map(data.map((editor) => [editor.id, editor])),
      });
    } catch (err) {
      console.error(err);

      if (!(err instanceof Error)) return;

      const state = store.get();
      if (state === undefined) return;

      store.set({
        isLoading: false,
        isRevalidating: false,
        editors: state.editors ?? new Map(),
        error: err,
      });
    }
  }, [store]);

  return revalidate;
}
