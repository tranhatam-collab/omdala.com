import React, { useEffect, useRef } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { basicSetup } from "codemirror";
import { javascript } from "@codemirror/lang-javascript";
export function Editor({ content, onChange, label, dark }) {
  const container = useRef(null);
  const editor = useRef(null);
  const callback = useRef(onChange);
  callback.current = onChange;
  useEffect(() => {
    editor.current = new EditorView({
      parent: container.current,
      state: EditorState.create({
        doc: content,
        extensions: [
          basicSetup,
          javascript({ jsx: true, typescript: true }),
          EditorView.lineWrapping,
          EditorView.contentAttributes.of({
            "aria-label": label,
            spellcheck: "false",
          }),
          EditorView.theme(
            {
              "&": {
                height: "100%",
                backgroundColor: "var(--canvas)",
                color: "var(--text)",
              },
              ".cm-scroller": {
                overflow: "auto",
                fontFamily: "SFMono-Regular, Menlo, monospace",
                fontSize: "13px",
                lineHeight: "1.75",
              },
              ".cm-content": { padding: "18px 0" },
              ".cm-gutters": {
                backgroundColor: "var(--canvas)",
                color: "#88929c",
                border: "none",
                paddingRight: "12px",
              },
              ".cm-activeLine, .cm-activeLineGutter": {
                backgroundColor: "var(--hover)",
              },
              ".cm-cursor": { borderLeftColor: "var(--text)" },
              "&.cm-focused": { outline: "none" },
            },
            { dark },
          ),
          EditorView.updateListener.of((update) => {
            if (update.docChanged)
              callback.current(update.state.doc.toString());
          }),
        ],
      }),
    });
    return () => editor.current?.destroy();
  }, [label, dark]);
  useEffect(() => {
    const view = editor.current;
    if (view && view.state.doc.toString() !== content)
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: content },
      });
  }, [content]);
  return <div className="code-editor" ref={container} />;
}
