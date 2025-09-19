import { __, _x } from '@wordpress/i18n';
import { RETURNABLE_FIELDS, SORT_QUERY_MAP } from './constants';
import { Category, SearchParams } from './types';

export const getCategories: () => Record< string, Category > = () => ( {
	discover: {
		menu: __( 'Discover' ),
		title: __( 'Discover' ),
		slug: 'discover',
		tags: [],
		preview: [],
	},
	paid: {
		menu: __( 'Premium plugins' ),
		title: __( 'Must-have premium plugins' ),
		description: __( 'Take your site further with these premium plugins.' ),
		slug: 'paid',
		tags: [],
		preview: [],
	},
	popular: {
		menu: __( 'Popular plugins' ),
		title: __( 'Popular plugins' ),
		description: __( 'Add and install the most popular free plugins.' ),
		slug: 'popular',
		tags: [],
		preview: [],
	},
	featured: {
		menu: __( 'Developer favorites' ),
		title: __( 'Our developers’ favorites' ),
		description: __( 'Start fast with these WordPress.com team picks.' ),
		slug: 'featured',
		tags: [],
		preview: [],
	},
	seo: {
		menu: __( 'Search engine optimization' ),
		title: __( 'Search engine optimization' ),
		description: __( 'Fine-tune your site’s content and metadata for search engine success.' ),
		icon: 'grid',
		slug: 'seo',
		tags: [ 'seo' ],
		preview: [],
	},
	ecommerce: {
		menu: __( 'Ecommerce & business' ),
		title: __( 'Powering your online store' ),
		icon: 'grid',
		slug: 'ecommerce',
		tags: [ 'ecommerce', 'e-commerce', 'woocommerce', 'payments' ],
		description: __( 'Tools that will set you up to optimize your online business.' ),
		preview: [
			{
				slug: 'woocommerce-subscriptions',
				name: __( 'WooCommerce Subscriptions' ),
				icon: 'https://woocommerce.com/wp-content/uploads/2012/09/Woo_Subscriptions_icon-marketplace-160x160-2.png',
				short_description: __( 'Let customers subscribe to your service' ),
			},
			{
				slug: 'woocommerce-xero',
				name: __( 'Xero' ),
				icon: 'https://woocommerce.com/wp-content/uploads/2012/08/xero2.png',
				short_description: __( 'Sync your site with your Xero account' ),
			},
			{
				slug: 'automatewoo',
				name: __( 'AutomateWoo' ),
				icon: 'https://woocommerce.com/wp-content/uploads/2019/10/woo-AutomateWoo.png',
				short_description: __( 'Create a range of automated workflows' ),
			},
			{
				slug: 'woocommerce-shipment-tracking',
				name: __( 'Shipment tracking' ),
				icon: 'https://woocommerce.com/wp-content/uploads/2012/05/Shipment_Tracking_icon-marketplace-160x160-2.png',
				short_description: __( 'Provide shipment tracking information' ),
			},
			{
				slug: 'woocommerce-shipping-usps',
				name: __( 'WooCommerce USPS Shipping' ),
				icon: 'https://woocommerce.com/wp-content/uploads/2013/01/woo-USPS-yhn1rb.png',
				short_description: __( 'Get shipping rates from the USPS API' ),
			},
			{
				slug: 'woocommerce-paypal-payments',
				name: __( 'WooCommerce PayPal Payments' ),
				icon: 'https://ps.w.org/woocommerce-paypal-payments/assets/icon-256x256.png?rev=3234615',
				short_description: __( 'Accept PayPal payments' ),
			},
		],
	},
	booking: {
		menu: __( 'Booking & scheduling' ),
		title: __( 'Booking & scheduling' ),
		description: __( 'Take bookings and manage your availability right from your site.' ),
		icon: 'grid',
		slug: 'booking',
		tags: [ 'booking', 'scheduling', 'appointment', 'reservation', 'booking-calendar' ],
		preview: [],
	},
	events: {
		menu: __( 'Events calendar' ),
		title: __( 'Events calendar' ),
		description: __( 'Build buzz and set the scene with an on-site events calendar.' ),
		icon: 'grid',
		slug: 'events',
		tags: [ 'events-calendar', 'calendar', 'calendar-event' ],
		preview: [],
	},
	social: {
		menu: _x( 'Social', 'category name' ),
		title: __( 'Social' ),
		description: __( 'Connect to your audience and amplify your content on social.' ),
		icon: 'grid',
		slug: 'social',
		tags: [ 'social', 'facebook', 'twitter', 'instagram', 'tiktok', 'youtube', 'pinterest' ],
		preview: [],
	},
	email: {
		menu: __( 'Email' ),
		title: __( 'Email' ),
		description: __( 'Forge a direct connection with your readers through email.' ),
		icon: 'grid',
		slug: 'email',
		tags: [ 'email' ],
		preview: [],
	},
	security: {
		menu: __( 'Security' ),
		title: __( 'Security' ),
		description: __( 'Take advanced control of your site’s security.' ),
		icon: 'grid',
		slug: 'security',
		tags: [ 'security' ],
		preview: [],
	},
	finance: {
		menu: __( 'Finance & payments' ),
		title: __( 'Finance & payments' ),
		description: __(
			'Sell products, subscriptions, and services while keeping on top of every transaction.'
		),
		icon: 'grid',
		slug: 'finance',
		tags: [ 'finance', 'payment', 'credit-card', 'payment-gateway' ],
		preview: [],
	},
	shipping: {
		menu: __( 'Shipping & delivery' ),
		title: __( 'Shipping & delivery' ),
		description: __( 'Create a seamless shipping experience with advanced delivery integrations.' ),
		icon: 'grid',
		slug: 'shipping',
		tags: [
			'shipping',
			'usps',
			'woocommerce-shipping',
			'delivery',
			'shipment-tracking',
			'food-delivery',
			'food-pickup',
			'courier',
		],
		preview: [],
	},
	analytics: {
		menu: __( 'Analytics' ),
		title: __( 'Analytics' ),
		description: __( 'Go deeper and learn faster with site visitor and performance insights.' ),
		icon: 'grid',
		slug: 'analytics',
		tags: [ 'analytics', 'google analytics', 'ga', 'stats', 'statistics' ],
		preview: [],
	},
	marketing: {
		menu: __( 'Marketing' ),
		title: __( 'Marketing' ),
		description: __( 'Bring in new business and shine a spotlight on your projects or products.' ),
		icon: 'grid',
		slug: 'marketing',
		tags: [ 'marketing' ],
		preview: [],
	},
	design: {
		menu: __( 'Design' ),
		title: __( 'Design' ),
		description: __( 'Finesse your site’s design with advanced customization tools.' ),
		icon: 'grid',
		slug: 'design',
		tags: [ 'design', 'blocks', 'editor' ],
		preview: [],
	},
	photo: {
		menu: __( 'Photo & video' ),
		title: __( 'Photo & video' ),
		description: __(
			'Create, share, edit, and manage beautiful images and video {with added precision and flexibility.'
		),
		icon: 'grid',
		slug: 'photo',
		tags: [ 'photo', 'video', 'media' ],
		preview: [],
	},
	customer: {
		menu: __( 'CRM & live chat' ),
		title: __( 'CRM & live chat' ),
		description: __( 'Create stand-out customer service experiences for your site visitors.' ),
		icon: 'grid',
		slug: 'customer',
		tags: [ 'customer-service', 'live-chat', 'crm' ],
		preview: [],
	},
	donations: {
		menu: __( 'Crowdfunding' ),
		title: __( 'Crowdfunding' ),
		description: __( 'Launch and run crowdfunding campaigns right from your site.' ),
		icon: 'grid',
		slug: 'donations',
		tags: [
			'donation',
			'donation-plugin',
			'donations',
			'donate',
			'fundraising',
			'crowdfunding',
			'recurring-donations',
			'charity',
		],
		preview: [],
	},
	education: {
		menu: __( 'Learning management systems' ),
		title: __( 'Learning management systems' ),
		description: __( 'Create, run, and manage interactive courses and learning experiences.' ),
		icon: 'grid',
		slug: 'education',
		tags: [ 'education', 'lms', 'learning-management-systems', 'elearning' ],
		preview: [],
	},
	widgets: {
		menu: __( 'Widgets' ),
		title: __( 'Widgets' ),
		description: __( 'Take widgets to the next level with advanced control and customization.' ),
		icon: 'grid',
		slug: 'widgets',
		tags: [ 'widgets' ],
		preview: [],
	},
	posts: {
		menu: __( 'Posts & posting' ),
		title: __( 'Posts & posting' ),
		description: __( 'Unlock advanced content planning, publishing, and scheduling features.' ),
		icon: 'grid',
		slug: 'posts',
		tags: [ 'posts', 'post', 'page', 'pages' ],
		preview: [],
	},
	monetization: {
		menu: __( 'Monetization' ),
		title: __( 'Supercharging and monetizing your blog' ),
		slug: 'monetization',
		description: __(
			'Building a money-making blog doesn’t have to be as hard as you might think.'
		),
		tags: [ 'affiliate-marketing', 'advertising', 'adwords' ],
		preview: [
			{
				slug: 'wordpress-seo-premium',
				name: __( 'Yoast SEO Premium' ),
				icon: 'https://ps.w.org/wordpress-seo/assets/icon-256x256.gif',
				short_description: __( 'Optimize your site for search engines' ),
			},
			{
				slug: 'give',
				name: __( 'GiveWP' ),
				icon: 'https://ps.w.org/give/assets/icon-256x256.jpg?rev=2659032',
				short_description: __( 'Create donation pages and collect more' ),
			},
			{
				slug: 'sensei-pro',
				name: __( 'Sensei Pro' ),
				icon: 'https://wordpress.com/wp-content/lib/marketplace-images/sensei-pro.svg',
				short_description: __( 'Manage and sell digital courses' ),
			},
			{
				slug: 'optinmonster',
				name: __( 'OptinMonster' ),
				icon: 'https://ps.w.org/optinmonster/assets/icon-256x256.png',
				short_description: __( 'Monetize your website traffic' ),
			},
			{
				slug: 'easy-digital-downloads',
				name: __( 'Easy Digital Downloads' ),
				icon: 'https://ps.w.org/easy-digital-downloads/assets/icon.svg',
				short_description: __( 'Create and sell digital products' ),
			},
			{
				slug: 'elementor',
				name: __( 'Elementor' ),
				icon: 'https://ps.w.org/elementor/assets/icon-256x256.gif?rev=3111597',
				short_description: __( 'Drag and drop page builder' ),
			},
		],
	},
	business: {
		menu: _x( 'Business', 'category name' ),
		title: __( 'Setting up your local business' ),
		slug: 'business',
		description: __( 'These plugins are here to keep your business on track.' ),
		tags: [ 'google', 'testimonials', 'crm', 'business-directory' ],
		preview: [
			{
				slug: 'wordpress-seo-premium',
				name: __( 'Yoast SEO Premium' ),
				icon: 'https://ps.w.org/wordpress-seo/assets/icon-256x256.gif',
				short_description: __( 'Optimize your site for search engines' ),
			},
			{
				slug: 'woocommerce-bookings',
				name: __( 'WooCommerce Bookings' ),
				icon: 'https://woocommerce.com/wp-content/uploads/2014/05/Bookings_icon-marketplace-160x160-1.png',
				short_description: __( 'Allow customers to book appointments' ),
			},
			{
				slug: 'mailpoet',
				name: __( 'MailPoet' ),
				icon: 'https://ps.w.org/mailpoet/assets/icon-256x256.png?rev=2784430',
				short_description: __( 'Send emails and create loyal customers' ),
			},
			{
				slug: 'zero-bs-crm',
				name: __( 'Jetpack CRM' ),
				icon: 'https://ps.w.org/zero-bs-crm/assets/icon.svg',
				short_description: __( 'Lead generation and marketing automation' ),
			},
			{
				slug: 'strong-testimonials',
				name: __( 'Strong Testimonials' ),
				icon: 'https://ps.w.org/strong-testimonials/assets/icon-256x256.png',
				short_description: __( 'Easily collect and display testimonials' ),
			},
			{
				slug: 'all-in-one-wp-migration',
				name: __( 'All-in-One WP Migration' ),
				icon: 'https://ps.w.org/all-in-one-wp-migration/assets/icon-256x256.png',
				short_description: __( 'Move websites between hosts with ease' ),
			},
		],
	},
	affiliate: {
		menu: __( 'Affiliate' ),
		title: __( 'Affiliate' ),
		slug: 'affiliate',
		tags: [ 'affiliate', 'affiliates', 'affiliate marketing' ],
		preview: [],
	},
	quiz: {
		menu: __( 'Quiz' ),
		title: __( 'Quiz' ),
		slug: 'quiz',
		tags: [ 'quiz', 'questionnaire', 'exam', 'personality quizzes' ],
		preview: [],
	},
	landingpage: {
		menu: __( 'Landing page' ),
		title: __( 'Landing page' ),
		slug: 'landingpage',
		tags: [ 'landing page', 'page builder', 'landing-page' ],
		preview: [],
	},
	forms: {
		menu: __( 'Forms' ),
		title: __( 'Forms' ),
		slug: 'forms',
		tags: [ 'form', 'forms' ],
		preview: [],
	},
	reviews: {
		menu: __( 'Reviews' ),
		title: __( 'Reviews' ),
		slug: 'reviews',
		tags: [ 'review', 'reviews', 'product reviews', 'customer reviews' ],
		preview: [],
	},
	translation: {
		menu: __( 'Translation' ),
		title: __( 'Translation' ),
		slug: 'translation',
		tags: [ 'translation', 'localization', 'bilingual', 'international' ],
		preview: [],
	},
	membership: {
		menu: __( 'Membership' ),
		title: __( 'Membership' ),
		slug: 'membership',
		tags: [ 'membership', 'members', 'members-only' ],
		preview: [],
	},
	maps: {
		menu: __( 'Maps' ),
		title: __( 'Maps' ),
		slug: 'maps',
		tags: [ 'map', 'maps', 'google map', 'google maps', 'directions' ],
		preview: [],
	},
	tables: {
		menu: __( 'Tables' ),
		title: __( 'Tables' ),
		slug: 'tables',
		tags: [ 'table', 'table builder' ],
		preview: [],
	},
	forums: {
		menu: __( 'Forums' ),
		title: __( 'Forums' ),
		slug: 'forums',
		tags: [ 'forum', 'forum plugin', 'community' ],
		preview: [],
	},
	comments: {
		menu: _x( 'Comment', 'category name' ),
		title: __( 'Comments & commenting' ),
		slug: 'comments',
		tags: [ 'comment', 'comments', 'comment fields', 'delete comments' ],
		preview: [],
	},
	faq: {
		menu: __( 'FAQ' ),
		title: __( 'FAQ' ),
		slug: 'faq',
		tags: [ 'faq', 'faqs', 'frequently asked questions' ],
		preview: [],
	},
	testimonials: {
		menu: __( 'Testimonials' ),
		title: __( 'Testimonials' ),
		slug: 'testimonials',
		tags: [ 'testimonials', 'testimonial', 'testimonial showcase' ],
		preview: [],
	},
	realestate: {
		menu: __( 'Real estate' ),
		title: __( 'Real estate' ),
		slug: 'realestate',
		tags: [
			'real estate',
			'agency',
			'property',
			'agent listings',
			'home asap',
			'MLS',
			'real-estate',
			'IDX',
		],
		preview: [],
	},
	survey: {
		menu: __( 'Survey' ),
		title: __( 'Survey' ),
		slug: 'survey',
		tags: [ 'survey', 'surveys', 'feedback', 'questionnaire' ],
		preview: [],
	},
	accessibility: {
		menu: __( 'Accessibility' ),
		title: __( 'Accessibility' ),
		slug: 'accessibility',
		tags: [ 'accessibility', 'accessible', 'navigation' ],
		preview: [],
	},
	projectmanagement: {
		menu: __( 'Project management' ),
		title: __( 'Project management' ),
		slug: 'projectmanagement',
		tags: [ 'gantt charts', 'kanban', 'project', 'project management', 'tasks', 'task management' ],
		preview: [],
	},
	jobboards: {
		menu: __( 'Job boards' ),
		title: __( 'Job boards' ),
		slug: 'jobboards',
		tags: [ 'career', 'job board', 'job listing' ],
		preview: [],
	},
	search: {
		menu: _x( 'Search', 'category name' ),
		title: __( 'Search' ),
		slug: 'search',
		tags: [ 'ajax search', 'image search', 'search and replace', 'search', 'google' ],
		preview: [],
	},
	portfolio: {
		menu: __( 'Portfolio' ),
		title: __( 'Portfolio' ),
		slug: 'portfolio',
		tags: [
			'portfolio',
			'add portfolio',
			'add portfolio widget',
			'portfolio gallery',
			'portfolio plugin',
		],
		preview: [],
	},
	rss: {
		menu: __( 'RSS' ),
		title: __( 'RSS' ),
		slug: 'rss',
		tags: [ 'feed', 'news', 'rss', 'rss feed' ],
		preview: [],
	},
	knowledgebase: {
		menu: __( 'Knowledge base' ),
		title: __( 'Knowledge base' ),
		slug: 'knowledgebase',
		tags: [ 'faq', 'faqs', 'frequently asked questions', 'knowledge base' ],
		preview: [],
	},
	storelocator: {
		menu: __( 'Store locator' ),
		title: __( 'Store locator' ),
		slug: 'storelocator',
		tags: [ 'business locations', 'geocoding', 'locators', 'dealer locator', 'directions' ],
		preview: [],
	},
	newsfeed: {
		menu: __( 'Newsfeed' ),
		title: __( 'Newsfeed' ),
		slug: 'newsfeed',
		tags: [ 'news', 'newsfeed', 'news feeds' ],
		preview: [],
	},
	sliders: {
		menu: __( 'Sliders' ),
		title: __( 'Sliders' ),
		slug: 'sliders',
		tags: [
			'image slider',
			'layer slider',
			'responsive slider',
			'photo slider',
			'slider',
			'gallery slider',
		],
		preview: [],
	},
	schema: {
		menu: __( 'Schema' ),
		title: __( 'Schema' ),
		slug: 'schema',
		tags: [
			'JSON-LD',
			'rich snippets',
			'schema',
			'schema.org',
			'schema markup',
			'google snippets',
			'structured data',
		],
		preview: [],
	},
	music: {
		menu: __( 'Music' ),
		title: __( 'Music' ),
		slug: 'music',
		tags: [
			'audio player',
			'audioplayer',
			'html5 audio player',
			'music',
			'music player',
			'bass',
			'guitar',
			'musician',
			'audio',
			'mp3',
		],
		preview: [],
	},
	popups: {
		menu: __( 'Popups' ),
		title: __( 'Popups' ),
		slug: 'popups',
		tags: [ 'optin', 'exit popup', 'pop up', 'popup builder', 'popup maker' ],
		preview: [],
	},
	calculators: {
		menu: __( 'Calculators' ),
		title: __( 'Calculators' ),
		slug: 'calculators',
		tags: [
			'calculator',
			'cost calculator',
			'calculator form builder',
			'cost estimator',
			'loan calculator',
			'mortgage calculator',
		],
		preview: [],
	},
	advertising: {
		menu: __( 'Advertising' ),
		title: __( 'Advertising' ),
		slug: 'advertising',
		tags: [ 'ads', 'google', 'ad codes', 'advertising', 'advert', 'advertise', 'advertisement' ],
		preview: [],
	},
	restaurantmenu: {
		menu: __( 'Restaurant menu' ),
		title: __( 'Restaurant menu' ),
		slug: 'restaurantmenu',
		tags: [
			'food ordering',
			'restaurant menu',
			'restaurant',
			'cafe menu',
			'food',
			'create menu',
			'restaurant main menu',
		],
		preview: [],
	},
	recipes: {
		menu: __( 'Recipes' ),
		title: __( 'Recipes' ),
		slug: 'recipes',
		tags: [
			'cooking',
			'food',
			'ingredients',
			'recipe',
			'chef',
			'print recipe',
			'recipe box',
			'recipe card',
			'food blog',
		],
		preview: [],
	},
	leadgeneration: {
		menu: __( 'Lead generation' ),
		title: __( 'Lead generation' ),
		slug: 'leadgeneration',
		tags: [ 'lead gen', 'lead generation' ],
		preview: [],
	},
	contest: {
		menu: __( 'Contest' ),
		title: __( 'Contest' ),
		slug: 'contest',
		tags: [ 'contest', 'photo contest', 'contests', 'giveaway' ],
		preview: [],
	},
	accordion: {
		menu: __( 'Accordion' ),
		title: __( 'Accordion' ),
		slug: 'accordion',
		tags: [ 'accordion', 'accordion faq', 'accordions' ],
		preview: [],
	},
	javascript: {
		menu: __( 'Javascript' ),
		title: __( 'Javascript' ),
		slug: 'javascript',
		tags: [ 'javascript', 'js' ],
		preview: [],
	},
	community: {
		menu: __( 'Community' ),
		title: __( 'Community' ),
		slug: 'community',
		tags: [ 'community', 'discussion', 'forum' ],
		preview: [],
	},
	captcha: {
		menu: __( 'Captcha' ),
		title: __( 'Captcha' ),
		slug: 'captcha',
		tags: [ 'captcha', 'invisible captcha', 'nocaptcha', 'CAPTCHA Code', 'anti-spam' ],
		preview: [],
	},
	wpbeginner: {
		menu: __( 'WPBeginner' ),
		title: __( 'Must-have plugins from WPBeginner' ),
		description: __( 'Add the best-loved plugins on WordPress.com.' ),
		slug: 'wpbeginner',
		tags: [ 'wpbeginner', 'Awesome Motive' ],
		preview: [],
		showOnlyActive: true,
	},
} );

