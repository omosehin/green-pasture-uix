import React, { useState } from "react";
import { Phone, Mail, MapPin, Send, Clock, PackageSearch, Sprout, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

import Layout from "@/_components/Layout";
import AnimatedSection from "@/_UI/AnimatedSection";
import SectionHeading from "@/_UI/SectionHeading";
import Input from "@/_UI/Input";
import Button from "@/_UI/Button";
import { appConstants } from "@/_redux/constants";
import toast from "react-hot-toast";
import axiosInstance from "@/_utils/axiosInstance";
import { extractErrorMessage } from "@/_utils/apiHelpers";

const contactInfo = [
	{ icon: Phone, title: "Phone", detail: appConstants.CONTACT.PHONE, subtitle: "Mon–Fri, 9am–5pm WAT", href: appConstants.CONTACT.PHONE_HREF },
	{ icon: MessageCircle, title: "WhatsApp", detail: "+234 701 884 5177", subtitle: "Chat with us instantly", href: appConstants.WHATSAPP_URL },
	{ icon: Mail, title: "Email", detail: appConstants.CONTACT.EMAIL, subtitle: "We reply within 24 hours", href: appConstants.CONTACT.EMAIL_HREF },
	{ icon: MapPin, title: "Office", detail: appConstants.CONTACT.ADDRESS, subtitle: "Visit by appointment" },
];

/** Answers the three questions support actually receives, before they're asked. */
const quickAnswers = [
	{
		icon: PackageSearch,
		q: "Where is my order?",
		a: "Track it from your account under My Orders — you'll also get an email the moment it's dispatched.",
	},
	{
		icon: Sprout,
		q: "Which product is right for me?",
		a: "Tell us your goal in the form and we'll point you to the right preparation and dosage. No upselling.",
	},
	{
		icon: Clock,
		q: "How fresh is it really?",
		a: "Every jar carries a harvest date and batch certificate. If yours doesn't, tell us and we'll replace it.",
	},
];

const Contact = () => {
	const EMPTY_FORM = { name: "", email: "", phone: "", subject: "", message: "" };
	const [formData, setFormData] = useState(EMPTY_FORM);
	const [sending, setSending] = useState(false);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (sending) return;

		setSending(true);
		try {
			// The backend caps this at 10 characters too -- checking here as well
			// turns a 400 into a straight answer next to the field.
			if (formData.message.trim().length < 10) {
				toast.error("Please tell us a little more — at least 10 characters.");
				return;
			}

			const res = await axiosInstance.post("store/contact", {
				...formData,
				phone: formData.phone.trim() || undefined,
			});
			toast.success(res.data?.message ?? "Message sent — we'll get back to you shortly.");
			setFormData(EMPTY_FORM);
		} catch (error: any) {
			toast.error(extractErrorMessage(error));
		} finally {
			setSending(false);
		}
	};

	return (
		<Layout pageTitle="Contact us">
			{/* ── Header ───────────────────────────────────────────── */}
			<section className="relative overflow-hidden" style={{ background: "var(--background)" }}>
				<div
					aria-hidden
					className="pointer-events-none absolute -left-40 -top-32 h-[32rem] w-[32rem] rounded-full opacity-70"
					style={{ background: "radial-gradient(circle,rgba(154,202,60,0.15),transparent 66%)" }}
				/>
				<div className="page-wrapper relative py-20 md:py-24">
					<motion.p
						initial={{ opacity: 0, y: 16 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6 }}
						className="mb-5 text-[0.68rem] font-semibold uppercase tracking-[0.22em]"
						style={{ color: "#7fac2d" }}
					>
						Get in touch
					</motion.p>
					<motion.h1
						initial={{ opacity: 0, y: 24 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.75, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
						className="max-w-3xl font-display text-4xl leading-[1.05] tracking-[-0.02em] sm:text-5xl lg:text-[3.4rem]"
						style={{ color: "var(--text-primary)", fontWeight: 300 }}
					>
						A real person reads every message —{" "}
						<span className="italic" style={{ color: "var(--color-primary)", fontWeight: 500 }}>
							usually the same day.
						</span>
					</motion.h1>
					<motion.p
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.7, delay: 0.2 }}
						className="mt-7 max-w-xl text-base leading-relaxed sm:text-lg"
						style={{ color: "var(--text-secondary)" }}
					>
						Questions about a product, a dosage, or an order in transit — ask directly.
						We would rather talk you out of the wrong product than sell you it.
					</motion.p>
				</div>
			</section>

			{/* ── Form + details ───────────────────────────────────── */}
			<section className="pb-20 md:pb-28" style={{ background: "var(--background)" }}>
				<div className="page-wrapper">
					<div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.6fr_1fr]">
						{/* Form */}
						<AnimatedSection delay={0.1}>
							<div
								className="rounded-3xl p-7 md:p-10"
								style={{ background: "var(--surface-paper)", border: "1px solid var(--border-light)", boxShadow: "var(--shadow-lg)" }}
							>
								<h2 className="font-display text-2xl" style={{ color: "var(--text-primary)", fontWeight: 500 }}>
									Send us a message
								</h2>
								<p className="mt-2 text-sm" style={{ color: "var(--text-hint)" }}>
									The more detail you give, the more useful our reply.
								</p>

								<form onSubmit={handleSubmit} className="mt-8 space-y-5">
									<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
										<Input
											label="Full Name"
											name="name"
											placeholder="Type your full name"
											value={formData.name}
											onChange={handleChange}
											required
										/>
										<Input
											label="Email Address"
											name="email"
											type="email"
											placeholder="your@email.com"
											leftIcon={Mail}
											value={formData.email}
											onChange={handleChange}
											required
										/>
									</div>
									<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
										<Input
											label="Phone Number"
											name="phone"
											type="tel"
											placeholder="+234 800 000 0000"
											leftIcon={Phone}
											value={formData.phone}
											onChange={handleChange}
										/>
										<Input
											label="Subject"
											name="subject"
											placeholder="What is this about?"
											value={formData.subject}
											onChange={handleChange}
											required
										/>
									</div>
									<div>
										<label
											className="mb-1.5 block text-xs font-semibold md:text-sm"
											style={{ color: "var(--text-secondary)" }}
										>
											Message
										</label>
										<textarea
											name="message"
											rows={6}
											placeholder="Tell us more…"
											value={formData.message}
											onChange={handleChange}
											required
											className="w-full resize-none rounded-xl px-3.5 py-3 text-sm outline-none transition-colors focus:ring-2 focus:ring-lime-400/40"
											style={{
												background: "var(--surface-low)",
												border: "1px solid var(--border-light)",
												color: "var(--text-primary)",
											}}
										/>
									</div>
									<Button type="submit" variant="filled" size="lg" rightIcon={Send} fullWidth loading={sending}>
										{sending ? "Sending…" : "Send Message"}
									</Button>
								</form>
							</div>
						</AnimatedSection>

						{/* Details */}
						<AnimatedSection delay={0.22}>
							<div className="space-y-4">
								{contactInfo.map((info, index) => {
									const Icon = info.icon;
									const CardContent = (
										<>
											<span
												className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105"
												style={{ background: "rgba(154,202,60,0.12)" }}
											>
												<Icon className="h-5 w-5" style={{ color: "var(--color-primary)" }} strokeWidth={1.6} />
											</span>
											<div className="min-w-0 flex-1">
												<p className="text-[0.68rem] uppercase tracking-[0.16em]" style={{ color: "var(--text-hint)" }}>
													{info.title}
												</p>
												<p className="mt-1 break-words font-medium" style={{ color: "var(--text-primary)" }}>
													{info.detail}
												</p>
												<p className="mt-1 text-xs" style={{ color: "var(--text-hint)" }}>
													{info.subtitle}
												</p>
											</div>
										</>
									);

									return info.href ? (
										<motion.a
											key={info.title}
											href={info.href}
											target={info.href.startsWith("http") ? "_blank" : undefined}
											rel={info.href.startsWith("http") ? "noopener noreferrer" : undefined}
											initial={{ opacity: 0, x: 20 }}
											whileInView={{ opacity: 1, x: 0 }}
											viewport={{ once: true }}
											transition={{ duration: 0.55, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
											className="group flex items-start gap-4 rounded-2xl p-6 transition-all duration-300 hover:scale-[1.01] hover:shadow-md cursor-pointer block"
											style={{ background: "var(--surface-paper)", border: "1px solid var(--border-light)" }}
										>
											{CardContent}
										</motion.a>
									) : (
										<motion.div
											key={info.title}
											initial={{ opacity: 0, x: 20 }}
											whileInView={{ opacity: 1, x: 0 }}
											viewport={{ once: true }}
											transition={{ duration: 0.55, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
											className="group flex items-start gap-4 rounded-2xl p-6 transition-colors duration-300"
											style={{ background: "var(--surface-paper)", border: "1px solid var(--border-light)" }}
										>
											{CardContent}
										</motion.div>
									);
								})}

								{/* Response promise */}
								<div
									className="rounded-2xl p-6"
									style={{ background: "linear-gradient(150deg,#0c2b25,#1f6554)" }}
								>
									<p className="font-display text-lg text-[#f4f8e8]" style={{ fontWeight: 500 }}>
										Under 24 hours
									</p>
									<p className="mt-1.5 text-sm leading-relaxed" style={{ color: "rgba(226,238,206,0.72)" }}>
										That's our reply window on weekdays — and we hold ourselves to it.
									</p>
								</div>
							</div>
						</AnimatedSection>
					</div>
				</div>
			</section>

			{/* ── Quick answers ────────────────────────────────────── */}
			<section className="py-20 md:py-24" style={{ background: "var(--surface-low)" }}>
				<div className="page-wrapper">
					<AnimatedSection>
						<SectionHeading eyebrow="Before you write" title="Three things people" accent="usually ask." centered />
					</AnimatedSection>
					<div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
						{quickAnswers.map((item, index) => {
							const Icon = item.icon;
							return (
								<motion.div
									key={item.q}
									initial={{ opacity: 0, y: 24 }}
									whileInView={{ opacity: 1, y: 0 }}
									viewport={{ once: true, margin: "-60px" }}
									transition={{ duration: 0.6, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
									className="rounded-2xl p-7"
									style={{ background: "var(--surface-paper)", border: "1px solid var(--border-light)" }}
								>
									<Icon className="h-5 w-5" style={{ color: "var(--color-primary)" }} strokeWidth={1.6} />
									<h3 className="mt-5 font-display text-lg" style={{ color: "var(--text-primary)", fontWeight: 500 }}>
										{item.q}
									</h3>
									<p className="mt-2.5 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
										{item.a}
									</p>
								</motion.div>
							);
						})}
					</div>
				</div>
			</section>
		</Layout>
	);
};

export default Contact;
