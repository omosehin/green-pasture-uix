import { StatusModalProps } from "@/types";
import { useEffect } from "react";

export default function StatusModal({
	isOpen,
	onClose,
	type,
	title,
	message,
	autoClose = true,
	autoCloseDelay = 3000,
}: StatusModalProps) {
	// Auto-close functionality
	useEffect(() => {
		if (isOpen && autoClose) {
			const timer = setTimeout(() => {
				onClose();
			}, autoCloseDelay);

			return () => clearTimeout(timer);
		}
	}, [isOpen, autoClose, autoCloseDelay, onClose]);

	// Close on Escape key
	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};

		if (isOpen) {
			document.addEventListener("keydown", handleEscape);
		}

		return () => {
			document.removeEventListener("keydown", handleEscape);
		};
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	const config = {
		success: {
			bgColor: "bg-green-50",
			iconBg: "bg-green-100",
			iconColor: "text-green-600",
			titleColor: "text-green-800",
			messageColor: "text-green-700",
			buttonBg: "bg-green-600 hover:bg-green-700",
			icon: (
				<svg
					className="w-6 h-6"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M5 13l4 4L19 7"
					/>
				</svg>
			),
		},
		error: {
			bgColor: "bg-red-50",
			iconBg: "bg-red-100",
			iconColor: "text-red-600",
			titleColor: "text-red-800",
			messageColor: "text-red-700",
			buttonBg: "bg-red-600 hover:bg-red-700",
			icon: (
				<svg
					className="w-6 h-6"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			),
		},
	};

	const style = config[type];

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-40 animate-fade-in"
			onClick={onClose}
		>
			<div
				className="relative w-full max-w-md bg-white rounded-lg shadow-2xl transform transition-all animate-slide-up"
				onClick={(e) => e.stopPropagation()}
			>
				<div className={`p-6 rounded-t-lg ${style.bgColor}`}>
					<div className="flex items-start">
						<div
							className={`flex-shrink-0 ${style.iconBg} rounded-full p-2 ${style.iconColor}`}
						>
							{style.icon}
						</div>
						<div className="ml-4 flex-1">
							<h3
								className={`text-lg font-semibold ${style.titleColor}`}
							>
								{title}
							</h3>
							<p className={`mt-2 text-sm ${style.messageColor}`}>
								{message}
							</p>
						</div>
						<button
							onClick={onClose}
							className="flex-shrink-0 ml-4 text-gray-400 hover:text-gray-600 transition-colors"
							aria-label="Close"
						>
							<svg
								className="w-5 h-5"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
					</div>
				</div>

				<div className="px-6 py-4 bg-white rounded-b-lg">
					<button
						onClick={onClose}
						className={`w-full px-4 py-2 text-white rounded-lg transition-colors ${style.buttonBg}`}
					>
						Close
					</button>
				</div>
			</div>
		</div>
	);
}

// Example usage component with useState import
// import { useState } from "react";

// export function NotificationExample() {
// 	const [notification, setNotification] = useState<{
// 		isOpen: boolean;
// 		type: NotificationType;
// 		title: string;
// 		message: string;
// 	}>({
// 		isOpen: false,
// 		type: "success",
// 		title: "",
// 		message: "",
// 	});

// 	const showSuccess = () => {
// 		setNotification({
// 			isOpen: true,
// 			type: "success",
// 			title: "Success!",
// 			message: "Your changes have been saved successfully.",
// 		});
// 	};

// 	const showError = () => {
// 		setNotification({
// 			isOpen: true,
// 			type: "error",
// 			title: "Error!",
// 			message: "Something went wrong. Please try again later.",
// 		});
// 	};

// 	const closeNotification = () => {
// 		setNotification((prev) => ({ ...prev, isOpen: false }));
// 	};

// 	return (
// 		<div className="min-h-screen bg-gray-100 p-8">
// 			<div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
// 				<h2 className="text-2xl font-bold text-gray-800 mb-6">
// 					Notification Modal Demo
// 				</h2>

// 				<div className="space-y-4">
// 					<button
// 						onClick={showSuccess}
// 						className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
// 					>
// 						Show Success Message
// 					</button>

// 					<button
// 						onClick={showError}
// 						className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
// 					>
// 						Show Error Message
// 					</button>
// 				</div>

// 				<div className="mt-6 p-4 bg-gray-50 rounded-lg">
// 					<p className="text-sm text-gray-600">
// 						Click the buttons above to see success and error
// 						notifications. Modals auto-close after 3 seconds or can be
// 						manually closed.
// 					</p>
// 				</div>
// 			</div>

// 			<NotificationModal
// 				isOpen={notification.isOpen}
// 				onClose={closeNotification}
// 				type={notification.type}
// 				title={notification.title}
// 				message={notification.message}
// 				autoClose={true}
// 				autoCloseDelay={3000}
// 			/>
// 		</div>
// 	);
// }