function mapSortToApiValue( sort: string ) {
	// Some sorts don't need to be mapped
	if (
		[ 'price_asc', 'price_desc', 'rating_desc', 'active_installs', 'plugin_modified' ].includes(
			sort
		)
	) {
		return sort;
	}

	return SORT_QUERY_MAP.get( sort ) ?? 'score_default';
}

function getFilterbyAuthor( author: string ): {
	bool: {
		must: { term: object }[];
	};
} {
	return {
		bool: {
			must: [ { term: { 'plugin.author.raw': author } } ],
		},
	};
}

function getFilterFeaturedPlugins(): {
	bool: {
		must: { term: object }[];
	};
} {
	return {
		bool: {
			must: [ { term: { 'taxonomy.plugin_section.slug': 'featured' } } ],
		},
	};
}

function getFilterbySlugs( slugs: string[] ): {
	bool: {
		should: { terms: object }[];
	};
} {
	return {
		bool: {
			should: [ { terms: { slug: slugs } } ],
		},
	};
}

function getFilterByCategory( category: string ): {
	bool: object;
} {
	const categoryTags = getCategories()[ category ]?.tags;

	return {
		bool: {
			should: [
				// matching category name from titles
				{ match: { 'plugin.title.en': category } },
				// matching wp.org categories and tags
				{ term: { 'taxonomy.plugin_category.slug': category } },
				{ terms: { 'taxonomy.plugin_tags.slug': categoryTags || [ category ] } },
				// matching wc.com categories and tags
				{ term: { 'taxonomy.wpcom_marketplace_categories.slug': category } },
				{ terms: { 'taxonomy.plugin_tag.slug': categoryTags || [ category ] } },
			],
		},
	};
}

