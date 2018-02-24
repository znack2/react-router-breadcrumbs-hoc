/* eslint-disable react/no-array-index-key */
/* eslint-disable react/jsx-filename-extension */
import React from 'react';
import PropTypes from 'prop-types';
import { mount } from 'enzyme';
import { StaticRouter as Router } from 'react-router';
import { NavLink } from 'react-router-dom';
import { getBreadcrumbs, withBreadcrumbs } from './index';

const setRoute = pathname => ({
  context: {},
  location: { pathname },
});

const components = {
  Breadcrumbs: ({ breadcrumbs }) => (
    <div className="breadcrumbs-container">
      {breadcrumbs.map(({ breadcrumb, path }) => (
        <span key={path}>{breadcrumb}</span>
      ))}
    </div>
  ),
  BreadcrumbMatchTest: ({ match }) => <span>{match.params.number}</span>,
  BreadcrumbNavLinkTest: ({ match }) => <NavLink to={match.url}>Link</NavLink>,
};

const render = ({ pathname, routes }) => {
  const Breadcrumbs = withBreadcrumbs(routes)(components.Breadcrumbs);
  const wrapper = mount(<Router {...setRoute(pathname)}><Breadcrumbs /></Router>);

  return {
    Breadcrumbs: wrapper.find('.breadcrumbs-container'),
    wrapper,
  };
};

const matchShape = {
  isExact: PropTypes.bool.isRequired,
  params: PropTypes.shape().isRequired,
  path: PropTypes.string.isRequired,
  url: PropTypes.string.isRequired,
};

components.Breadcrumbs.propTypes = {
  breadcrumbs: PropTypes.arrayOf(PropTypes.shape({
    match: PropTypes.shape(matchShape).isRequired,
    path: PropTypes.string.isRequired,
  })).isRequired,
};

components.BreadcrumbMatchTest.propTypes = {
  match: PropTypes.shape(matchShape).isRequired,
};

components.BreadcrumbNavLinkTest.propTypes = {
  match: PropTypes.shape(matchShape).isRequired,
};

describe('react-router-breadcrumbs-hoc', () => {
  describe('Valid routes', () => {
    it('Should render breadcrumb components as expected', () => {
      const routes = [
        // test home route
        { path: '/', breadcrumb: 'Home' },
        // test breadcrumb passed as string
        { path: '/1', breadcrumb: '1' },
        // test simple breadcrumb component
        { path: '/1/2', breadcrumb: () => <span>TWO</span> },
        // test advanced breadcrumb component (user can use `match` however they wish)
        { path: '/1/2/:number', breadcrumb: components.BreadcrumbMatchTest },
        // test NavLink wrapped breadcrumb
        { path: '/1/2/:number/4', breadcrumb: components.BreadcrumbNavLinkTest },
        // test a no-match route
        { path: '/no-match', breadcrumb: 'no match' },
      ];
      const { Breadcrumbs } = render({ pathname: '/1/2/3/4', routes });
      expect(Breadcrumbs).toMatchSnapshot();
    });
  });

  describe('Custom match options', () => {
    it('Should allow `strict` rule', () => {
      const routes = [
        {
          path: '/one/',
          breadcrumb: '1',
          // not recommended, but supported
          matchOptions: { exact: false, strict: true },
        },
      ];
      const { Breadcrumbs } = render({ pathname: '/one', routes });
      expect(Breadcrumbs).toMatchSnapshot();
    });
  });

  describe('When extending react-router config', () => {
    it('Should render expected breadcrumbs with sensible defaults', () => {
      const routes = [
        { path: '/one', breadcrumb: 'one-breadcrumb' },
        { path: '/two' },
      ];
      const { Breadcrumbs } = render({ pathname: '/one/two', routes });
      expect(Breadcrumbs).toMatchSnapshot();
    });
  });

  describe('Defaults', () => {
    describe('No routes array', () => {
      it('Should automatically render breadcrumbs with default strings', () => {
        const { Breadcrumbs } = render({ pathname: '/one/two' });
        expect(Breadcrumbs).toMatchSnapshot();
      });
    });

    describe('Override defaults', () => {
      it('Should render user-provided breadcrumbs where possible and use defaults otherwise', () => {
        const routes = [{ path: '/one', breadcrumb: 'Override' }];
        const { Breadcrumbs } = render({ pathname: '/one/two', routes });
        expect(Breadcrumbs).toMatchSnapshot();
      });
    });

    describe('No breadcrumb', () => {
      it('Should be possible to NOT render a breadcrumb', () => {
        const routes = [{ path: '/one', breadcrumb: null }];
        const { Breadcrumbs } = render({ pathname: '/one/two', routes });
        expect(Breadcrumbs).toMatchSnapshot();
      });
    });
  });

  describe('Invalid route object', () => {
    it('Should error if `path` is not provided', () => {
      expect(() => getBreadcrumbs({ routes: [{ breadcrumb: 'Yo' }], location: { pathname: '/1' } }))
        .toThrow('withBreadcrumbs: `path` must be provided in every route object');
    });
  });
});
