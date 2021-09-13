// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  pwa: false,
  version:'dev',
  auth:{
    app:'BI_TOOL',
    public:"Client6JJ91!)IBwPF*_1$_CXmSiteK@y",
    key:'be410fea41df7162a679875ec131cf2c',
    hash:'mmIYbDlb6JJ91!)IBwPF*_1$_CXmFXZO',
    tokenizer_splitter:"@M2YmJlOC1iMjZjL23TExZTgtOGUwZC0MjQyYW"
  },
  api:{
    endpoint:'http://localhost/',
    version:'v1/'
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
