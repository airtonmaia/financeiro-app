// tailwind.config.js

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class', 'class'],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
theme: {
	extend: {
		colors: {
			brand: {
				'50': 'rgb(238, 242, 255)',
				'100': 'rgb(224, 231, 255)',
				'200': 'rgb(199, 210, 254)',
				'300': 'rgb(165, 180, 252)',
				'400': 'rgb(129, 140, 248)',
				'500': 'rgb(99, 102, 241)',
				'600': 'rgb(79, 70, 229)',
				'700': 'rgb(67, 56, 202)',
				'800': 'rgb(55, 48, 163)',
				'900': 'rgb(49, 46, 129)'
			},
			neutral: {
				'0': 'rgb(255, 255, 255)',
				'50': 'rgb(249, 250, 251)',
				'100': 'rgb(243, 244, 246)',
				'200': 'rgb(229, 231, 235)',
				'300': 'rgb(209, 213, 219)',
				'400': 'rgb(156, 163, 175)',
				'500': 'rgb(107, 114, 128)',
				'600': 'rgb(75, 85, 99)',
				'700': 'rgb(55, 65, 81)',
				'800': 'rgb(31, 41, 55)',
				'900': 'rgb(17, 24, 39)',
				'950': 'rgb(3, 7, 18)'
			},
			error: {
				'50': 'rgb(254, 242, 242)',
				'100': 'rgb(254, 226, 226)',
				'200': 'rgb(254, 202, 202)',
				'300': 'rgb(252, 165, 165)',
				'400': 'rgb(248, 113, 113)',
				'500': 'rgb(239, 68, 68)',
				'600': 'rgb(220, 38, 38)',
				'700': 'rgb(185, 28, 28)',
				'800': 'rgb(153, 27, 27)',
				'900': 'rgb(127, 29, 29)'
			},
			warning: {
				'50': 'rgb(255, 251, 235)',
				'100': 'rgb(254, 243, 199)',
				'200': 'rgb(253, 230, 138)',
				'300': 'rgb(252, 211, 77)',
				'400': 'rgb(251, 191, 36)',
				'500': 'rgb(245, 158, 11)',
				'600': 'rgb(217, 119, 6)',
				'700': 'rgb(180, 83, 9)',
				'800': 'rgb(146, 64, 14)',
				'900': 'rgb(120, 53, 15)'
			},
			success: {
				'50': 'rgb(240, 253, 250)',
				'100': 'rgb(204, 251, 241)',
				'200': 'rgb(153, 246, 228)',
				'300': 'rgb(94, 234, 212)',
				'400': 'rgb(45, 212, 191)',
				'500': 'rgb(20, 184, 166)',
				'600': 'rgb(13, 148, 136)',
				'700': 'rgb(15, 118, 110)',
				'800': 'rgb(17, 94, 89)',
				'900': 'rgb(19, 78, 74)'
			},
			'brand-primary': 'rgb(79, 70, 229)',
			'default-font': 'rgb(17, 24, 39)',
			'subtext-color': 'rgb(107, 114, 128)',
			'neutral-border': 'rgb(229, 231, 235)',
			white: 'rgb(255, 255, 255)',
			'default-background': 'rgb(255, 255, 255)',
			background: 'hsl(var(--background))',
			foreground: 'hsl(var(--foreground))',
			card: {
				DEFAULT: 'hsl(var(--card))',
				foreground: 'hsl(var(--card-foreground))'
			},
			popover: {
				DEFAULT: 'hsl(var(--popover))',
				foreground: 'hsl(var(--popover-foreground))'
			},
			primary: {
				DEFAULT: 'hsl(var(--primary))',
				foreground: 'hsl(var(--primary-foreground))'
			},
			secondary: {
				DEFAULT: 'hsl(var(--secondary))',
				foreground: 'hsl(var(--secondary-foreground))'
			},
			muted: {
				DEFAULT: 'hsl(var(--muted))',
				foreground: 'hsl(var(--muted-foreground))'
			},
			accent: {
				DEFAULT: 'hsl(var(--accent))',
				foreground: 'hsl(var(--accent-foreground))'
			},
			destructive: {
				DEFAULT: 'hsl(var(--destructive))',
				foreground: 'hsl(var(--destructive-foreground))'
			},
			border: 'hsl(var(--border))',
			input: 'hsl(var(--input))',
			ring: 'hsl(var(--ring))',
			chart: {
				'1': 'hsl(var(--chart-1))',
				'2': 'hsl(var(--chart-2))',
				'3': 'hsl(var(--chart-3))',
				'4': 'hsl(var(--chart-4))',
				'5': 'hsl(var(--chart-5))'
			}
		},
		fontSize: {
			caption: [
				'12px',
				{
					lineHeight: '16px',
					fontWeight: '400',
					letterSpacing: '0em'
				}
			],
			'caption-bold': [
				'12px',
				{
					lineHeight: '16px',
					fontWeight: '500',
					letterSpacing: '0em'
				}
			],
			body: [
				'14px',
				{
					lineHeight: '20px',
					fontWeight: '400',
					letterSpacing: '0em'
				}
			],
			'body-bold': [
				'14px',
				{
					lineHeight: '20px',
					fontWeight: '500',
					letterSpacing: '0em'
				}
			],
			'heading-3': [
				'16px',
				{
					lineHeight: '20px',
					fontWeight: '500',
					letterSpacing: '0em'
				}
			],
			'heading-2': [
				'20px',
				{
					lineHeight: '24px',
					fontWeight: '500',
					letterSpacing: '0em'
				}
			],
			'heading-1': [
				'30px',
				{
					lineHeight: '36px',
					fontWeight: '500',
					letterSpacing: '0em'
				}
			],
			'monospace-body': [
				'14px',
				{
					lineHeight: '20px',
					fontWeight: '400',
					letterSpacing: '0em'
				}
			]
		},
		fontFamily: {
			caption: 'Geist',
			'caption-bold': 'Geist',
			body: 'Geist',
			'body-bold': 'Geist',
			'heading-3': 'Geist',
			'heading-2': 'Geist',
			'heading-1': 'Geist',
			'monospace-body': 'monospace'
		},
	
		screens: {
			mobile: {
				max: '767px'
			}
		}
	}
},
    plugins: [require("tailwindcss-animate")]
};