# CSS/Sass Coding Guidelines

## Principles

We're transitioning to a component-based design system. When styling, adhere to the following principles:

 - Rely on the Design System components (@wordpress/components, @automattic/components and other packages), props and variants as much as possible.
 - If a design to be implemented doesn't match the existing components, discuss with the design team to see if the design should be adapted.
 - Consider whether the design system components need to be adapted/modified to accommodate the proposed designs.
 - Avoid writing custom CSS/Sass unless absolutely necessary.
 - If you do need to write custom CSS/Sass, follow the guidelines outlined on this document.

For all questions related to the design system, available components or design considerations, consider asking in #components or #design-system Slack channels.

## Introduction

Every stylesheet should be easy to read, scan, add to, and collaborate on. Our current system and nomenclature builds on top of _components_, where CSS files live alongside the component they are styling: `component/style.scss`. These files are all imported into the React components' JavaScript sources and then bundled by webpack to the production CSS files.

This is an example of a declaration:

`.component__element.is-modifier {}`

Two important considerations:

- The `component` fragment matches the folder name of the React component it's providing styles to.
- The `.is-modifier` class should never be written on its own outside of the component class. This avoids naming collisions and provides a consistent use of modifiers.
- We don't use `#ids` for style purposes.

## Example

Take a component called `site/index.jsx` that renders a site item on the picker. Imagine we are going to set the color for the site title to #333 and change it to #444 when the site is a Jetpack site. Our Sass file will sit alongside `site/index.jsx` and be called `site/style.scss`. Its content will be written like:

**Good**

```scss
.site__title {
	color: #333;

	&.is-jetpack {
		color: #444;
	}
}
```

**Bad**

```scss
.site {
	.title {
		color: #333;

		.jetpack {
			color: #444;
		}
	}
}
```

The modifier classes are always attached to a base element (the wrapper of a component). Since every element will have a direct class to be selected with, we avoid descendant selectors and child selectors. We also avoid indenting selectors in Sass files in favor of single selectors. The main exceptions are precisely the `is-modifier` class, and the cases where the context needs to change a given component's accidents.

```scss
// Modify 'site__title' for in CurrentSite component's display
.current-site .site__title {
	color: #444;
}
```

The expressiveness of the selector above clearly conveys that there are two separate components involved (CurrentSite and Site). We also keep CSS specificity in check. Avoid using Sass indents for simple selectors — they obfuscate the cascade.

It's important to note that we don't reuse classes, we reuse components.

## Components

These practices mean that a component will work anywhere it is included by default, and that the developer won't need to go hunting for the relevant CSS. Any modifications will happen in the context/parents, and will be minimal in nature. Where and how changes will affect the rendering of the app will thus be clearer. (If you edit the button-component's Sass file you know you are editing it for everyone.)

## General Syntax and Writing Rules

Apart from the above structure, please adhere to these guidelines:

