## Custom Fonts Setup

This app uses Montserrat (via Google Fonts) and Neue Haas Grotesk Display (local files).

### Montserrat (Google Fonts)

Already wired in `src/app/_layout.tsx` using Expo Fonts. Available PostScript names:

- `Montserrat-Regular`
- `Montserrat-Medium`
- `Montserrat-SemiBold`
- `Montserrat-Bold`
- `Montserrat-Black`

These are mapped in Tailwind as part of the `sans` and `heading` stacks.

### Neue Haas Grotesk Display (local)

1) Place font files here:

```
src/assets/fonts/
  NeueHaasDisplay-Light.ttf     (or .otf)
  NeueHaasDisplay-Regular.ttf
  NeueHaasDisplay-Medium.ttf
  NeueHaasDisplay-Bold.ttf
```

2) Load them in `src/app/_layout.tsx` by adding to the `useFonts` map. Example:

```ts
const [fontsLoaded] = useFonts({
  'NeueHaasDisplay': require('../assets/fonts/NeueHaasDisplay-Regular.ttf'),
  'NeueHaasDisplay-Medium': require('../assets/fonts/NeueHaasDisplay-Medium.ttf'),
  'NeueHaasDisplay-Bold': require('../assets/fonts/NeueHaasDisplay-Bold.ttf'),
});
```

3) Confirm Tailwind stacks

`tailwind.config.js` already prefers `NeueHaasDisplay` for headings and includes Montserrat as fallback:

```js
theme: {
  extend: {
    fontFamily: {
      heading: [
        'NeueHaasDisplay',
        'Montserrat-SemiBold',
        'Montserrat',
        'Inter',
        'system-ui',
        // ...
      ],
      sans: [
        'NeueHaasDisplay',
        'Montserrat-Regular',
        'Montserrat',
        'Inter',
        'system-ui',
        // ...
      ],
    }
  }
}
```

4) Use in components

- Tailwind: `className="font-heading"` or `className="font-body"` (from `src/global.css`).
- React Native style: `style={{ fontFamily: 'NeueHaasDisplay' }}` or `style={{ fontFamily: 'Montserrat-Bold' }}`.

5) Bundling

When local fonts are required in code (via `require(...)`), Expo bundles them automatically. No extra config is necessary.


