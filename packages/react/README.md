# `@lexical-devtools/react`

A React plugin designed to use with [Lexical DevTools Extension](https://chromewebstore.google.com/detail/lexical-devtools/dmbopeepjkdlplkjcjbnfiikajiddhnd) to inspect Lexical.js editor state within React applications.

> **Note** This plugin is intended to be used with the Lexical DevTools Extension, available on the Chrome Web Store. You can download it [here](https://chromewebstore.google.com/detail/lexical-devtools/dmbopeepjkdlplkjcjbnfiikajiddhnd).

## Usage

### Installation

```bash
npm i @lexical-devtools/react
```

### Import `DevToolsPlugin` inside your `LexicalComposer` component

```tsx
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import DevToolsPlugin from "@lexical-devtools/react";

export default function Page() {
  const config = {
    // ...
  };

  return (
    <LexicalComposer initialConfig={config}>
      // ...
      <DevToolsPlugin />
    </LexicalComposer>
  );
}
```
