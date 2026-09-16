import React from "react";
import Layout from "@/_components/Layout";

const TermsOfService = () => {
	return (
		<Layout pageTitle="Terms of Service">
			<div className="bg-mint-50 dark:bg-[#0a0f1a] animate-page-enter">
				<div className="container page-wrapper mx-auto px-4 py-16 md:py-24">
					<div className="max-w-3xl mx-auto bg-white rounded-radius-lg border border-outline-variant shadow-elevation-1 p-8 md:p-12 dark:bg-transparent dark:border-transparent dark:shadow-none dark:p-0">
						<h1 className="text-3xl md:text-4xl font-bold text-on-surface dark:text-white mb-2">
							Terms of Service
						</h1>
						<p className="text-sm text-on-surface-variant dark:text-gray-400 mb-10">
							Last updated: March 24, 2026
						</p>

						{/* 1. Acceptance of Terms */}
						<section className="mb-10 pb-8 border-b border-outline-variant dark:border-gray-800">
							<h2 className="text-xl font-semibold text-on-surface dark:text-white mb-4">
								1. Acceptance of Terms
							</h2>
							<p className="text-on-surface/80 dark:text-gray-300 leading-relaxed">
								By accessing or using the Green Pasture Organics website and services, you agree to be
								bound by these Terms of Service. If you do not agree with any part of these terms, you
								must not use our platform. These terms apply to all visitors, users, and customers of
								our website.
							</p>
						</section>

						{/* 2. Account Registration */}
						<section className="mb-10 pb-8 border-b border-outline-variant dark:border-gray-800">
							<h2 className="text-xl font-semibold text-on-surface dark:text-white mb-4">
								2. Account Registration
							</h2>
							<p className="text-on-surface/80 dark:text-gray-300 leading-relaxed mb-3">
								To access certain features of our platform, you may be required to create an account.
								When registering, you agree to:
							</p>
							<ul className="list-disc pl-6 space-y-2 text-on-surface/80 dark:text-gray-300">
								<li>Provide accurate, current, and complete information during registration.</li>
								<li>Maintain the security of your password and account credentials.</li>
								<li>Accept responsibility for all activities that occur under your account.</li>
								<li>Notify us immediately of any unauthorized use of your account.</li>
							</ul>
						</section>

						{/* 3. Products & Pricing */}
						<section className="mb-10 pb-8 border-b border-outline-variant dark:border-gray-800">
							<h2 className="text-xl font-semibold text-on-surface dark:text-white mb-4">
								3. Products & Pricing
							</h2>
							<p className="text-on-surface/80 dark:text-gray-300 leading-relaxed mb-3">
								All product prices on our platform are listed in Nigerian Naira (NGN) and are subject
								to change without prior notice. While we make every effort to ensure accuracy in product
								descriptions and pricing, errors may occasionally occur.
							</p>
							<p className="text-on-surface/80 dark:text-gray-300 leading-relaxed">
								We reserve the right to correct any errors, inaccuracies, or omissions and to change or
								update information at any time without prior notice. This includes instances where an
								order has already been submitted or confirmed.
							</p>
						</section>

						{/* 4. Orders & Payment */}
						<section className="mb-10 pb-8 border-b border-outline-variant dark:border-gray-800">
							<h2 className="text-xl font-semibold text-on-surface dark:text-white mb-4">
								4. Orders & Payment
							</h2>
							<p className="text-on-surface/80 dark:text-gray-300 leading-relaxed mb-3">
								All payments are securely processed through Paystack. By placing an order, you warrant
								that you are authorized to use the selected payment method. An order confirmation does
								not constitute acceptance of your order.
							</p>
							<p className="text-on-surface/80 dark:text-gray-300 leading-relaxed">
								We reserve the right to refuse or cancel any order for any reason, including but not
								limited to product availability, pricing errors, or suspected fraudulent activity. In
								such cases, a full refund will be issued to your original payment method.
							</p>
						</section>

						{/* 5. Shipping & Delivery */}
						<section className="mb-10 pb-8 border-b border-outline-variant dark:border-gray-800">
							<h2 className="text-xl font-semibold text-on-surface dark:text-white mb-4">
								5. Shipping & Delivery
							</h2>
							<p className="text-on-surface/80 dark:text-gray-300 leading-relaxed mb-3">
								We offer multiple shipping methods across Nigeria. Estimated delivery times are provided
								at checkout and may vary depending on your location and the shipping method selected.
								Delivery times are estimates only and are not guaranteed.
							</p>
							<p className="text-on-surface/80 dark:text-gray-300 leading-relaxed">
								Risk of loss and title for items purchased pass to you upon delivery of the items to the
								carrier. We are not responsible for delays caused by shipping carriers, customs, or
								other factors beyond our control.
							</p>
						</section>

						{/* 6. Returns & Refunds */}
						<section className="mb-10 pb-8 border-b border-outline-variant dark:border-gray-800">
							<h2 className="text-xl font-semibold text-on-surface dark:text-white mb-4">
								6. Returns & Refunds
							</h2>
							<p className="text-on-surface/80 dark:text-gray-300 leading-relaxed">
								Our return and refund process is governed by our{" "}
								<a
									href="/refund-policy"
									className="text-primary-600 dark:text-primary-400 hover:underline"
								>
									Return & Refund Policy
								</a>
								. Please review it carefully before making a purchase. By completing a purchase, you
								acknowledge that you have read and agree to the terms of our refund policy.
							</p>
						</section>

						{/* 7. Intellectual Property */}
						<section className="mb-10 pb-8 border-b border-outline-variant dark:border-gray-800">
							<h2 className="text-xl font-semibold text-on-surface dark:text-white mb-4">
								7. Intellectual Property
							</h2>
							<p className="text-on-surface/80 dark:text-gray-300 leading-relaxed">
								All content on this website, including but not limited to text, graphics, logos, images,
								product descriptions, and software, is the property of Green Pasture Organics and is
								protected by Nigerian and international copyright and trademark laws. You may not
								reproduce, distribute, modify, or create derivative works from any content without our
								express written consent.
							</p>
						</section>

						{/* 8. User Conduct */}
						<section className="mb-10 pb-8 border-b border-outline-variant dark:border-gray-800">
							<h2 className="text-xl font-semibold text-on-surface dark:text-white mb-4">
								8. User Conduct
							</h2>
							<p className="text-on-surface/80 dark:text-gray-300 leading-relaxed mb-3">
								You agree not to use our platform for any unlawful purpose or in any way that could
								damage, disable, or impair the service. Prohibited activities include:
							</p>
							<ul className="list-disc pl-6 space-y-2 text-on-surface/80 dark:text-gray-300">
								<li>Attempting to gain unauthorized access to any part of the platform.</li>
								<li>Using automated tools to scrape or extract data from our website.</li>
								<li>Submitting false or misleading information.</li>
								<li>Interfering with or disrupting the integrity of the platform.</li>
								<li>Engaging in any activity that violates applicable laws or regulations.</li>
							</ul>
						</section>

						{/* 9. Limitation of Liability */}
						<section className="mb-10 pb-8 border-b border-outline-variant dark:border-gray-800">
							<h2 className="text-xl font-semibold text-on-surface dark:text-white mb-4">
								9. Limitation of Liability
							</h2>
							<p className="text-on-surface/80 dark:text-gray-300 leading-relaxed">
								To the fullest extent permitted by Nigerian law, Green Pasture Organics shall not be
								liable for any indirect, incidental, special, consequential, or punitive damages arising
								from your use of our platform or products. Our total liability shall not exceed the
								amount you paid for the specific product or service giving rise to the claim.
							</p>
						</section>

						{/* 10. Governing Law */}
						<section className="mb-10 pb-8 border-b border-outline-variant dark:border-gray-800">
							<h2 className="text-xl font-semibold text-on-surface dark:text-white mb-4">
								10. Governing Law
							</h2>
							<p className="text-on-surface/80 dark:text-gray-300 leading-relaxed">
								These Terms of Service shall be governed by and construed in accordance with the laws of
								the Federal Republic of Nigeria. Any disputes arising from these terms shall be subject
								to the exclusive jurisdiction of the courts of Nigeria.
							</p>
						</section>

						{/* 11. Contact Information */}
						<section className="mb-4">
							<h2 className="text-xl font-semibold text-on-surface dark:text-white mb-4">
								11. Contact Information
							</h2>
							<p className="text-on-surface/80 dark:text-gray-300 leading-relaxed mb-3">
								If you have any questions about these Terms of Service, please contact us:
							</p>
							<ul className="space-y-2 text-on-surface/80 dark:text-gray-300">
								<li>
									<strong>Email:</strong>{" "}
									<a
										href="mailto:hello@gporganics.com"
										className="text-primary-600 dark:text-primary-400 hover:underline"
									>
										hello@gporganics.com
									</a>
								</li>
								<li>
									<strong>Phone:</strong>{" "}
									<a
										href="tel:+2347018845177"
										className="text-primary-600 dark:text-primary-400 hover:underline"
									>
										(234) 701 884 5177
									</a>
								</li>
							</ul>
						</section>
					</div>
				</div>
			</div>
		</Layout>
	);
};

export default TermsOfService;
