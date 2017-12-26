/* eslint-disable no-undef */
import _ from 'lodash'
import React from 'react'
import Promise from 'bluebird'
import {
  withScriptjs,
  withGoogleMap,
  GoogleMap,
  Marker,
  SearchBox,
  InfoWindow, Circle, DirectionsRenderer
} from "react-google-maps"
import { compose, withProps } from 'recompose'
import { UpdateLocation } from './api.js'

const generateMaker = (drivers, onDragEnd) =>
  drivers.map(({ location, _id }, i) => {
    return <Marker
      key={i}
      position={location}
      defaultVisible={true}
      icon={{
        url: '/bike.png',
        scaledSize: new google.maps.Size(50, 50)
      }}
      draggable={true}
      onDragEnd={onDragEnd(_id)}
    />
  })
class Map extends React.Component {
  constructor() {
    super()
    this.state = {
      address: "BRAD CENTER",
      center: {},
      map: null,
      filter_drivers: [],
      geocoder: new google.maps.Geocoder()
    }
    this.updateDriverPosition = this.updateDriverPosition.bind(this)
    this.filterDriversWithRadius = this.filterDriversWithRadius.bind(this)
  }
  componentWillReceiveProps(nextProps) {
    const { geocoder } = this.state
    const address = nextProps.location && nextProps.location.address
    const drivers = nextProps.drivers && nextProps.drivers
    const radius = nextProps.radius && nextProps.radius
    console.log("radius",radius)
    if (address && address != this.state.address) {
      geocoder.geocode({
        'address': address
      }, (results, status) => {
        console.log("geo", status, results)
        if (status === 'OK') {
          let geo_result = {
            center: results[0].geometry.location,
            address: address
          }
          this.filterDriversWithRadius(drivers, radius)
            .then(drivers => {
              console.log("filter60", drivers)
              this.setState({
                ...this.state,
                ...geo_result,
                filter_drivers: [...drivers]
              })
            })
        } else {
          console.log("geocodeAddress got errors!")
        }
      })

    } else {
      console.log("5=74")
      this.filterDriversWithRadius(drivers, radius)
        .then(drivers => {
          console.log("filter60", drivers)
          this.setState({
            ...this.state,
            filter_drivers: [...drivers]
          })
        })
        .catch(err=>{
          console.error(err)
        })
    }
  }
  componentDidMount() {
    const { drivers } = this.props
    const geocoder = new google.maps.Geocoder()
    this.setState({
      ...this.state,
      center: { lat: 10.7625113, lng: 106.6808868 },
      filter_drivers: [...drivers]
    })
    // DirectionsService.route({
    //   origin: new google.maps.LatLng(10.7626272, 106.6805864),
    //   destination: new google.maps.LatLng(10.7626372, 106.6850864),
    //   travelMode: google.maps.TravelMode.DRIVING,
    // }, (result, status) => {
    //   if (status === google.maps.DirectionsStatus.OK) {
    //     this.setState({
    //       directions: result,
    //     });
    //   } else {
    //     console.error(`error fetching directions ${result}`);
    //   }
    // });
  }
  filterDriversWithRadius(drivers, radius) {
    return new Promise((resolve, reject) => {
      radius = parseFloat(radius)
      if (radius === 0) {
        resolve(drivers)
      } else {
        let updated_drivers = []
        let driver = "", distance = 0
        const center = new google.maps.LatLng(this.state.center)
        for (let i in drivers) {
          driver = new google.maps.LatLng({ ...drivers[i].location })
          let distance = parseFloat(google.maps.geometry.spherical.computeDistanceBetween(driver, center).toFixed(2))
          if (distance <= radius) {
            updated_drivers.push(drivers[i])
          }
        }
        resolve(updated_drivers)
      }
    })
    // updateDrivers(filter_drivers)
  }
  updateDriverPosition(marker, id) {
    const { drivers, updateDrivers } = this.props
    const location = JSON.stringify(marker.latLng)
    UpdateLocation(location, id)
      .then(response => {
        const updated_drivers = drivers.map(driver => {
          if (driver._id === id) {
            driver.location = JSON.parse(location)
          }
          return driver
        })
        updateDrivers(updated_drivers)
        // this.props.fetchDriver()
      })
      .catch(err => {
        throw err
      })
  }
  onMapLoad(map) {
    if (this.state.map === null) {
      this.setState({
        ...this.state,
        map
      })
    }
  }
  onBoundsChanged() {
    const { map, center } = this.state
  }
  render() {
    const { center, address, filter_drivers } = this.state
    const { radius } = this.props
    console.log("filter,", center)
    return (
      <div>
        {
          Object.keys(center).length > 0 ?
            <GoogleMap
              defaultZoom={15}
              center={center}
              onBoundsChanged={this.onBoundsChanged.bind(this)}
              ref={this.onMapLoad.bind(this)}
            >
              {
                radius !== 0 ?
                  <Circle
                    center={center}
                    radius={radius}
                  /> : null
              }
              {
                filter_drivers.length > 0 ?
                  filter_drivers.map(({ location, _id }) => {
                    return <Marker
                      key={_id}
                      position={location}
                      defaultVisible={true}
                      name="name"
                      icon={{
                        url: '/bike.png',
                        scaledSize: new google.maps.Size(50, 50)
                      }}
                      draggable={true}
                      onDragEnd={(marker) => {
                        this.updateDriverPosition(marker, _id)
                      }}
                    />
                  })
                  : ""
              }
              {/* <DirectionsRenderer directions={props.directions} /> */}
              {
                Object.keys(center).length > 0 ?
                  <Marker
                    position={center}
                    defaultVisible={true}
                  // icon={{
                  //   url: 'image/user.png',
                  //   scaledSize: new google.maps.Size(30, 30)
                  // }}
                  >
                    <InfoWindow><div>{address}</div></InfoWindow>
                  </Marker> : null
              }
            </GoogleMap >
            : <h2>Loading</h2>
        }
      </div>
    )


  }
}
const MyMapComponent = compose(
  withProps({
    googleMapURL: "https://maps.googleapis.com/maps/api/js?v=3.exp&key=AIzaSyCScHlkcWZyzl7P0MfNYutchAEzoSzAUgU&libraries=geometry,drawing,places&sensor=false",
    loadingElement: <div style={{ height: `100%` }} />,
    containerElement: <div style={{ height: `520px` }} />,
    mapElement: <div style={{ height: `100%`, width: "930px" }} />,
  }),
  withScriptjs,
  withGoogleMap
)(Map)
export default MyMapComponent