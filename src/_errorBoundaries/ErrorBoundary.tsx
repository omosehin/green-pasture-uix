import { AlertTriangle, RefreshCw } from "lucide-react";
import React from "react";

interface Props {
	children: React.ReactNode;
	fallback?: React.ReactNode | null;
}

interface State {
	hasError: boolean;
	error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error("Error caught by boundary:", error, errorInfo);
	}

	render() {
		if (this.state.hasError) {
			return (
				this.props.fallback || (
					<div className="container mx-auto px-4 py-16 text-center">
						<AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
						<h2 className="text-xl font-bold text-gray-800 dark:text-white/90 mb-2">
							Something went wrong
						</h2>
						<p className="text-gray-600 mb-4">
							{this.state.error?.message ||
								`An unexpected error occurred`}
						</p>
						<button
							onClick={() => window.location.reload()}
							className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors"
						>
							<RefreshCw className="h-4 w-4 inline mr-2" />
							Reload Application
						</button>
					</div>
				)
			);
		}

		return this.props.children;
	}
}
