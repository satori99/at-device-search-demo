
export class View {

  constructor ( template, title, router ) {

      this.template = template

      console.assert( this.template )

      document.title = title

      this.router = router

   }

  async getHtml () {

    return this.template.content.cloneNode( true )

  }

}

export class HomeView extends View {

  constructor ( router ) {

    super(
        document.querySelector( '#homepage-template' ),
        'Accessible Telecoms Device Search',
        router
        )

  }

  initKeywordSearch ( node ) {

    const keywordSearchForm = node.querySelector( '#keyword-search' )
    const keywordSearchText = node.querySelector( 'input[type="search"]' )
    const keywordDataList   = node.querySelector( 'datalist' )

    keywordSearchText.oninput = e => {

        e.preventDefault()

    }

    keywordSearchForm.onsubmit = e => {

      console.log( 'keyword search submit' )
      const text = keywordSearchText.value.trim()
      const keywords = text.toLowerCase().split( /,| / ).filter( s => s.length )
      const devices = appData.devices
        .map( device => {

          const typeAlias = appData.metadata.type.find( t => t.id === device.type )?.alias

          return {
            id: device.id,
            name: device.name.toLowerCase(),
            type: typeAlias,
            alias: device.alias,
            image: device.image
          }
        } )
        //.map( device => device.name.toLowerCase() )

        .filter( device => keywords.some( kw => device.name.includes( kw ) ) )

      console.log( 'matched devices:', devices.length )

      history.pushState( { keywords, devices }, null, '#/keyword-search' )

      this.router()
    }

  }

  async getHtml () {

    const node = await super.getHtml()

    this.initKeywordSearch( node )

    return node

  }

}

export class KeywordSearchView extends View {

  constructor ( router ) {

    super(
        document.querySelector( '#keyword-search-result-template' ),
        'Accessible Telecoms Keyword Device Search',
        router
        )

  }

  async getHtml () {

    const node = await super.getHtml()

    const hasResults = history.state.devices.length !== 0

    node.querySelector( '#keywords' ).textContent = history.state.keywords.join( ' ' )

    node.querySelector( 'input[name="keywords"]' ).value = history.state.keywords.join( ' ' )

    node.querySelector( '#search-results' ).hidden = ! hasResults

    node.querySelector( '#no-results' ).hidden = hasResults

    const resultList = node.querySelector( '#search-results ul' )

    const fragment = document.createDocumentFragment()

    const template = document.querySelector( '#keyword-search-item-template' )

    history.state.devices.forEach( device => {

      console.log( device )

      const item = template.content.cloneNode( true )

      item.querySelector( 'a' ).href = `#/device/${device.type}/${device.alias}`

      item.querySelector( 'img' ).src = `https://accessibletelecoms.org.au${device.image}`
      item.querySelector( 'img' ).alt = `${device.name} image`

      item.querySelector( '.device-name' ).textContent = device.name

      fragment.appendChild( item )

    } )

    resultList.replaceChildren( fragment )

    return node


  }

}

export class DeviceDetailsView extends View {

  constructor ( router ) {

    super(
        document.querySelector( '#device-details-template' ),
        'Accessible Telecoms Device Details',
        router
        )

  }

  async getHtml () {

    const node = await super.getHtml()

    const hash = location.hash.substring( 1 )

    const { typeAlias, deviceAlias } = /^\/device\/(?<typeAlias>.*)\/(?<deviceAlias>.*)/.exec( hash ).groups

    //console.debug( 'typeAlias', typeAlias )
    //console.debug( 'deviceAlias', deviceAlias )

    const type = appData.metadata.type.find( t => t.alias === typeAlias )

    //console.debug( 'type', type )

    const device = appData.devices.find( d => d.alias === deviceAlias )

    if ( ! type || ! device ) {
      console.warn( 'invalid device type/alias' )
      history.pushState( null, null, '/' )
      this.router()
    }



   // console.debug( 'device:', device )

    node.querySelector( 'h1' ).textContent = device.name
    node.querySelector( '[class="device-type-name"]' ).textContent = type.name
    
    
    console.debug( device.image )
    
    node.querySelector( 'img' ).src = `https://accessibletelecoms.org.au${device.image}`

    // add details

    const detailFrag = document.createDocumentFragment()
    Object.entries( device.detail ).forEach( detail => {
      const item = document.createElement( 'li' )
      item.textContent = `${detail[0]}: ${detail[1]}`
      detailFrag.appendChild( item )
    } )
    node.querySelector( '[class="device-details"]' ).appendChild( detailFrag )

    // add features

    const featureGroups = Array.from( new Set( device.feature
        .map( id => appData.metadata.feature[ id ].groups )
        .flat() ) )
        .sort( ( a, b ) => a - b )
        .map( id => appData.metadata.group.find( g => g.id === id ) )

    const featureFragment = document.createDocumentFragment()
    featureGroups.forEach( group => {

      const groupItem = document.createElement( 'li' )

      const groupTitle = document.createElement( 'h3' )

      groupTitle.textContent = group.name

      groupItem.appendChild( groupTitle )

      const featureList = document.createElement( 'ul' )

      const groupFeatures = device.feature.filter( fid => {
        const feature = appData.metadata.feature.find( f => f.id === fid )
        return feature.groups.includes( group.id )
      } ).map( id => appData.metadata.feature.find( f => f.id === id ) )

      //console.debug( 'groupFeatures', group.name, groupFeatures )

      groupFeatures.forEach( feature => {
        const featureItem = document.createElement( 'li' )
        featureItem.textContent = feature.name
        featureList.appendChild( featureItem )
      } )
      groupItem.appendChild( featureList )

      featureFragment.appendChild( groupItem )

    } )
    node.querySelector( '[class="device-features"]' ).appendChild( featureFragment )

    // add retail

    const retailFrag = document.createDocumentFragment()

    retailFrag.appendChild( new Text( 'You can buy this phone from' ) )

    Object.entries( device.retail ).forEach( ( [ name, value ] ) => {
      const link = document.createElement( 'a' )
      link.href = value
      link.title = name
      link.textContent = name
      retailFrag.appendChild( link )
    } )
        
    retailFrag.appendChild( new Text( 'and other retailers' ) )

    node.querySelector( '[class="retail"]' ).appendChild( retailFrag )

    // add info links

    const linkFrag = document.createDocumentFragment()
    
    Object.entries( device.link ).forEach( ( [ name, value ] ) => {
      const item = document.createElement( 'p' )
      const link = document.createElement( 'a' )
      link.href = value
      link.title = name
      link.textContent = name
      item.appendChild( link )
      linkFrag.appendChild( item )
      
    } )
    
    node.querySelector( '[class="links"]' ).appendChild( linkFrag )

    return node

  }


}