import { createElement } from 'react';
import { matchPath, withRouter } from 'react-router';
import humanizeString from 'humanize-string';

const DEFAULT_MATCH_OPTIONS = { exact: true };
const NO_BREADCRUMB = 'NO_BREADCRUMB';

// if user is passing a function (component) as a breadcrumb, make sure we
// pass the match object into it. Else just return the string.
const renderer = ({ breadcrumb, match, location }) => {
  if (typeof breadcrumb === 'function') {
    return createElement(breadcrumb, { match, location });
  }
  return breadcrumb;
};

const getDefaultBreadcrumb = ({ pathSection, currentSection }) => {
  const match = matchPath(pathSection, { ...DEFAULT_MATCH_OPTIONS, path: pathSection });

  return {
    breadcrumb: renderer({
      breadcrumb: humanizeString(currentSection),
      match,
    }),
    path: pathSection,
    match,
  };
};

export const getBreadcrumbs = ({ routes, location }) => {
  const matches = [];
  const { pathname } = location;

  pathname
    // split pathname into sections
    .split('/')
    // reduce over the sections and find matches from `routes` prop
    .reduce((previousSection, currentSection) => {
      // combine the last route section with the currentSection
      // ex `pathname = /1/2/3 results in match checks for
      // `/1`, `/1/2`, `/1/2/3`
      const pathSection = !currentSection ? '/' : `${previousSection}/${currentSection}`;

      let breadcrumbMatch;

      routes.some(({ breadcrumb: userProvidedBreadcrumb, matchOptions, path }) => {
        if (!path) {
          throw new Error('withBreadcrumbs: `path` must be provided in every route object');
        }

        const match = matchPath(pathSection, { ...(matchOptions || DEFAULT_MATCH_OPTIONS), path });

        if ((userProvidedBreadcrumb === null && match) || (!match && matchOptions)) {
          // if user passed breadcrumb: null OR custom match options to suppress a breadcrumb
          // we need to know not to add it to the matches array below
          breadcrumbMatch = NO_BREADCRUMB;
          return true;
        }
        const breadcrumb = userProvidedBreadcrumb || humanizeString(pathSection);

        // if a route match is found ^ break out of the loop with a rendered breadcumb
        // and match object to add to the `matches` array
        if (match) {
          breadcrumbMatch = {
            breadcrumb: renderer({ breadcrumb, match, location }),
            path,
            match,
          };
          return true;
        }

        return false;
      });

      if (currentSection.length && breadcrumbMatch !== NO_BREADCRUMB) {
        if (breadcrumbMatch) {
          matches.push(breadcrumbMatch);
        } else {
          matches.push(getDefaultBreadcrumb({
            pathSection,
            currentSection,
          }));
        }
      }

      return pathSection === '/' ? '' : pathSection;
    }, null);

  return matches;
};

export const withBreadcrumbs = (routes = []) => Component => withRouter(props =>
  createElement(Component, {
    ...props,
    breadcrumbs: getBreadcrumbs({
      routes,
      location: props.location,
    }),
  }));
