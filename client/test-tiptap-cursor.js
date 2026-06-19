import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import * as Y from 'yjs';

try {
    const ydoc = new Y.Doc();
    
    // Fake provider
    const provider = {
        awareness: {},
        on: () => {},
        off: () => {}
    };

    const editor = new Editor({
        extensions: [
            StarterKit,
            Collaboration.configure({
                document: ydoc,
            }),
            CollaborationCursor.configure({
                provider: provider,
                user: { name: 'Test', color: '#ff0000' }
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
