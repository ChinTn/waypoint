import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import * as Y from 'yjs';

try {
    const ydoc = new Y.Doc();
    console.log("Y.Doc created successfully:", ydoc.constructor.name);

    const editor = new Editor({
        extensions: [
            StarterKit,
            Collaboration.configure({
                document: ydoc,
            })
        ],
    });
    console.log("Editor initialized successfully.");
    process.exit(0);
} catch (e) {
    console.error("Crash during Editor initialization!");
    console.error(e.stack);
    process.exit(1);
}
