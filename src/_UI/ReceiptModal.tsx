"use client";

import React from "react";
import { X } from "lucide-react";
import { ReceiptPrinter, type ReceiptData } from "./ReceiptPrinter";
import Modal from "./Modal";

export interface ReceiptModalProps {
	isOpen: boolean;
	onClose: () => void;
	receipt?: ReceiptData;
	autoStart?: boolean;
}

export function ReceiptModal({
	isOpen,
	onClose,
	receipt,
	autoStart = true,
}: ReceiptModalProps) {
	if (!isOpen) return null;

	return (
		<Modal isOpen={isOpen} onClose={onClose} size="md">
			<ReceiptPrinter
				receipt={receipt}
				autoStart={autoStart}
				showActions={true}
			/>
		</Modal>
	);
}

export default ReceiptModal;
