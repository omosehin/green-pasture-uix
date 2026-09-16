"use client";

import React from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import {
	AlignCenter,
	AlignJustify,
	AlignLeft,
	AlignRight,
	Bold,
	Code,
	Italic,
	Link2,
	List,
	ListOrdered,
	Pilcrow,
	Quote,
	Redo2,
	Strikethrough,
	Underline as UnderlineIcon,
	Undo2,
} from "lucide-react";

interface RichTextEditorProps {
	value: string;
	onChange: (html: string) => void;
	placeholder?: string;
	/** Rendered under the toolbar when the field is in an error state. */
	error?: string;
	minHeight?: number;
}

/**
 * Product and category descriptions are long-form and want structure —
 * paragraphs, headings, emphasis, lists. They are stored as HTML so the
 * styling survives the round trip, which is why the storefront renders them
 * through `SanitizedHtml` rather than as text.
 */
const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder, error, minHeight = 220 }) => {
	const editor = useEditor({
		extensions: [
			StarterKit,
			Underline,
			TextAlign.configure({ types: ["heading", "paragraph"] }),
			Link.configure({ openOnClick: false, autolink: true }),
		],
		content: value || "",
		// Next.js renders this page on the server during `next build`; letting
		// TipTap render immediately there triggers a hydration mismatch.
		immediatelyRender: false,
		onUpdate: ({ editor }) => {
			const html = editor.getHTML();
			// TipTap reports an empty doc as "<p></p>"; hand back "" so required
			// checks and "is this dirty?" comparisons behave.
			onChange(html === "<p></p>" ? "" : html);
		},
		editorProps: {
			attributes: {
				class: "rte-content focus:outline-none px-4 py-3",
				style: `min-height:${minHeight}px`,
			},
		},
	});

	// The form may load its values after mount (edit pages fetch first). Only
	// push external changes in when they genuinely differ, or every keystroke
	// would reset the cursor to the start of the document.
	React.useEffect(() => {
		if (!editor) return;
		const incoming = value || "";
		if (incoming !== editor.getHTML() && incoming !== "") {
			editor.commands.setContent(incoming, { emitUpdate: false });
		}
	}, [value, editor]);

	if (!editor) {
		return (
			<div
				className="rounded-xl animate-pulse"
				style={{ minHeight: minHeight + 48, background: "var(--surface-medium)", border: "1px solid var(--border-light)" }}
			/>
		);
	}

	const Btn: React.FC<{
		onClick: () => void;
		active?: boolean;
		label: string;
		children: React.ReactNode;
		disabled?: boolean;
	}> = ({ onClick, active, label, children, disabled }) => (
		<button
			type="button"
			onMouseDown={(e) => e.preventDefault()} // keep the selection while clicking
			onClick={onClick}
			disabled={disabled}
			aria-label={label}
			aria-pressed={!!active}
			title={label}
			className="flex h-8 w-8 items-center justify-center rounded-md transition-colors disabled:opacity-30"
			style={{
				background: active ? "rgba(154,202,60,0.18)" : "transparent",
				color: active ? "var(--color-primary)" : "var(--text-secondary)",
			}}
		>
			{children}
		</button>
	);

	const Divider = () => <span className="mx-1 h-5 w-px shrink-0" style={{ background: "var(--border-light)" }} />;

	return (
		<div>
			<div
				className="overflow-hidden rounded-xl"
				style={{ border: `1px solid ${error ? "#ef4444" : "var(--border-light)"}`, background: "var(--surface-paper)" }}
			>
				<div
					className="flex flex-wrap items-center gap-0.5 px-2 py-1.5"
					style={{ borderBottom: "1px solid var(--border-light)", background: "var(--surface-low)" }}
				>
					<Btn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} label="Undo">
						<Undo2 className="h-4 w-4" />
					</Btn>
					<Btn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} label="Redo">
						<Redo2 className="h-4 w-4" />
					</Btn>
					<Divider />

					{([1, 2, 3] as const).map((level) => (
						<Btn
							key={level}
							onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
							active={editor.isActive("heading", { level })}
							label={`Heading ${level}`}
						>
							<span className="text-xs font-bold">H{level}</span>
						</Btn>
					))}
					<Btn onClick={() => editor.chain().focus().setParagraph().run()} active={editor.isActive("paragraph")} label="Paragraph">
						<Pilcrow className="h-4 w-4" />
					</Btn>
					<Divider />

					<Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} label="Bold">
						<Bold className="h-4 w-4" />
					</Btn>
					<Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} label="Italic">
						<Italic className="h-4 w-4" />
					</Btn>
					<Btn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} label="Underline">
						<UnderlineIcon className="h-4 w-4" />
					</Btn>
					<Btn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} label="Strikethrough">
						<Strikethrough className="h-4 w-4" />
					</Btn>
					<Divider />

					{(
						[
							["left", AlignLeft],
							["center", AlignCenter],
							["right", AlignRight],
							["justify", AlignJustify],
						] as const
					).map(([align, Icon]) => (
						<Btn
							key={align}
							onClick={() => editor.chain().focus().setTextAlign(align).run()}
							active={editor.isActive({ textAlign: align })}
							label={`Align ${align}`}
						>
							<Icon className="h-4 w-4" />
						</Btn>
					))}
					<Divider />

					<Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} label="Bullet list">
						<List className="h-4 w-4" />
					</Btn>
					<Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} label="Numbered list">
						<ListOrdered className="h-4 w-4" />
					</Btn>
					<Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} label="Quote">
						<Quote className="h-4 w-4" />
					</Btn>
					<Btn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} label="Code block">
						<Code className="h-4 w-4" />
					</Btn>
					<Btn
						onClick={() => {
							if (editor.isActive("link")) {
								editor.chain().focus().unsetLink().run();
								return;
							}
							const url = window.prompt("Link URL");
							if (!url) return;
							editor.chain().focus().setLink({ href: url }).run();
						}}
						active={editor.isActive("link")}
						label="Link"
					>
						<Link2 className="h-4 w-4" />
					</Btn>
				</div>

				{editor.isEmpty && placeholder && (
					<p className="pointer-events-none absolute px-4 py-3 text-sm" style={{ color: "var(--text-disabled)" }}>
						{placeholder}
					</p>
				)}
				<EditorContent editor={editor} />
			</div>
			{error && (
				<p className="mt-1.5 text-xs" style={{ color: "#ef4444" }}>
					{error}
				</p>
			)}
		</div>
	);
};

export default RichTextEditor;
