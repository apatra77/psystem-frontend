/**
 * Back-compat alias. `ROUTES` in ./routes.js is the source of truth;
 * modules written against `PATHS` keep working without a sweeping rename.
 */
export { ROUTES as PATHS, ROUTES, buildPath } from './routes'
export { ROUTES as default } from './routes'
