import React, { Component } from 'react';
import { GoogleMap, Marker, withGoogleMap } from 'react-google-maps';
import SearchBox from 'react-google-maps/lib/components/places/SearchBox';
import { StandaloneSearchBox } from 'react-google-maps/lib/components/places/StandaloneSearchBox';
import { Form, Checkbox, message, Skeleton, Tooltip } from 'antd';

const browser = typeof window !== 'undefined' ? true : false;

if (browser) require('./styles.css');

const MapComponent = withGoogleMap(props => {
	const { Input } = require('antd');

	return (
		<GoogleMap
			ref={props.onMapMounted}
			options={{ gestureHandling: 'cooperative', maxZoom: 18 }}
			defaultZoom={17}
			center={props.center}
			onBoundsChanged={props.onBoundsChanged}>
			<SearchBox
				ref={props.onSearchBoxMounted}
				bounds={props.bounds}
				controlPosition={window.google.maps.ControlPosition.TOP_LEFT}
				onPlacesChanged={props.onPlacesChanged}>
				<Input
					type="text"
					value={props.value}
					onBlur={props.onBlur}
					onChange={e => props.onChange(e.target.value)}
					onKeyDown={e => {
						if (e.key === 'Enter') {
							e.preventDefault();
						}
					}}
					id={props.id}
					placeholder={props.placeholder || props.label || props.id}
					required={props.required}
					style={{
						width: 'calc(100% - 169px - 20px - 40px - 20px)',
						border: 'none',
						height: '40px',
						marginTop: '10px',
						padding: '0 12px',
						borderRadius: '3px',
						fontSize: '14px',
						outline: 'none',
						textOverflow: 'ellipses'
					}}
					size="large"
					name={props.id}
				/>
			</SearchBox>
			{props.markers.map((marker, index) => (
				<Marker key={index} position={marker.position} />
			))}
		</GoogleMap>
	);
});

export default class InputAddress extends Component {
	state = {
		errors: [],
		bounds: null,
		center: { lat: 14.5613, lng: 121.0273 },
		custom: false,
		markers: [
			{
				position: {
					lat: 14.5613,
					lng: 14.5613
				}
			}
		],
		showMap: true
	};

	map = React.createRef();
	searchTextBox = React.createRef();
	standAloneTextBox = React.createRef();

	setAddressObject = value => JSON.stringify({ lat: null, lng: null, address: value, url: '' });

	renderInput() {
		const { Input } = require('antd');

		const { disabled = false, id, label = '', onChange, placeholder = '', value = '', toolTip = {} } = this.props;

		const address = value !== '' ? JSON.parse(value).address : '';

		const input = (
			<Input
				autoComplete="off"
				disabled={disabled}
				name={id}
				onChange={e =>
					onChange(
						{ target: { name: id, value: this.setAddressObject(e.target.value) } },
						id,
						this.setAddressObject(e.target.value)
					)
				}
				placeholder={placeholder || label || id}
				type="text"
				value={address}
			/>
		);

		return Object.keys(toolTip) === 0 ? input : <Tooltip {...toolTip}>{input}</Tooltip>;
	}

	renderInputStandalone() {
		const { Input } = require('antd');

		const {
			disabled = false,
			id,
			label = '',
			onChange,
			placeholder = '',
			required = false,
			toolTip = {},
			value = ''
		} = this.props;

		const address = value !== '' ? JSON.parse(value).address : '';

		const standAloneSearchBox = (
			<div data-standalone-searchbox="">
				<StandaloneSearchBox
					ref={this.standAloneTextBox}
					onPlacesChanged={async e => {
						const places = this.standAloneTextBox.current.getPlaces();

						const value = JSON.stringify({
							lat: places[0].geometry.location.lat(),
							lng: places[0].geometry.location.lng(),
							address: places[0].formatted_address,
							url: places[0].url
						});
						onChange({ target: { name: id, value } }, id, value);
					}}>
					<Input
						type="text"
						name={id}
						autoComplete="off"
						placeholder={placeholder || label || id}
						onChange={e =>
							onChange(
								{ target: { name: id, value: this.setAddressObject(e.target.value) } },
								id,
								this.setAddressObject(e.target.value)
							)
						}
						value={address}
						required={required}
						disabled={disabled}
					/>
				</StandaloneSearchBox>
			</div>
		);

		return Object.keys(toolTip) === 0 ? standAloneSearchBox : <Tooltip {...toolTip}>{standAloneSearchBox}</Tooltip>;
	}

