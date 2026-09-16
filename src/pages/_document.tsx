import { Html, Head, Main, NextScript } from "next/document";

const themeScript = `
(function() {
  try {
    var theme = localStorage.getItem('gp-theme');
    if (!theme) {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  } catch(e) {}
})();
`;

export default function Document() {
	return (
		<Html lang="en">
			<Head>
				{/* Favicons */}
				<link rel="icon" href="/icons/favicon.ico" type="image/x-icon" />
				<link rel="icon" href="/icons/favicon-16x16.png" type="image/png" sizes="16x16" />
				<link rel="icon" href="/icons/favicon-32x32.png" type="image/png" sizes="32x32" />
				<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" sizes="180x180" />
				<link rel="icon" href="/icons/android-chrome-192x192.png" type="image/png" sizes="192x192" />
				<link rel="icon" href="/icons/android-chrome-512x512.png" type="image/png" sizes="512x512" />

				{/* Web App Manifest */}
				<meta name="theme-color" content="#16a34a" />
				<meta name="apple-mobile-web-app-capable" content="yes" />
				<meta name="apple-mobile-web-app-status-bar-style" content="default" />
				<meta name="apple-mobile-web-app-title" content="Green Pastures" />

				{/* Default SEO */}
				<meta name="description" content="Green Pastures Organics — Premium organic dietary supplements for immunity, fertility, and wellness. Fresh, healthy, sustainably grown." />
				<meta property="og:type" content="website" />
				<meta property="og:site_name" content="Green Pastures Organics" />
				<meta property="og:image" content="/icons/android-chrome-512x512.png" />

				{/* Fonts */}
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link
					rel="preconnect"
					href="https://fonts.gstatic.com"
					crossOrigin="anonymous"
				/>
			</Head>
			<body className="antialiased font-sans">
				<script dangerouslySetInnerHTML={{ __html: themeScript }} />
				<Main />
				<NextScript />
			</body>
		</Html>
	);
}
