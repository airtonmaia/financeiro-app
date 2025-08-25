'use client';

import * as React from 'react';
import { type Editor as TipTapEditor, EditorContent, useEditor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Heading2,
} from 'lucide-react';

function Toolbar({ editor }: { editor: TipTapEditor | null }) {
  if (!editor) return null;

  return (
    <div className="rounded-md border border-input bg-transparent">
      <div className="flex flex-wrap gap-2 p-1">
        <Button
          variant="ghost"
          size="sm"
          className={cn(editor.isActive('heading') && 'bg-muted')}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn(editor.isActive('bold') && 'bg-muted')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn(editor.isActive('italic') && 'bg-muted')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn(editor.isActive('strike') && 'bg-muted')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn(editor.isActive('bulletList') && 'bg-muted')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn(editor.isActive('orderedList') && 'bg-muted')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

const ClientSideEditor = React.memo(({ value, onChange, placeholder = 'Write something...' }: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    immediatelyRender: false, // Importante para evitar problemas de hidratação
    editorProps: {
      attributes: {
        class: 'min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  return (
    <div className="space-y-2">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
});

ClientSideEditor.displayName = 'ClientSideEditor';

export function Editor(props: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="min-h-[150px] w-full rounded-md border border-input bg-background animate-pulse" />
    );
  }

  return <ClientSideEditor {...props} />;
}