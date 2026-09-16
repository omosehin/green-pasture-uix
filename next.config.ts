import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	/* config options here */
	reactStrictMode: true,
	output: 'standalone',
	// output: "export",
	eslint: {
		ignoreDuringBuilds: true,
	},
	typescript: {
		ignoreBuildErrors: false,
	},
	images: {
		unoptimized: true, // Required with output: "export" (static HTML)
		remotePatterns: [
			{ protocol: "https", hostname: "**.cloudinary.com" },
			{ protocol: "https", hostname: "images.unsplash.com" },
			{ protocol: "https", hostname: "unsplash.com" },
		],
	},
	webpack(config, { dev }) {
		if (!dev && config.optimization?.minimizer) {
			config.optimization.minimizer.forEach((plugin: any) => {
				if (plugin.constructor.name === "TerserPlugin") {
					if (plugin.options?.terserOptions?.compress) {
						plugin.options.terserOptions.compress.drop_console = true;
						plugin.options.terserOptions.compress.pure_funcs = [
							"console.log",
							"console.info",
							"console.debug",
							"console.warn",
							"console.error",
						];
					}
				}
			});
		}
		return config;
	},
};

export default nextConfig;
