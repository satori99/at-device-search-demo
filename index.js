import router from './routes.js'



document.addEventListener( 'DOMContentLoaded', async () => {

  window.appData = await fetch( 'devices.json' ).then( res => {
    if ( ! res.ok ) throw new Error( 'Failed to fetch JSON data' )
    return res.json()
  } )

  document.body.addEventListener( 'click', e => {
    if ( e.target.matches( '[href][data-link]' ) ) {
      e.preventDefault()
      history.pushState( null, null, e.target.href )
      router()
    }
  } )

  window.addEventListener( 'popstate', router )

  await router()

  console.info( 'ready' )

} )