export interface Store<T> {
  get: () => T | undefined;
  set: (state: T) => void;
  subscribe: (callback: () => void) => () => void;
}

export default function createStore<T>(initialState?: T): Store<T> {
  let state = initialState;
  const subscribers = new Set<() => void>();

  /**
   * Return the current state.
   */
  function get() {
    return state;
  }

  /**
   * Update the current state and notify all the subscribers of the update.
   */
  function set(newState: T) {
    if (state === newState) return;

    state = newState;
    for (const subscriber of subscribers) {
      subscriber();
    }
  }

  /**
   * Subscribe to any store updates.
   *
   * @returns A function to unsubscribe
   */
  function subscribe(callback: () => void): () => void {
    subscribers.add(callback);

    callback();

    return () => {
      subscribers.delete(callback);
    };
  }

  return {
    get,
    set,
    subscribe,
  };
}
