import React from "react";
import Layout from "@/_components/Layout";

const PrivacyPolicy = () => {
	return (
		<Layout pageTitle="Privacy Policy">
			<div className="bg-mint-50 dark:bg-[#0a0f1a] animate-page-enter">
				<div className="container page-wrapper mx-auto px-4 py-16 md:py-24">
					<div className="max-w-3xl mx-auto bg-white rounded-radius-lg border border-outline-variant shadow-elevation-1 p-8 md:p-12 dark:bg-transparent dark:border-transparent dark:shadow-none dark:p-0">
						<h1 className="text-3xl md:text-4xl font-bold text-on-surface dark:text-white mb-2">
							Privacy Policy
						</h1>
						<p className="text-sm text-on-surface-variant dark:text-gray-400 mb-10">
							Last updated: March 24, 2026
						</p>

						{/* 1. Introduction */}
						<section className="mb-10 pb-8 border-b border-outline-variant dark:border-gray-800">
							<h2 className="text-xl font-semibold text-on-surface dark:text-white mb-4">
								1. Introduction
							</h2>
							<p className="text-on-surface/80 dark:text-gray-300 leading-relaxed">
								Green Pasture Organics is committed to protecting and respecting your privacy. This
								Privacy Policy explains how we collect, use, store, and protect your personal
								information when you use our website and services. By using our platform, you consent to
								the data practices described in this policy.
							</p>
						</section>

						{/* 2. Information We Collect */}
						<section className="mb-10 pb-8 border-b border-outline-variant dark:border-gray-800">
							<h2 className="text-xl font-semibold text-on-surface dark:text-white mb-4">
								2. Information We Collect
							</h2>
							<p className="text-on-surface/80 dark:text-gray-300 leading-relaxed mb-3">
								We may collect and process the following types of information:
							</p>
							<ul className="list-disc pl-6 space-y-2 text-on-surface/80 dark:text-gray-300">
								<li>
									<strong>Personal Information:</strong> Name, email address, phone number, shipping
									address, and billing address provided during registration or checkout.
								</li>
								<li>
									<strong>Payment Information:</strong> Payment details processed securely through
									Paystack. We do not store your full card details on our servers.
								</li>
								<li>
									<strong>Usage Data:</strong> Information about how you interact with our website,
									including pages visited, time spent on pages, click patterns, and referring URLs.
								</li>
								<li>
									<strong>Cookies & Device Data:</strong> Browser type, device information, IP address,
									and cookies used to enhance your experience and analyze site usage.
								</li>
							</ul>
						</section>

						{/* 3. How We Use Your Information */}
						<section className="mb-10 pb-8 border-b border-outline-variant dark:border-gray-800">
							<h2 className="text-xl font-semibold text-on-surface dark:text-white mb-4">
								3. How We Use Your Information
							</h2>
							<p className="text-on-surface/80 dark:text-gray-300 leading-relaxed mb-3">
								We use the information we collect for the following purposes:
							</p>
							<ul className="list-disc pl-6 space-y-2 text-on-surface/80 dark:text-gray-300">
								<li>To process and fulfill your orders, including shipping and payment processing.</li>
								<li>To create and manage your account on our platform.</li>
								<li>To communicate with you about orders, promotions, and updates.</li>
								<li>To personalize your shopping experience and recommend products.</li>
								<li>To improve our website, services, and customer support.</li>
								<li>To detect, prevent, and address fraud or security issues.</li>
								<li>To comply with legal obligations.</li>
							</ul>
						</section>

						{/* 4. Data Sharing */}
						<section className="mb-10 pb-8 border-b border-outline-variant dark:border-gray-800">
							<h2 className="text-xl font-semibold text-on-surface dark:text-white mb-4">
								4. Data Sharing
							</h2>
							<p className="text-on-surface/80 dark:text-gray-300 leading-relaxed mb-3">
								We do not sell your personal information. However, we share data with trusted
								third-party service providers who assist us in operating our platform:
							</p>
							<ul className="list-disc pl-6 space-y-2 text-on-surface/80 dark:text-gray-300">
								<li>
									<strong>Paystack:</strong> Secure payment processing for all transactions.
								</li>
								<li>
									<strong>Cloudinary:</strong> Image hosting and delivery for product images and media.
								</li>
								<li>
									<strong>OneSignal:</strong> Push notification delivery for order updates and
									promotional communications.
								</li>
							</ul>
							<p className="text-on-surface/80 dark:text-gray-300 leading-relaxed mt-3">
								These providers are contractually obligated to protect your data and may only use it for
								the purposes we specify.
							</p>
						</section>

						{/* 5. Data Storage & Security */}
						<section className="mb-10 pb-8 border-b border-outline-variant dark:border-gray-800">
							<h2 className="text-xl font-semibold text-on-surface dark:text-white mb-4">
								5. Data Storage & Security
							</h2>
							<p className="text-on-surface/80 dark:text-gray-300 leading-relaxed mb-3">
								We implement industry-standard security measures to protect your personal data,
								including:
							</p>
							<ul className="list-disc pl-6 space-y-2 text-on-surface/80 dark:text-gray-300">
								<li>Encrypted data storage and secure HTTPS connections.</li>
								<li>JWT (JSON Web Token) based authentication for secure session management.</li>
								<li>Regular security audits and vulnerability assessments.</li>
								<li>Access controls limiting data access to authorized personnel only.</li>
							</ul>
							<p className="text-on-surface/80 dark:text-gray-300 leading-relaxed mt-3">
								While we strive to protect your personal information, no method of transmission over the
								internet or electronic storage is 100% secure. We cannot guarantee absolute security.
							</p>
						</section>

						{/* 6. Your Rights */}
						<section className="mb-10 pb-8 border-b border-outline-variant dark:border-gray-800">
							<h2 className="text-xl font-semibold text-on-surface dark:text-white mb-4">
								6. Your Rights
							</h2>
							<p className="text-on-surface/80 dark:text-gray-300 leading-relaxed mb-3">
								In accordance with applicable data protection regulations, including the GDPR and the
								Nigeria Data Protection Regulation (NDPR), you have the following rights:
							</p>
							<ul className="list-disc pl-6 space-y-2 text-on-surface/80 dark:text-gray-300">
								<li>
									<strong>Right of Access:</strong> You may request a copy of the personal data we hold
									about you.
								</li>
								<li>
									<strong>Right to Correction:</strong> You may request that we correct any inaccurate
									or incomplete personal data.
								</li>
								<li>
									<strong>Right to Deletion:</strong> You may request that we delete your personal data
									where there is no compelling reason for its continued processing.
								</li>
								<li>
									<strong>Right to Data Portability:</strong> You may request a copy of your data in a
									structured, commonly used, and machine-readable format.
								</li>
								<li>
									<strong>Right to Withdraw Consent:</strong> You may withdraw your consent for data
									processing at any time without affecting the lawfulness of prior processing.
								</li>
							</ul>
							<p className="text-on-surface/80 dark:text-gray-300 leading-relaxed mt-3">
								To exercise any of these rights, please contact us using the details provided below.
							</p>
						</section>

						{/* 7. Cookies & Tracking */}
						<section className="mb-10 pb-8 border-b border-outline-variant dark:border-gray-800">
							<h2 className="text-xl font-semibold text-on-surface dark:text-white mb-4">
								7. Cookies & Tracking
							</h2>
							<p className="text-on-surface/80 dark:text-gray-300 leading-relaxed mb-3">
								Our website uses cookies and similar tracking technologies to enhance your browsing
								experience. Cookies are small data files stored on your device. We use the following
								types:
							</p>
							<ul className="list-disc pl-6 space-y-2 text-on-surface/80 dark:text-gray-300">
								<li>
									<strong>Essential Cookies:</strong> Required for the website to function properly
									(e.g., session management, authentication).
								</li>
								<li>
									<strong>Analytics Cookies:</strong> Help us understand how visitors interact with our
									website to improve performance.
								</li>
								<li>
									<strong>Preference Cookies:</strong> Remember your settings and preferences for
									future visits.
								</li>
							</ul>
							<p className="text-on-surface/80 dark:text-gray-300 leading-relaxed mt-3">
								You can manage or disable cookies through your browser settings. Note that disabling
								certain cookies may affect the functionality of our website.
							</p>
						</section>

						{/* 8. Children's Privacy */}
						<section className="mb-10 pb-8 border-b border-outline-variant dark:border-gray-800">
							<h2 className="text-xl font-semibold text-on-surface dark:text-white mb-4">
								8. Children&apos;s Privacy
							</h2>
							<p className="text-on-surface/80 dark:text-gray-300 leading-relaxed">
								Our services are not directed to individuals under the age of 18. We do not knowingly
								collect personal information from children. If we become aware that a child under 18 has
								provided us with personal data, we will take steps to delete such information
								promptly. If you are a parent or guardian and believe your child has provided us with
								personal data, please contact us.
							</p>
						</section>

						{/* 9. Changes to This Policy */}
						<section className="mb-10 pb-8 border-b border-outline-variant dark:border-gray-800">
							<h2 className="text-xl font-semibold text-on-surface dark:text-white mb-4">
								9. Changes to This Policy
							</h2>
							<p className="text-on-surface/80 dark:text-gray-300 leading-relaxed">
								We may update this Privacy Policy from time to time to reflect changes in our practices
								or for legal, operational, or regulatory reasons. Any changes will be posted on this
								page with an updated &quot;Last updated&quot; date. We encourage you to review this
								policy periodically. Your continued use of our platform after changes constitutes
								acceptance of the updated policy.
							</p>
						</section>

						{/* 10. Contact Us */}
						<section className="mb-4">
							<h2 className="text-xl font-semibold text-on-surface dark:text-white mb-4">
								10. Contact Us
							</h2>
							<p className="text-on-surface/80 dark:text-gray-300 leading-relaxed mb-3">
								If you have any questions about this Privacy Policy or wish to exercise your data
								rights, please contact us:
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

export default PrivacyPolicy;