	renderInputMap() {
		const { bounds, center = { lat: 14.5613, lng: 121.0273 }, markers } = this.state;
		const { id, label = '', onChange, placeholder = '', required = false, toolTip = {}, value = '' } = this.props;

		const address = value !== '' ? JSON.parse(value).address : '';

		const mapComponent = (
			<MapComponent
				isMarkerShown
				label={label}
				placeholder={placeholder}
				loadingElement={<div style={{ height: `100%` }} />}
				containerElement={<div style={{ height: `400px`, clear: 'both' }} />}
				mapElement={<div style={{ height: `100%` }} />}
				onMapMounted={this.map}
				onSearchBoxMounted={this.searchTextBox}
				bounds={bounds}
				center={center}
				required={required}
				onBlur={() => {
					setTimeout(() => {
						const places = this.searchTextBox.current.getPlaces();
						if (!places) message.error('Address not found. Try to press enter in the address bar.');
					}, 1000);
				}}
				onChange={e =>
					onChange({ target: { name: id, value: this.setAddressObject(e) } }, id, this.setAddressObject(e))
				}
				onBoundsChanged={() =>
					this.setState({ bounds: this.map.current.getBounds(), center: this.map.current.getCenter() })
				}
				value={address}
				onPlacesChanged={async e => {
					const places = this.searchTextBox.current.getPlaces();
					const bounds = new window.google.maps.LatLngBounds();

					places.forEach(place => {
						if (place.geometry.viewport) {
							bounds.union(place.geometry.viewport);
						} else {
							bounds.extend(place.geometry.location);
						}
					});
					const nextMarkers = places.map(place => ({ position: place.geometry.location }));
					const nextCenter = _.get(nextMarkers, '0.position', center);
					await this.setState({
						center: nextCenter,
						markers: nextMarkers
					});

					const value = JSON.stringify({
						lat: places[0].geometry.location.lat(),
						lng: places[0].geometry.location.lng(),
						address: places[0].formatted_address,
						url: places[0].url
					});
					onChange({ target: { name: id, value } }, id, value);
				}}
				markers={markers}
				id={id}
			/>
		);

		return Object.keys(toolTip) === 0 ? mapComponent : <Tooltip {...toolTip}>{mapComponent}</Tooltip>;
	}

	render() {
		const { errors, custom, showMap } = this.state;
		const {
			disabled = false,
			extra = null,
			id,
			label = '',
			required = false,
			withLabel = false,
			withMap = true
		} = this.props;

		const formItemCommonProps = {
			colon: false,
			help: errors.length != 0 ? errors[0] : '',
			label: withLabel ? (
				<>
					<div style={{ float: 'right' }}>{extra}</div> <span class="label">{label}</span>
				</>
			) : (
				false
			),
			required,
			validateStatus: errors.length != 0 ? 'error' : 'success'
		};

		return (
			<Form.Item {...formItemCommonProps}>
				<Checkbox
					checked={custom}
					name={id}
					onChange={e => this.setState({ custom: e.target.checked })}
					disabled={disabled}
				/>
				<span>&nbsp;Custom Address</span>
				{!custom && (
					<>
						<span>&nbsp;&nbsp;</span>
						<label>
							<Checkbox
								checked={showMap && withMap}
								name={id}
								onChange={e => this.setState({ showMap: e.target.checked })}
								disabled={disabled}
							/>
							<span>&nbsp;Map</span>
						</label>
					</>
				)}
				{browser ? (
					custom ? (
						this.renderInput()
					) : showMap && withMap ? (
						this.renderInputMap()
					) : (
						this.renderInputStandalone()
					)
				) : (
					<Skeleton active paragraph={{ rows: 1, width: '100%' }} title={false} />
				)}
			</Form.Item>
		);
	}
}
