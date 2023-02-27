import { HomeView, KeywordSearchView, DeviceDetailsView } from './views.js'

const routes = [
  {
    id: 'home',
    path: '/',
    view: HomeView,
    requiresState: false,
  },
  {
    id: 'keyword-search',
    path: '/keyword-search',
    view: KeywordSearchView,
    requiresState: true,
  },
  {
    id: 'device-details',
    path: /^\/device\/(?<type>.*)\/(?<alias>.*)/,
    view: DeviceDetailsView,
    requiresState: false,
  },
]

const router = async () => {

  // get route path from location hash
  const path = location.hash.substring( 1 ) || '/'
  console.log( 'route path:', path, location )

  // find a matching route
  let route = routes.find( route => {
    if ( route.path instanceof RegExp ) {
      const groups = route.path.exec( path )?.groups
      if ( groups )
        return Object.assign( {}, route, groups )
    } else if ( route.path === path ) {
      return route
    }
  } )

  // validate route
  if ( ! route
      || ( route.requiresState && ! history.state ) ) {
    console.warn( 'invalid route' )
    history.replaceState( {}, null, '/' )
    route = routes[ 0 ]
  }

  console.debug( 'creating route view:', route )
  const view = new route.view( router )
  const content = document.querySelector( 'body > main > .container' )
  content.replaceChildren( await view.getHtml() )

}

export default router

//