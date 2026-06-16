import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, Heading1, Heading2, List, ListOrdered, Quote, Code } from 'lucide-react';

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

const TiptapEditor = ({ initialContent, onUpdate, editable = true }) => {
    // We use a local state to prevent sending updates on every keystroke
    const [saving, setSaving] = useState(false);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: 'Start writing your document...',
                emptyEditorClass: 'is-editor-empty',
            }),
        ],
        content: initialContent || '',
        editable: editable,
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            debouncedUpdate(html);
        },
        editorProps: {
            attributes: {
                class: 'prose prose-invert prose-blue max-w-none focus:outline-none min-h-[400px]',
            },
        },
    });

    // Only inject server content on the first render after data arrives!
    // We do NOT want to constantly overwrite the editor while the user is actively typing.
    const isFirstRender = useRef(true);
    useEffect(() => {
        if (editor && isFirstRender.current && initialContent !== undefined) {
            editor.commands.setContent(initialContent || '');
            isFirstRender.current = false;
        }
    }, [initialContent, editor]);

    // Simple debounce to save content 1.5s after user stops typing
    const debouncedUpdate = useCallback(
        (() => {
            let timeout;
            return (html) => {
                clearTimeout(timeout);
                setSaving(true);
                timeout = setTimeout(async () => {
                    await onUpdate(html);
                    setSaving(false);
                }, 1500);
            };
        })(),
        [onUpdate]
    );

    return (
        <div className="flex flex-col h-full bg-white/[0.02] border border-white/10 rounded-3xl p-8">
            <div className="flex justify-between items-center mb-2">
                <MenuBar editor={editor} />
                {saving && <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest animate-pulse">Saving...</span>}
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <EditorContent editor={editor} />
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

export default TiptapEditor;
