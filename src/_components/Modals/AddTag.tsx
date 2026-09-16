import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";

import { useAppDispatch } from "@/_redux/store";
import { tagAction } from "@/_redux/actions/tag.action";
import Modal from "@/_UI/Modal";
import { FormInput, FormActions } from "@/_UI/FormField";
import RichTextEditor from "@/_UI/RichTextEditor";
import type { Tag } from "@/types";

const schema = z.object({
	name: z.string().min(1, "Name is required").max(60, "Keep it under 60 characters"),
	description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface AddTagProps {
	tag?: Tag | null;
	children?: React.ReactNode;
	className?: string;
	title?: string;
	/** Opens on mount — used when the table drives an edit. */
	openInitially?: boolean;
	onClose?: () => void;
	onSaved?: () => void;
}

/**
 * Description uses the same rich-text editor as products and categories, so
 * it is stored as HTML and rendered through SanitizedHtml wherever it shows.
 * Places that only have room for a line — the table, the assign chips' tooltip
 * — flatten it with htmlToText instead.
 */
const AddTag: React.FC<AddTagProps> = ({ tag, children, className, title = "add tag", openInitially, onClose, onSaved }) => {
	const dispatch = useAppDispatch();
	const [isOpen, setIsOpen] = useState(!!openInitially);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const {
		register,
		handleSubmit,
		reset,
		control,
		formState: { errors },
	} = useForm<FormData>({
		resolver: zodResolver(schema),
		defaultValues: { name: tag?.name ?? "", description: tag?.description ?? "" },
	});

	useEffect(() => {
		reset({ name: tag?.name ?? "", description: tag?.description ?? "" });
	}, [tag, reset]);

	const handleClose = () => {
		setIsOpen(false);
		reset({ name: tag?.name ?? "", description: tag?.description ?? "" });
		onClose?.();
	};

	const onSubmit = async (data: FormData) => {
		setIsSubmitting(true);
		try {
			if (tag) {
				await dispatch(tagAction.updateTag({ id: tag.id, name: data.name, description: data.description || "" })).unwrap();
				toast.success("Tag updated");
			} else {
				await dispatch(tagAction.createTag({ name: data.name, description: data.description || "" })).unwrap();
				toast.success("Tag created");
			}
			// Refresh the assign control's list too, not just the table.
			dispatch(tagAction.fetchTags());
			onSaved?.();
			handleClose();
		} catch (error: any) {
			toast.error(error || "Something went wrong");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<>
			{!openInitially && (
				<button title={title} onClick={() => setIsOpen(true)} className={className} type="button">
					{children}
				</button>
			)}

			<Modal
				isOpen={isOpen}
				onClose={handleClose}
				title={tag ? "Edit Tag" : "Add New Tag"}
				subtitle={tag ? "Update the tag details" : "Tags describe who a product is for"}
			>
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					<FormInput
						label="Tag Name"
						placeholder="e.g. Children"
						required
						{...register("name")}
						error={errors.name?.message}
					/>

					<div>
						<label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--text-primary)" }}>
							Description
						</label>
						<Controller
							name="description"
							control={control}
							render={({ field }) => (
								<RichTextEditor
									value={field.value ?? ""}
									onChange={field.onChange}
									placeholder="What this tag means, e.g. Safe for children"
									error={errors.description?.message}
									minHeight={140}
								/>
							)}
						/>
					</div>

					<FormActions
						onCancel={handleClose}
						submitLabel={tag ? "Update Tag" : "Create Tag"}
						isSubmitting={isSubmitting}
					/>
				</form>
			</Modal>
		</>
	);
};

export default AddTag;