export function generateApiQueryString( {
	query,
	author,
	groupId,
	category,
	pageHandle,
	pageSize,
	locale,
	slugs,
}: SearchParams ) {
	const sort = 'score_default';

	const params: {
		fields: string[];
		filter?: { bool: object };
		page_handle?: string;
		query: string;
		sort: string;
		size: number;
		group_id: string;
		category?: string;
		from?: number;
		lang?: string;
		track_total_hits: boolean;
	} = {
		fields: [ ...RETURNABLE_FIELDS ],
		page_handle: pageHandle,
		query: encodeURIComponent( query ?? '' ),
		sort: mapSortToApiValue( sort ),
		size: pageSize,
		lang: locale,
		group_id: groupId,
		track_total_hits: false,
	};

	if ( author ) {
		params.filter = getFilterbyAuthor( author );
	}
	if ( category ) {
		switch ( category ) {
			case 'featured':
				params.filter = getFilterFeaturedPlugins();
				break;
			case 'popular':
				params.sort = 'active_installs';
				params.track_total_hits = true;
				break;
			case 'new':
				params.sort = 'date_desc';
				break;
			case 'updated':
				params.sort = 'plugin_modified';
				break;
			default:
				if ( Array.isArray( slugs ) && slugs.length ) {
					params.filter = getFilterbySlugs( slugs || [] );
				} else {
					params.filter = getFilterByCategory( category );
				}
				params.sort = 'active_installs';
		}
	}

	return params;
}
