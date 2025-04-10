# Color

This document provides guidance on the technical use of color in Calypso. Please see our documentation on our [Brand Guide](https://dotcombrand.wordpress.com/colors/) for guidance related to general color usage.

## CSS Custom Properties

We use CSS custom properties for all color usage. Unless an edge case requires another solution, you should rely on [theme properties](https://github.com/Automattic/wp-calypso/blob/HEAD/packages/calypso-color-schemes/src/shared/color-schemes/_default.scss).

## Semantic Colors

Our naming is based on function and describes the meaning of the color, not the color name itself. This makes maintenance easier, and keeps the focus on **communication over decoration.**

Under the hood, Calypso relies on color values generated by [Color Studio](https://color-studio.blog). While all [hex](https://github.com/Automattic/color-studio/blob/HEAD/dist/color-properties.css) are included by default, please avoid using them directly in favor of theme properties.

### Theme Properties

All theme variables are prefixed with `--color-`. Their values change depending on an active [dashboard color scheme](#dashboard-color-schemes).

| Variable          | Description                  |
| ----------------- | ---------------------------- |
| `--color-primary` | Primary color                |
| `--color-accent`  | Accent (aka secondary) color |
| `--color-neutral` | Gray color                   |
| `--color-success` | Success status               |
| `--color-warning` | Warning status               |
| `--color-error`   | Error status                 |

The colors above can be suffixed with `-light` or `-dark` to quickly get a variation of the color. They are helper aliases to make picking shades easier (e.g. `--color-primary-light` or `--color-primary-dark`). In the default color scheme, these suffixes correspond to the 30 and 70 value of that color. For example, `--color-primary` points to **Blue 50**, `--color-primary-light` to **Blue 30**, and `--color-primary-dark` to **Blue 70**.

The properties listed above can also be suffixed with the corresponding index number to [Color Studio](https://color-studio.blog) values. If you need a specific value that is not covered by the `light` or `dark` helper aliases, then you can append the specific value number to the end of the variable. For example, you can use `--color-accent-10` or `color-neutral-90` to get a specific shade.

### Additional Properties

We also have a number of properties that help make our color usage consistent, while also making updates easier to maintain.

| Variable                   | Defaults                                   |
| -------------------------- | ------------------------------------------ |
| `--color-text`             | Black text color                           |
| `--color-text-subtle`      | Gray text color                            |
| `--color-text-inverted`    | White text color                           |
| `--color-border`           | Border for UI components                   |
| `--color-border-subtle`    | Less prominent border for cards and layout |
| `--color-border-inverted`  | White border for colored components        |
| `--color-surface`          | White background color                     |
| `--color-surface-backdrop` | Light gray background color                |
| `--color-link`             | Blue hyperlink color                       |

### Translucent Colors

Each theme property can be turned translucent for shadows and fading using [color-mix](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix):

```css
/* Already defined */
--color-primary: var( --studio-blue-50 );

.my-selector {
	border-color: color-mix(in srgb, var( --color-primary ) 50%, transparent );
}
```

### Using Brand Colors

The colors for both internal and external brands have also been defined [in one place](https://github.com/Automattic/wp-calypso/blob/HEAD/packages/calypso-color-schemes/src/shared/color-schemes/_default.scss) for easier maintenance and consistent use. When using a previously unavailable brand color, please add it the theme file and use the property instead of the raw hex value.

Please note that `--color-primary` in the default color scheme is a different shade of blue than WordPress.com’s primary brand color.

## Dashboard Color Schemes

All of the above has been systematized with WordPress.com’s dashboard color schemes in mind. Please test new designs under of all them.

![Color scheme thumbnails](../packages/calypso-color-schemes/screenshot@2x.png)

### Adding a New Scheme

New color schemes overwrite the theme properties defined by the [default theme](https://github.com/Automattic/wp-calypso/blob/HEAD/packages/calypso-color-schemes/src/shared/color-schemes/_default.scss) called Default.

Each color scheme lives in a [separate file](https://github.com/Automattic/wp-calypso/tree/HEAD/packages/calypso-color-schemes/src/shared/color-schemes) and is [referenced](https://github.com/Automattic/wp-calypso/blob/HEAD/packages/calypso-color-schemes/src/calypso-color-schemes.scss) by the `calypso-color-schemes` entry file.