- We use [Stylelint](https://stylelint.io/) to enforce a consistent code style. You can check for style lints by running `yarn lint:css`. Please see [IDE setup](#ide-setup-auto-formatting) section for more details.
- Follow the [WordPress CSS Coding Standards](https://make.wordpress.org/core/handbook/coding-standards/css/), unless it contradicts something stated in this document.
- Avoid `#` selectors for style purposes. Their specificity becomes troublesome to manage fairly quickly.
- Don't use the `!important` declaration. If you think you need to do it, consider fixing the root cause.
- Avoid using universal selectors (`*`).
- Use hyphens, not underscores or camelCase, when naming things like IDs, classes, variable names, mixins, placeholders. Good: `.site-title`, Bad: `.siteTitle` or `.site_title`.
- The only exception is the `__` syntax to signal the relationship within a component.
- Avoid using over-qualified selectors like `div.my-class`.

## IDE setup (auto-formatting)

In order to enable auto formatting of style files, please set up your IDE.

### VS Code

To get things set up in VS Code, do the following:

- Run `yarn install`
- Install the official Stylelint extension - [`stylelint.vscode-stylelint`](https://marketplace.visualstudio.com/items?itemName=stylelint.vscode-stylelint)
- Adjust the following settings in `settings.json` - (`Cmd + Shift + P` > `Preferences: Open Settings (JSON))`:

```jsonc
{
	"stylelint.validate": [ "css", "scss", "sass" ],
	"[css][scss][sass]": {
		"editor.formatOnSave": false,
		"editor.defaultFormatter": "stylelint.vscode-stylelint"
	},
	"editor.codeActionsOnSave": {
		"source.fixAll.stylelint": true
		// other actions go here
	}
}
```

- Reload VS Code: `Cmd + Shift + P` > `Developer: Reload Window`
- Open a Sass file e.g. `client/me/security-2fa-initial-setup/style.scss`
- Mess up the formatting (e.g. use spaces for indentation.)
- Save the file and verify the problems are fixed.

## Classes

Classes are the fundamental building block of our stylesheets. Using them appropriately and consistently is important to keep a maintainable and enjoyable codebase.

- Generic class names are deemphasized in favor of component-based structures. Instead of defining generic classes in a shared stylesheet, we construct components that come with both markup and styles ready to be used.
- Choose semantic class names based on hierarchy and content, not on positioning or visual appearance. (Example: `.site__meta-info`, instead of `.site-menu-small` or `.site-top-section`).
- Avoid redundant bits of information that are provided by the HTML element or other contexts. (Don't do `.site__content-box` on a `div`, the `box` is not necessary.)
- We keep one level of prefix for single components present in the class name: `.site__title` instead of `.site .title`. This may seem verbose but it provides more flexibility, clear direct selectors, and immediate recognizability of its role in a large codebase like Calypso. Classes are not just for style purposes, they should provide meaning to the reader parsing the document.
- Keep class names lean and to the point. Name classes the same way you would describe what the content of an element is to a stranger.

## The DRY principle

Calypso already provides helpers for many common solutions. Please, use them! We are transitioning towards a component-based structure where each React component will have its own stylesheet. However, there will be a few files that are by its nature shared resources across all components. (Colors, typography, some mixins, etc.)

- Don't use custom colors, always utilize what `@wordpress/base-styles` provides. If you have to set a color, use lowercase hex values, and shorten them to their smallest expression (like `#aaa`).
- Render icons using `@wordpress/icons`. As a fallback, you can also use `<Gridicon>`.
- Calypso runs Sass with autoprefixer, that means you DON'T need to directly use vendor specific properties.

## Sass Guidelines

Currently, all component based Sass files are imported into the respective JavaScript sources (using `import './style.scss'` statements). They are compiled by webpack as part of the bundling process into CSS chunks that are then loaded into the browser at runtime. Remember that all styles, even when loaded at different times, eventually end up on one page as part of a single HTML document. Make sure you namespace your styles for the page you are working on.

Under the hood, we are using webpack and its `sass-loader`, for compiling the styles with `node-sass` (a C++ implementation of the Sass compiler which is working on parity with the reference Ruby implementation) and `mini-css-extract-plugin`, for creating the CSS chunks to be loaded as `<style>` tags into the browser.

## Media Queries

To avoid code bloat and have a more consistent experience we use the same breakpoints in all SCSS files whenever possible. DO NOT define your own media queries. We should use the `break-*` mixins from [Gutenberg](https://github.com/WordPress/gutenberg/blob/0f1f5e75408705f0ec014f5d2ea3d9fcc8a97817/packages/base-styles/_mixins.scss). For example:

```scss
@import "@wordpress/base-styles/breakpoints";
@import "@wordpress/base-styles/mixins";

.class-name {
	margin-bottom: 8px;
	padding: 12px;

	@include break-mobile {
		margin-bottom: 16px;
		padding: 24px;
	}
}
```

Furthermore, we are pushing for a mobile-first approach to media queries, meaning your default styles should apply to mobile, and desktop should build on top of that. You should avoid the use of max width breakpoints.

The old `breakpoint-deprecated` mixin should be replaced with Gutenberg's `break-*` mixins.

### Adding a new Sass file

If you are adding a new Sass file (global or component-specific), you need to import it in some JavaScript source file. Try to avoid creating global styles and favor of styling particular components. JS and CSS code is async-loaded just in time when a particular section or an async-loaded React component is loaded.

### Imports

- DO declare all of your `@import` dependencies at the top of a file that needs it/them.
- DON'T `@import` dependencies in a global file and just hope it filters down to your partial.

### Nesting

- DON'T nest selectors in general. Exceptions are `:hover`/`:focus`/`::before`/`.is-modifier`, and alike.
- DO attempt to keep nesting to 2 levels deep at most.
- DO list items inside a selector in the following order (not all will necessarily be present):
  1. `@extend`(s).
  2. property list for the element.
  3. mixin(s).
  4. nested selectors, with a space above each to keep them visually distinct.

Example of the above:

```scss
.parent {
	@extend %awesomeness;
	border: 1px solid;
	font-size: 2em;
	@include moar-awesome( true );

	&::before {
		// and so on
	}
}
```

### Mixins vs Extends

- DO use `@extend` when in doubt, using the `%placeholder` syntax. This will produce leaner output.
- DON'T use mixins for anything that doesn't accept an argument. This is `@extend` territory.
- DO read [this article](https://kirillibrahim.medium.com/sass-mixin-vs-extend-ac4dfb9892c4) if you don't understand `@extend`.

### Comments

- DO make generous use of comments to explain the whys of what you are doing.
- DO use `// Comments` rather than `/* comments */`. Multiline comments should be written like this:

```scss
// This is a comment
// in two lines
```

Add as much comments as needed to your Sass file, especially around clever code.

### Indents

- DO use tabs for indents.

## Right-To-Left (RTL)

We're using [RTLCSS](https://github.com/MohammadYounes/rtlcss) to convert `public/style.css` to rtl. This happens automatically during `yarn run build-css`.

- If your css code refers to a filename with ‘left’ or ‘right’ in it, for example background: `url(arrow-left.png)`: the RTL version will reference a different file, e.g. `background: url(arrow-right.png)`. Please make sure that file exists.
- Same goes for ‘ltr’ and ‘rtl’ in it, for example background: url(icons-ltr.png): the RTL version will link to the other direction, e.g `background: url(icons-ltr.png)`. Please make sure that file exists.
- If a part of the css needs to remain the same in the ltr version, mark it with a comment like this:

```scss
/*rtl:ignore*/
div.alignright {
	float: right;
	clear: right;
	margin: 0.5em 0 0.8em 1.4em;
}
/*rtl:ignore*/
input.email {
	direction: ltr;
}
```

If you need custom RTL css code, add it to your stylesheet with a .rtl class prefix, and the rtl ignore comment mentioned above. For example:

```scss
/*rtl:ignore*/
.rtl div.onlyinrtl {
	font-family: Tahoma;
}
```

Note for either of the above that because of the SCSS build process, if you're nesting things then you might need to place the rtlignore comment inside the value, with Sass interpolation syntax

```scss
.rtl {
	.onlyinrtl {
		margin-right: 5px #{"/*rtl:ignore*/"};
	}
}
```

You can also define specific values for RTL like so:

```scss
.class {
	margin-right: 5px #{"/*rtl:2px*/"};
}
```

You can find more details in the [RTLCSS documentation](https://github.com/MohammadYounes/rtlcss/blob/HEAD/README.md).

## Positioning

When defining positioning properties, indent the top/right/bottom/left one level below the position declaration for improved readability:

```css
selector {
	position: absolute;
	left: 0;
	top: 20px;
}
```

## Spacing

- DO NOT use spaces around parenthesis

```scss
@include breakpoint-deprecated(">480px") {
	color: rgb(0, 0, 0);
	transform: translate(-50%, -50%) scale(1);
}
```

- DO [remove trailing whitespace](trailing-whitespace.md)

## Z-Index

When adding z-indexes use our scss z-index function. This means you'll need to
add another entry to the `$z-layers` variable in
`assets/stylesheets/shared/functions/_z-index.scss`.

Because browsers support a hierarchy of stacking contexts rather than a single
global one, we use a tree with two levels of keys. The first is the name of the
parent stacking context, and the latter is the selector for the stacking
context you've just created. We keep each level of the tree sorted by z-index
so we can quickly compare z-index values within a given stacking context.

An element creates a new stacking context when any of the following are true:

1. It's the root element (`html`)
2. Has a position other than `static`, with a `z-index` value
3. Has one of the following CSS properties: (`transform`, `opacity` < 1,
   `mix-blend-mode`, `filter`)
4. Has `position: fixed`
5. Has `isolation: isolate`
6. Has `-webkit-overflow-scrolling: touch`

So, to add a new z-index:

1. You'll want to make sure the element actually creates a stacking context
2. Look up its parent stacking context
3. Put the new rule in the `$z-layers` tree, using the selector of the parent
   stacking context as the initial key and the element's full CSS selector as
   the final key.

You can use this handy Chrome
[extension](https://chrome.google.com/webstore/detail/z-context/jigamimbjojkdgnlldajknogfgncplbh)
to find the stacking contexts of both the element and its parent.

As a simple example, imagine that we have a page with the following markup:

```html
<div class="masterbar"></div>
<div class="modal">
	<div class="modal__icon"></div>
	<div class="modal__content"></div>
	<div class="modal__header"></div>
</div>
```

With CSS of:

```css
div {
	position: relative;
}
.masterbar {
	z-index: 2;
}
.modal {
	z-index: 1;
}
.modal__icon {
	z-index: 100;
}
.modal__content {
	z-index: 300;
}
.modal__header {
	z-index: 200;
}
```

Each `div` in this case creates a stacking context, with the render order
summarized as:

```
1.0 .modal
1.100 .modal__icon
1.200 .modal__header
1.300 .modal__content
2.0 .masterbar
```

In this case icon, header, and content can never be rendered above the
masterbar because it is contained within the modal stacking context, which has
a lower value than the masterbar.

With this in mind our `$z-layers` might look like the following, with z-index
values sorted from lowest to highest within a stacking context:

```scss
$z-layers: (
	"root": (
		".modal": 1,
		".masterbar": 2,
	),
	".modal": (
		".modal__icon": 100,
		".modal__header": 200,
		".modal__content": 300,
	),
);
```

```scss
.modal__icon {
	z-index: z-index(".modal", ".modal__icon"); // returns 100
}
```

While we can support a map with more than 2 layers, there isn't much benefit to doing
this. Stacking of children are completely resolved within their parent context. So in
our example the stacking of `.modal__icon`, `.modal__header`, and `.modal__content` are
completely resolved within `.modal`. Once this is done the entire `.modal` element is
passed for stacking in the root element, with it's sibling `.masterbar`.

For further reading on stacking contexts see:

- [https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Positioning/Understanding_z_index/The_stacking_context](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Positioning/Understanding_z_index/The_stacking_context)
- [Appendix E. Elaborate description of Stacking Contexts](http://www.w3.org/TR/CSS2/zindex.html)
