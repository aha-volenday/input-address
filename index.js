import React, { Component, Fragment } from 'react';
import { withGoogleMap, GoogleMap, Marker } from 'react-google-maps';
import SearchBox from 'react-google-maps/lib/components/places/SearchBox';
import InputDate from '@volenday/input-date';
import validate from 'validate.js';
import { Button, Form, Checkbox, Input, message, Popover } from 'antd';

const { StandaloneSearchBox } = require('react-google-maps/lib/components/places/StandaloneSearchBox');

import './styles.css';

const MapComponent = withGoogleMap(props => {
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
					value={props.tempValue}
					onBlur={props.onBlur}
					onChange={e => {
						props.onChangeTemp(e.target.value);
						props.onSearchChange();
					}}
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
					allowClear
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
		showMap: true,
		tempValue: '',
		tempValueTyping: false,
		hasChange: false,
		isPopoverVisible: false,
		localAddressValue: ''
	};

	map = React.createRef();
	searchTextBox = React.createRef();
	standAloneTextBox = React.createRef();

	static getDerivedStateFromProps(nextProps, prevState) {
		if (nextProps.value && !prevState.tempValue) {
			const mapObject = JSON.parse(nextProps.value);
			const newMarkers = mapObject.lat
				? [{ position: { lat: mapObject.lat, lng: mapObject.lng } }]
				: prevState.markers;
			const newCenter = mapObject.lat
				? {
						lat: mapObject.lat,
						lng: mapObject.lng
				  }
				: prevState.markers;

			return {
				...prevState,
				tempValue: mapObject.address,
				markers: newMarkers,
				center: newCenter
			};
		}

		if (!nextProps.value && prevState.tempValue && !prevState.tempValueTyping) {
			return { tempValue: '' };
		}

		return null;
	}

	componentDidUpdate(prevProps, prevState) {
		if (this.state.custom !== prevState.custom) {
			this.setState({ localAddressValue: prevProps.value ? JSON.parse(prevProps.value).address : '' });
		}
	}

	onSearchChange = () => {
		const { action } = this.props;

		this.setState({ hasChange: action === 'add' ? false : true });
	};

	handleInputAddressChange = value => {
		const { action } = this.props;

		this.setState({ hasChange: action === 'add' ? false : true, localAddressValue: value });
	};

	setAddressObject = value => {
		return JSON.stringify({ lat: null, lng: null, address: value, url: '' });
	};

	onChange = async value => {
		const { action, id, onValidate } = this.props;

		const errors = this.validate(value);
		await this.setState({ errors, localAddressValue: value, hasChange: action === 'add' ? false : true });
		if (onValidate) onValidate(id, errors);
	};

	validate = value => {
		const { id, required = false } = this.props;

		const constraints = {
			[id]: {
				presence: { allowEmpty: !required }
			}
		};

		const errors = validate({ [id]: value }, constraints);
		return errors ? errors[id] : [];
	};

	handlePopoverVisible = visible => {
		this.setState({ isPopoverVisible: visible });
	};

	renderInput() {
		const { disabled = false, id, label = '', onChange, placeholder = '', value = '' } = this.props;

		let address = '';
		if (value != '') {
			address = JSON.parse(value).address;
		}

		return (
			<Input
				allowClear
				autoComplete="off"
				disabled={disabled}
				name={id}
				onBlur={e => {
					if (e.target.value != address) onChange(id, this.setAddressObject(e.target.value));
				}}
				onChange={e => {
					if (this.state.localAddressValue != '' && address == '')
						onChange(id, this.setAddressObject(e.target.value));
					this.onChange(e.target.value);
				}}
				onPressEnter={e => {
					onChange(id, this.setAddressObject(e.target.value));
					return true;
				}}
				placeholder={placeholder || label || id}
				type="text"
				value={this.state.localAddressValue || ''}
			/>
		);
	}

	renderInputStandalone() {
		let { tempValue } = this.state;
		const {
			disabled = false,
			id,
			action,
			label = '',
			onChange,
			placeholder = '',
			required = false,
			value = ''
		} = this.props;

		if (value != '') {
			let address = JSON.parse(value).address;
			if (address == tempValue) {
				tempValue = address;
			}
		}

		return (
			<div data-standalone-searchbox="">
				<StandaloneSearchBox
					ref={this.standAloneTextBox}
					onPlacesChanged={async e => {
						const places = this.standAloneTextBox.current.getPlaces();
						await this.setState({ tempValue: places[0].formatted_address, tempValueTyping: false });
						onChange(
							id,
							JSON.stringify({
								lat: places[0].geometry.location.lat(),
								lng: places[0].geometry.location.lng(),
								address: places[0].formatted_address,
								url: places[0].url
							})
						);
					}}>
					<div class="form-group">
						<Input
							type="text"
							name={id}
							autoComplete="off"
							placeholder={placeholder || label || id}
							onChange={e =>
								this.setState({
									hasChange: action === 'add' ? false : true,
									tempValue: e.target.value,
									tempValueTyping: true
								})
							}
							value={tempValue}
							required={required}
							disabled={disabled}
							size="large"
							allowClear
						/>
					</div>
				</StandaloneSearchBox>
			</div>
		);
	}

	renderInputMap() {
		let { bounds, center = { lat: 14.5613, lng: 121.0273 }, markers, tempValue } = this.state;
		const { id, action, label = '', onChange, placeholder = '', required = false, value = '' } = this.props;

		if (value != '') {
			let address = JSON.parse(value).address;
			if (address == tempValue) {
				tempValue = address;
			}
		}

		return (
			<MapComponent
				isMarkerShown
				label={label}
				placeholder={placeholder}
				loadingElement={<div style={{ height: `100%` }} />}
				containerElement={<div style={{ height: `400px`, clear: 'both' }} />}
				mapElement={<div style={{ height: `100%` }} />}
				onMapMounted={this.map}
				onSearchChange={this.onSearchChange}
				onSearchBoxMounted={this.searchTextBox}
				bounds={bounds}
				center={center}
				required={required}
				onBlur={() => {
					setTimeout(() => {
						const places = this.searchTextBox.current.getPlaces();
						if (!places) {
							message.error('Address not found. Try to press enter in the address bar.');
						}
					}, 1000);
				}}
				onChangeTemp={e => this.setState({ tempValue: e, tempValueTyping: true })}
				onBoundsChanged={() =>
					this.setState({ bounds: this.map.current.getBounds(), center: this.map.current.getCenter() })
				}
				tempValue={tempValue}
				onPlacesChanged={async e => {
					this.setState({ hasChange: action === 'add' ? false : true });

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
						markers: nextMarkers,
						tempValue: places[0].formatted_address,
						tempValueTyping: false
					});
					onChange(
						id,
						JSON.stringify({
							lat: places[0].geometry.location.lat(),
							lng: places[0].geometry.location.lng(),
							address: places[0].formatted_address,
							url: places[0].url
						})
					);
				}}
				markers={markers}
				id={id}
			/>
		);
	}

	handlePopoverVisible = visible => {
		this.setState({ isPopoverVisible: visible });
	};

	renderPopover = () => {
		const { isPopoverVisible } = this.state;
		const { id, label = '', historyTrackValue = '', onHistoryTrackChange } = this.props;

		return (
			<Popover
				content={
					<InputDate
						id={id}
						label={label}
						required={true}
						withTime={true}
						withLabel={true}
						value={historyTrackValue}
						onChange={onHistoryTrackChange}
					/>
				}
				trigger="click"
				title="History Track"
				visible={isPopoverVisible}
				onVisibleChange={this.handlePopoverVisible}>
				<span style={{ marginLeft: '5px' }}>
					<Button
						type="link"
						shape="circle-outline"
						icon="warning"
						size="small"
						style={{ color: '#ffc107' }}
					/>
				</span>
			</Popover>
		);
	};

	render() {
		const { errors, custom, showMap, hasChange } = this.state;
		const {
			disabled = false,
			id,
			action,
			label = '',
			required = false,
			withLabel = false,
			withMap = true,
			historyTrack = false
		} = this.props;

		const formItemCommonProps = {
			colon: false,
			help: errors.length != 0 ? errors[0] : '',
			label: withLabel ? label : false,
			required,
			validateStatus: errors.length != 0 ? 'error' : 'success'
		};

		return (
			<Form.Item {...formItemCommonProps}>
				{historyTrack && hasChange && action !== 'add' && this.renderPopover()}
				<Checkbox
					checked={custom}
					name={id}
					onChange={e => this.setState({ custom: e.target.checked })}
					disabled={disabled}
				/>
				<span>&nbsp;Custom Address</span>
				{!custom && (
					<Fragment>
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
					</Fragment>
				)}
				{custom
					? this.renderInput()
					: showMap && withMap
					? this.renderInputMap()
					: this.renderInputStandalone()}
			</Form.Item>
		);
	}
}
