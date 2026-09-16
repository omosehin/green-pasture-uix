import React from "react";
import Layout from "@/_components/Layout";

const RefundPolicy = () => {
	return (
		<Layout pageTitle="Return & Refund Policy">
			<div className="bg-mint-50 dark:bg-[#0a0f1a] animate-page-enter">
				<div className="container page-wrapper mx-auto px-4 py-16 md:py-24">
					<div className="max-w-3xl mx-auto bg-white rounded-radius-lg border border-outline-variant shadow-elevation-1 p-8 md:p-12 dark:bg-transparent dark:border-transparent dark:shadow-none dark:p-0">
						<h1 className="text-3xl md:text-4xl font-bold text-on-surface dark:text-white mb-2">
							Return & Refund Policy
						</h1>
						<p className="text-sm text-on-surface-variant dark:text-gray-400 mb-10">
							Last updated: March 24, 2026
						</p>

						{/* 1. Overview */}
						<section className="mb-10 pb-8 border-b border-outline-variant dark:border-gray-800">
							<h2 className="text-xl font-semibold text-on-surface dark:text-white mb-4">
								1. Overview
							</h2>
							<p className="text-on-surface/80 dark:text-gray-300 leading-relaxed">
								At Green Pasture Organics, your satisfaction is our priority. We are committed to
								providing high-quality dietary supplements and organic products. If you are not entirely
								satisfied with your purchase, we are here to help.
							</p>
						</section>

						{/* 2. Eligibility */}
						<section className="mb-10 pb-8 border-b border-outline-variant dark:border-gray-800">
							<h2 className="text-xl font-semibold text-on-surface dark:text-white mb-4">
								2. Eligibility for Returns
							</h2>
							<p className="text-on-surface/80 dark:text-gray-300 leading-relaxed mb-3">
								To be eligible for a return, the following conditions must be met:
							</p>
							<ul className="list-disc pl-6 space-y-2 text-on-surface/80 dark:text-gray-300">
								<li>The return request must be made within 14 days of receiving your order.</li>
								<li>The product must be unused, unopened, and in its original packaging.</li>
								<li>The product must be in the same condition as when you received it.</li>
								<li>You must provide proof of purchase (order confirmation or receipt).</li>
							</ul>
						</section>

						{/* 3. Non-Returnable Items */}
						<section className="mb-10 pb-8 border-b border-outline-variant dark:border-gray-800">
							<h2 className="text-xl font-semibold text-on-surface dark:text-white mb-4">
								3. Non-Returnable Items
							</h2>
							<p className="text-on-surface/80 dark:text-gray-300 leading-relaxed mb-3">
								The following items cannot be returned:
							</p>
							<ul className="list-disc pl-6 space-y-2 text-on-surface/80 dark:text-gray-300">
								<li>Supplements and health products that have been opened or have broken seals.</li>
								<li>Perishable goods, including fresh produce and items with a short shelf life.</li>
								<li>Gift cards and promotional vouchers.</li>
								<li>Items purchased during clearance sales (unless defective).</li>
							</ul>
						</section>

						{/* 4. How to Request a Return */}
						<section className="mb-10 pb-8 border-b border-outline-variant dark:border-gray-800">
							<h2 className="text-xl font-semibold text-on-surface dark:text-white mb-4">
								4. How to Request a Return
							</h2>
							<p className="text-on-surface/80 dark:text-gray-300 leading-relaxed mb-3">
								To initiate a return, please follow these steps:
							</p>
							<ol className="list-decimal pl-6 space-y-2 text-on-surface/80 dark:text-gray-300">
								<li>
									Send an email to{" "}
									<a
										href="mailto:hello@gporganics.com"
										className="text-primary-600 dark:text-primary-400 hover:underline"
									>
										hello@gporganics.com
									</a>{" "}
									with the subject line &quot;Return Request&quot;.
								</li>
								<li>Include your order reference number and the reason for the return.</li>
								<li>Our team will review your request and respond within 2 business days.</li>
								<li>
									If approved, you will receive instructions on how to ship the item back to us.
								</li>
							</ol>
						</section>

						{/* 5. Refund Process */}
						<section className="mb-10 pb-8 border-b border-outline-variant dark:border-gray-800">
							<h2 className="text-xl font-semibold text-on-surface dark:text-white mb-4">
								5. Refund Process
							</h2>
							<p className="text-on-surface/80 dark:text-gray-300 leading-relaxed mb-3">
								Once we receive and inspect your returned item, we will notify you of the approval or
								rejection of your refund.
							</p>
							<ul className="list-disc pl-6 space-y-2 text-on-surface/80 dark:text-gray-300">
								<li>
									Approved refunds will be processed to your original payment method within 5-10
									business days.
								</li>
								<li>
									You will receive an email confirmation once the refund has been issued.
								</li>
								<li>
									Please note that your bank or payment provider may take additional time to reflect
									the refund in your account.
								</li>
							</ul>
						</section>

						{/* 6. Shipping Costs */}
						<section className="mb-10 pb-8 border-b border-outline-variant dark:border-gray-800">
							<h2 className="text-xl font-semibold text-on-surface dark:text-white mb-4">
								6. Shipping Costs
							</h2>
							<p className="text-on-surface/80 dark:text-gray-300 leading-relaxed">
								The customer is responsible for return shipping costs unless the item received was
								defective, damaged, or incorrect. In such cases, Green Pasture Organics will cover the
								return shipping costs and arrange for a prepaid shipping label where applicable.
								Original shipping fees are non-refundable.
							</p>
						</section>

						{/* 7. Exchanges */}
						<section className="mb-10 pb-8 border-b border-outline-variant dark:border-gray-800">
							<h2 className="text-xl font-semibold text-on-surface dark:text-white mb-4">
								7. Exchanges
							</h2>
							<p className="text-on-surface/80 dark:text-gray-300 leading-relaxed">
								We offer exchanges for items of equal or lesser value, subject to product availability.
								If you wish to exchange an item, please follow the return process outlined above and
								specify the product you would like as a replacement. If the replacement item is of
								lesser value, the difference will be refunded. If it is of greater value, you will be
								asked to pay the difference.
							</p>
						</section>

						{/* 8. Damaged or Defective Items */}
						<section className="mb-10 pb-8 border-b border-outline-variant dark:border-gray-800">
							<h2 className="text-xl font-semibold text-on-surface dark:text-white mb-4">
								8. Damaged or Defective Items
							</h2>
							<p className="text-on-surface/80 dark:text-gray-300 leading-relaxed mb-3">
								If you receive a damaged or defective item, please contact us within 48 hours of
								delivery. To expedite the process:
							</p>
							<ul className="list-disc pl-6 space-y-2 text-on-surface/80 dark:text-gray-300">
								<li>
									Provide clear photographs of the damaged or defective product and its packaging.
								</li>
								<li>Include your order reference number and a description of the issue.</li>
								<li>
									Upon verification, we will offer a full refund or a replacement at no additional
									cost to you.
								</li>
							</ul>
						</section>

						{/* 9. Contact Information */}
						<section className="mb-4">
							<h2 className="text-xl font-semibold text-on-surface dark:text-white mb-4">
								9. Contact Information
							</h2>
							<p className="text-on-surface/80 dark:text-gray-300 leading-relaxed mb-3">
								If you have any questions about our Return & Refund Policy, please reach out to us:
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

export default RefundPolicy;
