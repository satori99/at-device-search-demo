
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

  initFeatureSearch ( node ) {

    const featureSearchForm = node.querySelector( '#feature-search' )

    const deviceTypes = node.querySelector( '#device-types' )

    const deviceTypeTemplate = document.querySelector( '#device-type-selection-template' )

    const typesFragment = document.createDocumentFragment()

    for ( const type of appData.metadata.type ) {

      const item = deviceTypeTemplate.content.cloneNode( true )

      const input = item.querySelector( 'input' )
      input.value = type.alias
      input.id = type.alias

      const label = item.querySelector( 'label' )
      label.textContent = type.name
      label.htmlFor = type.alias

      typesFragment.appendChild( item )

    }

    deviceTypes.replaceChildren( typesFragment )

    ////

    const featureGroups = node.querySelector( '#feature-groups' )

    const featureGroupTemplate = document.querySelector( '#feature-group-template' )

    const featureItemTemplate = document.querySelector( '#feature-item-template' )

    const groupsFragment = document.createDocumentFragment()

    for ( const group of appData.metadata.group ) {

      const groupItem = featureGroupTemplate.content.cloneNode( true )

      const summary = groupItem.querySelector( 'summary' )

      const list = groupItem.querySelector( 'ul' )

      summary.textContent = group.name

      for ( const feature of appData.metadata.feature ) {
        const featureItem = featureItemTemplate.content.cloneNode( true )
        const input = featureItem.querySelector( 'input' )
        const label = featureItem.querySelector( 'label' )
        const id = `feature-${group.id}-${feature.id}`
        input.id = id
        label.htmlFor = id
        input.value = feature.id
        featureItem.querySelector( '.feature-title' ).textContent = feature.name
        featureItem.querySelector( '.feature-text' ).textContent = feature.description
        list.appendChild( featureItem )
      }

      groupsFragment.appendChild( groupItem )

    }

    featureGroups.replaceChildren( groupsFragment )

    ////

    featureSearchForm.onsubmit = e => {

      const formData = new FormData( featureSearchForm )

      const deviceType = formData.get( 'device-type' )

      const deviceFeatures = formData.getAll( 'device-feature' ).map( s => parseInt( s, 10 ) )

      //console.log( 'deviceType:', deviceType )

      //console.log( 'deviceFeatures:', deviceFeatures )

      const matchedDevices = appData.devices
        .map( device => {
          const typeAlias = appData.metadata.type.find( t => t.id === device.type )?.alias
          return {
            id: device.id,
            name: device.name.toLowerCase(),
            type: typeAlias,
            alias: device.alias,
            image: device.image,
            feature: device.feature
          }
        } )
        .filter( device => {
          return device.type === deviceType
              && deviceFeatures.some( id => device.feature.includes( id ) )
        } )

      console.log( 'matched devices:', matchedDevices.length )

      history.pushState( {
        type: deviceType,
        fetures: deviceFeatures,
        devices: matchedDevices
      }, null, '#/feature-search' )

      this.router()

    }

  }

  async getHtml () {

    const node = await super.getHtml()

    this.initKeywordSearch( node )

    this.initFeatureSearch( node )

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

      //console.log( device )

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

export class FeatureSearchView extends View {

  constructor ( router ) {

    super(
        document.querySelector( '#feature-search-result-template' ),
        'Accessible Telecoms Device Feature Search',
        router
        )

  }

  async getHtml () {

    const node = await super.getHtml()

    const hasResults = history.state.devices.length > 0

    if ( ! hasResults ) {

      console.warn( 'TODO: no matches' )

    } else {

      const resultCount = node.querySelector( '.result-count' )

      resultCount.textContent = history.state.devices.length

      const resultList = node.querySelector( '#search-results ul' )

      const fragment = document.createDocumentFragment()

      const template = document.querySelector( '#feature-search-item-template' )

      history.state.devices.forEach( device => {

        console.debug( device.name )

        const item = template.content.cloneNode( true )


        item.querySelector( 'a' ).href = `#/device/${device.type}/${device.alias}`
        item.querySelector( 'img' ).src = `https://accessibletelecoms.org.au${device.image}`
        item.querySelector( 'img' ).alt = `${device.name} image`
        item.querySelector( '.device-name' ).textContent = device.name


        fragment.appendChild( item )

      } )

      resultList.replaceChildren( fragment )

    }


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