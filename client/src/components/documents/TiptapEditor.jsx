import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, Heading1, Heading2, List, ListOrdered, Quote, Code } from 'lucide-react';


import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import useAuthStore from '../../store/authStore';

const MenuBar = ({ editor }) => {
    if (!editor) return null;

    return (
        <div className="flex items-center space-x-1 border-b border-white/5 pb-4 mb-4">
            <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                disabled={!editor.can().chain().focus().toggleBold().run()}
                className={`p-2 rounded-lg transition-colors ${editor.isActive('bold') ? 'bg-[#3b82f6]/20 text-[#3b82f6]' : 'text-neutral-400 hover:bg-white/5 hover:text-white'}`}
                title="Bold"
            >
                <Bold size={16} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                disabled={!editor.can().chain().focus().toggleItalic().run()}
                className={`p-2 rounded-lg transition-colors ${editor.isActive('italic') ? 'bg-[#3b82f6]/20 text-[#3b82f6]' : 'text-neutral-400 hover:bg-white/5 hover:text-white'}`}
                title="Italic"
            >
                <Italic size={16} />
            </button>
            <div className="w-px h-6 bg-white/10 mx-2" />
            <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={`p-2 rounded-lg transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-[#3b82f6]/20 text-[#3b82f6]' : 'text-neutral-400 hover:bg-white/5 hover:text-white'}`}
                title="Heading 1"
            >
                <Heading1 size={16} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={`p-2 rounded-lg transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-[#3b82f6]/20 text-[#3b82f6]' : 'text-neutral-400 hover:bg-white/5 hover:text-white'}`}
                title="Heading 2"
            >
                <Heading2 size={16} />
            </button>
            <div className="w-px h-6 bg-white/10 mx-2" />
            <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`p-2 rounded-lg transition-colors ${editor.isActive('bulletList') ? 'bg-[#3b82f6]/20 text-[#3b82f6]' : 'text-neutral-400 hover:bg-white/5 hover:text-white'}`}
                title="Bullet List"
            >
                <List size={16} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`p-2 rounded-lg transition-colors ${editor.isActive('orderedList') ? 'bg-[#3b82f6]/20 text-[#3b82f6]' : 'text-neutral-400 hover:bg-white/5 hover:text-white'}`}
                title="Ordered List"
            >
                <ListOrdered size={16} />
            </button>
            <div className="w-px h-6 bg-white/10 mx-2" />
            <button
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={`p-2 rounded-lg transition-colors ${editor.isActive('blockquote') ? 'bg-[#3b82f6]/20 text-[#3b82f6]' : 'text-neutral-400 hover:bg-white/5 hover:text-white'}`}
                title="Quote"
            >
                <Quote size={16} />
            </button>
            <button
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                className={`p-2 rounded-lg transition-colors ${editor.isActive('codeBlock') ? 'bg-[#3b82f6]/20 text-[#3b82f6]' : 'text-neutral-400 hover:bg-white/5 hover:text-white'}`}
                title="Code Block"
            >
                <Code size={16} />
            </button>
        </div>
    );
};

// The actual Editor that runs ONLY when provider is ready
const Editor = ({ ydoc, provider, initialContent, onUpdate, editable }) => {
    const { user } = useAuthStore();

    const editor = useEditor({
        editable,
        extensions: [
            StarterKit.configure({
                history: false, // CRITICAL: Y.js handles history itself!
            }),
            Placeholder.configure({
                placeholder: 'Start writing your brilliant documentation...',
            }),
            Collaboration.configure({
                document: ydoc,
            }),
            CollaborationCursor.configure({
                provider: provider,
                user: {
                    name: user?.fullName || 'Anonymous',
                    color: '#' + Math.floor(Math.random()*16777215).toString(16)
                },
            }),
        ],
        onUpdate: ({ editor }) => {
            // Keep the debounced saving logic so it persists to MongoDB!
            if (onUpdate) {
                onUpdate(editor.getHTML());
            }
        }
    }, [provider, editable]); 

    // We only inject initialContent once, and only if Y.js hasn't synced anything yet
    const isFirstRender = useRef(true);
    useEffect(() => {
        if (editor && isFirstRender.current && initialContent !== undefined) {
            // Wait a split second to see if Y.js syncs data from other users first
            setTimeout(() => {
                if (editor.getText().trim() === '') {
                    editor.commands.setContent(initialContent || '');
                }
            }, 100);
            isFirstRender.current = false;
        }
    }, [initialContent, editor]);

    if (!editor) {
        return <div className="p-8 text-neutral-500 font-mono text-sm animate-pulse">Initializing editor...</div>;
    }

    return (
        <div className="w-full max-w-4xl mx-auto h-full flex flex-col pt-8 px-4">
            {editable && <MenuBar editor={editor} />}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <EditorContent editor={editor} className="min-h-full pb-32" />
            </div>
            
            {/* Some CSS specifically for Tiptap's output so it matches the theme */}
            <style jsx global>{`
                .ProseMirror p { margin-bottom: 1em; line-height: 1.7; color: #d4d4d8; }
                .ProseMirror h1 { font-size: 2em; font-weight: bold; margin-bottom: 0.5em; color: white; font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif; }
                .ProseMirror h2 { font-size: 1.5em; font-weight: bold; margin-top: 1.5em; margin-bottom: 0.5em; color: white; font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif; }
                .ProseMirror ul { list-style-type: disc; padding-left: 1.5em; margin-bottom: 1em; color: #d4d4d8; }
                .ProseMirror ol { list-style-type: decimal; padding-left: 1.5em; margin-bottom: 1em; color: #d4d4d8; }
                .ProseMirror blockquote { border-left: 3px solid #3b82f6; padding-left: 1em; color: #a1a1aa; font-style: italic; }
                .ProseMirror pre { background-color: #0a0a0a; padding: 1em; border-radius: 0.5em; font-family: monospace; border: 1px solid rgba(255,255,255,0.1); overflow-x: auto; }
                .ProseMirror code { font-family: monospace; background-color: rgba(255,255,255,0.1); padding: 0.2em 0.4em; border-radius: 0.3em; font-size: 0.9em; }
                .ProseMirror p.is-editor-empty:first-child::before { content: attr(data-placeholder); float: left; color: #52525b; pointer-events: none; height: 0; }
            `}</style>
        </div>
    );
};

// The wrapper that handles the Y.js connection
//Part A: The Connection Wrapper (TiptapEditor)
const TiptapEditor = ({ documentId, initialContent, onUpdate, editable = true }) => {
    const [provider, setProvider] = useState(null);
    const [ydoc] = useState(() => new Y.Doc());

    useEffect(() => {
        if (!documentId) return;

        // Connect to the backend WebSocket
        const wsProvider = new WebsocketProvider(
            'ws://localhost:8000/yjs', // Our custom path
            documentId, // The room name
            ydoc
        );

        setProvider(wsProvider);

        return () => {
            wsProvider.destroy(); // Clean up when leaving
        };
    }, [documentId, ydoc]);

    if (!provider) {
        return <div className="p-8 text-neutral-500 font-mono text-sm animate-pulse">Connecting to collaborative session...</div>;
    }

    return (
        <Editor 
            ydoc={ydoc} 
            provider={provider} 
            initialContent={initialContent} 
            onUpdate={onUpdate} 
            editable={editable} 
        />
    );
};

export default TiptapEditor;
