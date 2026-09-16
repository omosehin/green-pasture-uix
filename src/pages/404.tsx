import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Home, ShoppingBag, ArrowLeft, Leaf } from "lucide-react";

const Custom404: React.FC = () => {
	return (
		<div
			className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
			style={{ background: "var(--background)" }}
		>
			{/* Decorative background blobs */}
			<div
				className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[120px] opacity-20"
				style={{ background: "var(--color-primary)" }}
			/>
			<div
				className="absolute bottom-[-15%] left-[-10%] w-[400px] h-[400px] rounded-full blur-[100px] opacity-10"
				style={{ background: "var(--color-primary)" }}
			/>

			<div className="max-w-lg w-full text-center relative z-10 animate-page-enter">
				{/* Logo */}
				<Link
					href="/"
					className="inline-flex items-center gap-2 mb-12 hover:opacity-80 transition-opacity"
				>
					<div className="relative w-8 h-8">
						<Image
							src="/images/GP Organic Logo (Primary).png"
							alt="Green Pastures Logo"
							height={32}
							width={32}
							priority
							className="object-contain"
						/>
					</div>
					<span
						className="text-sm font-semibold"
						style={{ color: "var(--text-primary)" }}
					>
						Green Pastures
					</span>
				</Link>

				{/* Big 404 */}
				<div className="relative mb-6">
					<h1
						className="text-[8rem] md:text-[10rem] font-black leading-none tracking-tighter select-none"
						style={{ color: "var(--color-primary)", opacity: 0.1 }}
					>
						404
					</h1>
					<div className="absolute inset-0 flex items-center justify-center">
						<div
							className="w-20 h-20 rounded-full flex items-center justify-center animate-float"
							style={{ background: "rgba(22,163,74,0.1)" }}
						>
							<Leaf
								className="w-10 h-10"
								style={{ color: "var(--color-primary)" }}
							/>
						</div>
					</div>
				</div>

				{/* Message */}
				<h2
					className="text-2xl md:text-3xl font-bold mb-3"
					style={{ color: "var(--text-primary)" }}
				>
					Page not found
				</h2>
				<p
					className="text-sm md:text-base max-w-sm mx-auto mb-10 leading-relaxed"
					style={{ color: "var(--text-hint)" }}
				>
					The page you&apos;re looking for doesn&apos;t exist or has
					been moved. Let&apos;s get you back on track.
				</p>

				{/* Action Buttons */}
				<div className="flex flex-col sm:flex-row items-center justify-center gap-3">
					<Link
						href="/"
						className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 press-effect"
						style={{
							background: "var(--color-primary)",
							boxShadow: "var(--shadow-sm)",
						}}
					>
						<Home className="w-4 h-4" />
						Go Home
					</Link>
					<Link
						href="/products"
						className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all press-effect"
						style={{
							border: "1px solid var(--border-medium)",
							color: "var(--text-primary)",
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.background =
								"var(--surface-low)";
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.background = "transparent";
						}}
					>
						<ShoppingBag className="w-4 h-4" />
						Browse Products
					</Link>
					<button
						onClick={() => window.history.back()}
						className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer press-effect"
						style={{ color: "var(--text-secondary)" }}
						onMouseEnter={(e) => {
							e.currentTarget.style.background =
								"var(--surface-low)";
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.background = "transparent";
						}}
					>
						<ArrowLeft className="w-4 h-4" />
						Go Back
					</button>
				</div>

				{/* Footer hint */}
				<p
					className="mt-16 text-xs"
					style={{ color: "var(--text-disabled)" }}
				>
					If you think this is a mistake,{" "}
					<Link
						href="/contact"
						className="underline transition-colors"
						style={{ color: "var(--text-hint)" }}
						onMouseEnter={(e) => {
							e.currentTarget.style.color =
								"var(--color-primary)";
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.color = "var(--text-hint)";
						}}
					>
						contact support
					</Link>
				</p>
			</div>
		</div>
	);
};

export default Custom404;
