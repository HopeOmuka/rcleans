/* Type-only override for react-native-theme-transition.
 *
 * The package's `react-native` export condition surfaces its raw TS sources,
 * which target RN >= 0.83 (Appearance returns `"unspecified"` there). This
 * app runs RN 0.81, so pointing the compiler at the published .d.ts keeps
 * type-checking clean without touching node_modules. */
export * from "../node_modules/react-native-theme-transition/dist/index";