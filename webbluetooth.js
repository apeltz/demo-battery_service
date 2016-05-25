const Bluetooth = {
	gattCharacteristicsMapping: {

		// battery_level characteristic
		battery_level: {
			primaryServices: ['battery_service'],
			includedProperties: ['read', 'notify'],
			parseValue: value => {
				value = value.buffer ? value : new DataView(value);
				let integerValue = value.getUint8(0);
				let result = {};
				result.battery_level = integerValue;
				return result;
			}
		},
		//blood_pressure_feature characteristic
		blood_pressure_feature: {
			primaryServices: ['blood_pressure'],
			includedProperties: ['read']
		},
		//body_composition_feature characteristic
		body_composition_feature: {
			primaryServices: ['body_composition'],
			includedProperties: ['read']
		},
		//bond_management_feature
		bond_management_feature: {
			primaryServices: ['bond_management_feature'],
			includedProperties: ['read']
		},
		//cgm_feature characteristic
		cgm_feature: {
			primaryServices: ['continuous_glucose_monitoring'],
			includedProperties: ['read']
		},
		//cgm_session_run_time characteristic
		cgm_session_run_time: {
			primaryServices: ['continuous_glucose_monitoring'],
			includedProperties: ['read']
		},
		//cgm_session_start_time characteristic
		cgm_session_start_time: {
			primaryServices: ['continuous_glucose_monitoring'],
			includedProperties: ['read', 'write']
		},
		//cgm_status characteristic
		cgm_status: {
			primaryServices: ['continuous_glucose_monitoring'],
			includedProperties: ['read']
		},
		//csc_feature characteristic
		csc_feature: {
			primaryServices: ['cycling_speed_and_cadence'],
			includedProperties: ['read']
		},
		//current_time characteristic
		current_time: {
			primaryServices: ['current_time'],
			includedProperties: ['read', 'write', 'notify']
		},
		//cycling_power_feature characteristic
		cycling_power_feature: {
			primaryServices: ['cycling_power'],
			includedProperties: ['read']
		},
		//firmware_revision_string characteristic
		firmware_revision_string: {
			primaryServices: ['device_information'],
			includedProperties: ['read']
		},
		//hardware_revision_string characteristic
		hardware_revision_string: {
			primaryServices: ['device_information'],
			includedProperties: ['read']
		},
		//ieee_11073-20601_regulatory_certification_data_list characteristic
		ieee_11073_20601_regulatory_certification_data_list: {
			primaryServices: ['device_information'],
			includedProperties: ['read']
		},
		//gap.appearance characteristic
		'gap.appearance': {
			primaryServices: ['generic_access'],
			includedProperties: ['read']
		},
		//gap.device_name charcteristic
		'gap.device_name': {
			primaryServices: ['generic_access'],
			includedProperties: ['read', 'write'],
			parseValue: value => {
				value = value.buffer ? value : new DataView(value);
				let result = {};
				result.device_name = '';
				for(var i=0; i<value.byteLength; i++){
					result.device_name+= String.fromCharCode(value.getUint8(i));
				}
				console.log('result object: ', result)
				return result;
			},
			prepValue: value => {
				// TACKLE THIS NEXT
				let buffer = new ArrayBuffer(20);
				let preppedValue = new DataView(buffer);
				value.split('').forEach((char, i)=>{
					preppedValue.setUint8(i, parseInt(char));
				})
				return preppedValue;
			}
		},
		//gap.peripheral_preferred_connection_parameters characteristic
		'gap.peripheral_preferred_connection_parameters': {
			primaryServices: ['generic_access'],
			includedProperties: ['read']
		},
		//gap.peripheral_privacy_flag characteristic
		'gap.peripheral_privacy_flag': {
			primaryServices: ['generic_access'],
			includedProperties: ['read']
		},
		//glucose_feature characteristic
		glucose_feature: {
			primaryServices: ['glucose'],
			includedProperties: ['read']
		},
		//http_entity_body characteristic
		http_entity_body: {
			primaryServices: ['http_proxy'],
			includedProperties: ['read', 'write']
		},
		//http_headers characteristic
		http_headers: {
			primaryServices: ['http_proxy'],
			includedProperties: ['read', 'write']
		},
		//https_security characteristic
		https_security: {
			primaryServices: ['http_proxy'],
			includedProperties: ['read', 'write']
		},
		//intermediate_temperature characteristic
		intermediate_temperature: {
			primaryServices: ['health_thermometer'],
			includedProperties: ['read', 'write', 'indicate']
		},
		//local_time_information characteristic
		local_time_information: {
			primaryServices: ['current_time'],
			includedProperties: ['read', 'write']
		},
		//manufacturer_name_string characteristic
		manufacturer_name_string: {
			primaryServices: ['device_information'],
			includedProperties: ['read']
		},
		//model_number_string characteristic
		model_number_string: {
			primaryServices: ['device_information'],
			includedProperties: ['read']
		},
		//pnp_id characteristic
		pnp_id: {
			primaryServices: ['device_information'],
			includedProperties: ['read']
		},
		//protocol_mode characteristic
		protocol_mode: {
			primaryServices: ['human_interface_device'],
			includedProperties: ['read', 'writeWithoutResponse']
		},
		//reference_time_information characteristic
		reference_time_information: {
			primaryServices: ['current_time'],
			includedProperties: ['read']
		},
		//supported_new_alert_category
		supported_new_alert_category: {
			primaryServices: ['alert_notification'],
			includedProperties: ['read']
		},
		// sensor_location characteristic
		body_sensor_location: {
			primaryServices: ['heart_rate'],
			includedProperties: ['read'],
			parseValue: value => {
				value = value.buffer ? value : new DataView(value);
				let integerValue = value.getUint8(0);
				let result = {};
				switch (integerValue) {
					case 0: result.location = 'Other';
					case 1: result.location = 'Chest';
					case 2: result.location = 'Wrist';
					case 3: result.location = 'Finger';
					case 4: result.location = 'Hand';
					case 5: result.location = 'Ear Lobe';
					case 6: result.location = 'Foot';
					default: result.location = 'Unknown';
				}
				return result;
			}
		},
		// heart_rate_control_point
		heart_rate_control_point: {
			primaryServices: ['heart_rate'],
			includedProperties: ['write'],
			prepValue: value => {
				let buffer = new ArrayBuffer(1);
				let writeView = new DataView(buffer);
				writeView.setUint8(0,value);
				return writeView;
			}
		},
		heart_rate_measurement: {
			primaryServices: ['heart_rate'],
			includedProperties: ['notify'],
			/**
				* Parses the event.target.value object and returns object with readable
				* key-value pairs for all advertised characteristic values
				*
				*	@param {Object} value Takes event.target.value object from startNotifications method
				*
				* @return {Object} result Returns readable object with relevant characteristic values
				*
				*/
			parseValue: value => {
				// In Chrome 50+, a DataView is returned instead of an ArrayBuffer.
				value = value.buffer ? value : new DataView(value);
				// Reads first byte and determines which value fields are present based on flags
				let flags = value.getUint8(0);
				let rate16Bits = flags & 0x1;
				let contactDetected = flags & 0x2;
				let contactSensorPresent = flags & 0x4;
				let energyPresent = flags & 0x8;
				let rrIntervalPresent = flags & 0x10;
				// Object to store values to be returned to startNotifications method
				let result = {};
				// Iterate over DataView to retrieve values at each index where values are present
				let index = 1;
				// heartRate can be advertised in either 8- or 16-bit format
				// increment index accordingly to provide correct address for retriving next possible value
				if (rate16Bits) {
					result.heartRate = value.getUint16(index, /*littleEndian=*/true);
					index += 2;
				} else {
					result.heartRate = value.getUint8(index);
					index += 1;
				}
				if (contactSensorPresent) {
					result.contactDetected = !!contactDetected;
				}
				if (energyPresent) {
					result.energyExpended = value.getUint16(index, /*littleEndian=*/true);
					index += 2;
				}
				if (rrIntervalPresent) {
					let rrIntervals = [];
					for (; index + 1 < value.byteLength; index += 2) {
						rrIntervals.push(value.getUint16(index, /*littleEndian=*/true));
					}
					result.rrIntervals = rrIntervals;
				}
				return result;
			}
		},
		//serial_number_string characteristic
		serial_number_string: {
			primaryServices: ['device_information'],
			includedProperties: ['read']
		},
		//software_revision_string characteristic
		software_revision_string: {
			primaryServices: ['device_information'],
			includedProperties: ['read']
		},
		//supported_unread_alert_category characteristic
		supported_unread_alert_category: {
			primaryServices: ['alert_notification'],
			includedProperties: ['read']
		},
		//system_id characteristic
		system_id: {
			primaryServices: ['device_information'],
			includedProperties: ['read']
		},
		//temperature_type characteristic
		temperature_type: {
			primaryServices: ['health_thermometer'],
			includedProperties: ['read']
		}
	},
	// all adopted services... passed in as argument to optional services filter
	gattServiceList: ['alert_notification', 'automation_io', 'battery_service', 'blood_pressure',
      'body_composition', 'bond_management', 'continuous_glucose_monitoring',
      'current_time', 'cycling_power', 'cycling_speed_and_cadence', 'device_information',
      'environmental_sensing', 'generic_access', 'generic_attribute', 'glucose',
      'health_thermometer', 'heart_rate', 'human_interface_device',
      'immediate_alert', 'indoor_positioning', 'internet_protocol_support', 'link_loss',
      'location_and_navigation', 'next_dst_change', 'phone_alert_status',
      'pulse_oximeter', 'reference_time_update', 'running_speed_and_cadence',
      'scan_parameters', 'tx_power', 'user_data', 'weight_scale'
    ],



  /**
	  * Calls navigator.bluetooth.requestDevice
	  *
	  *	@param {Object} filters Collection of filters for devices
	  *					all filters are optional, but at least 1 is required
	  *					.name {string}
	  *					.namePrefix {string}
	  *					.uuid {string}
	  *					.services {array}
	  *					.optionalServices {array} - defaults to all available services,
	  *							use an empty array to get no optional services
	  *
	  * @return {Object} Returns a new instance of Device
	  *
	  */
	acquire(filters) {

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/; // TODO: Add error for invalid U
		const requestParams = {
			filters: [],
		};

		if (filters) {
			if (filters.name) requestParams.filters.push({ name: filters.name });
			if (filters.namePrefix) requestParams.filters.push({ namePrefix: filters.namePrefix });
			if (filters.uuid) requestParams.filters.push({ uuid: filters.uuid });
			if (filters.services) requestParams.filters.push({ services: filters.services });
			if (filters.optionalServices) requestParams.optionalServices = filters.optionalServices;
			else requestParams.optionalServices = this.gattServiceList;
		} else {
			/*
			* If no filters are passed in, throw error no_filters
			*	TODO: Catch error for "user canceled request device chooser"
			*					and "bluetooth not available"
			*/
			// errorHandler('no_filters'/*, Context Object */);
		}

		// return new Device(navigator.bluetooth.requestDevice(requestParams));
		return navigator.bluetooth.requestDevice(requestParams).then(device => {
			return new Device(device);
		});
	}

}

class Device {

	constructor(requestParams) {
		this.requestParams = requestParams;
		this.apiDevice = null;
		this.apiServer = null;
		// this.connected = this.checkConnectionStatus();
	}

	/**
		* checks apiDevice to see whether device is connected
		*/
	checkConnectionStatus() {
		return this.apiDevice.gatt.connected;
	}

	/**
		* Establishes a new GATT connection w/ the device
		* 	and stores the return of the promise as this.apiServer
		*
		* FIXME: Does this.apiServer need to be a promise?
		*		If so, set it to the promise returned by .gatt.connect(),
		*		instead of setting it to the resolution in the .then callback.
	  */
	connect() {
		const filters = this.requestParams;
		const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/; // TODO: Add error for invalid U
		const requestParams = {
			filters: [],
		};

		if (filters) {
			if (filters.name) requestParams.filters.push({ name: filters.name });
			if (filters.namePrefix) requestParams.filters.push({ namePrefix: filters.namePrefix });
			if (filters.uuid) requestParams.filters.push({ uuid: filters.uuid });
			if (filters.services) requestParams.filters.push({ services: [filters.services] });
			if (filters.optionalServices) requestParams.optionalServices = filters.optionalServices;
			else requestParams.optionalServices = Bluetooth.gattServiceList;
		} else {
			/*
			* If no filters are passed in, throw error no_filters
			*	TODO: Catch error for "user canceled request device chooser"
			*					and "bluetooth not available"
			*/
			// errorHandler('no_filters'/*, Context Object */);
		}
			return navigator.bluetooth.requestDevice(requestParams).then(device => {
			this.apiDevice = device;
			return device.gatt.connect()
		})
		.then(server => {
			this.apiServer = server;
			return server;
		});
		// TODO: Add error functionality
	};

	/**
	 * Attempts to disconnect from BT device
	 *
	 * @Return {Boolean} successfully disconnected
	 *					returns false after 3ms
	 */
	disconnect() {
		/**
        *Disconnect from device if the connected property in the bluetooth object
        *evaluates to true.
        */
        if (this.apiServer.connected) {
          this.apiServer.disconnect();
          /**
          *If the disconnect method is called while the connected property on the
          *bluetooth object evaluates to true and the connected property in the bluetooth
          *object evaluates to false after disconnect runs, then return the boolean value
          *true to indicate that the disconnect was successful.
          */
          if (!this.apiServer.connected) {
            return true;
          }
          /**
          *If however, the connected property in the bluetooth object evaluates
          *to true after the disconnect method ran, then display an error stating that there
          *was a problem disconnecting with the device.
          */
          throw new Error('Issue disconnecting with device.');
        }
        /**
        *If the disconnect method is called while the connected property in the
        *bluetooth object is false, then display an error stating that the device
        *is not connected.
        */
        throw new Error('Could not disconnect. Device not connected.');
		// return new Promise((resolve, reject) => {
		//
		// 	// If not disconnected within 1 second, reject promise
		// 	setTimeout(() => {
		// 		if (this.connected) {
		// 			// errorHandler('disconnect_timeout', {});
		// 			return reject(false);	// TODO: does this cause an error if already resolved?
		// 		} else {
		// 			this.apiServer = null;
		// 			return resolve(true);
		// 		}
		// 	}, 1000);
		//
		// 	/**
		// 	 * If the device is connected, attempt to disconnect
		// 	 * then immediately check if successful and resolve promise
		// 	 */
		// 	if (this.connected) {
		// 		this.apiDevice.gatt.disconnect()
		// 		.then(() => {
		// 			if (!this.connected) {
		// 				this.apiServer = null;
		// 				return resolve(true);
		// 			};
		// 		})
		// 		.catch(err => {
		// 			// errorHandler('disconnect_error', {}, err);
		// 		});
		// 	}
		// });
	}

	/**
	 * Attempts to get characteristic value from BT device
	 *
	 * @param {string} GATT characteristic name
	 * @return {Promise} A promise to the characteristic value
	 *
	 */
	getValue(characteristicName) {
		// TODO: add error handling for absent characteristics and characteristic properties
		var characteristicObj = Bluetooth.gattCharacteristicsMapping[characteristicName];
		var includedProperties = characteristicObj.includedProperties;
		if (includedProperties.includes('read')){
			/**
			 * TODO: add functionality to map through all primary services
			 *       to characteristic, if multiple exist e.g. 'sensor_location'...
			 *       or add functionality at device connection to filter primary
			 *       services based on only those available to device
			 */
			 // IF YOU'RE HAVING AN ISSUE READING A VALUE, IT'S PROBABLY BECAUSE THIS DOES NOT WORK ON CARLOS' COMPUTER SO STOP TRYING TO DEBUG THIS.
			 // USE AARON'S COMPUTER
			return this.apiServer.getPrimaryService(characteristicObj.primaryServices[0])
			.then(service => {
				return service.getCharacteristic(characteristicName);
			})
			.then(characteristic => {
				return characteristic.readValue();
			})
			.then(value => {
				var parsedValue = characteristicObj.parseValue(value);
				parseValue.eventObj = value;
				console.log('returned to developer at end of getValue fn: ', parsedValue);
				return parsedValue;

			})
			.catch(err => {
				console.log('error',err);
				// errorHandler('disconnect_error', {}, err);
			})
		}
		else {
			// errorHandler('illegal action', {}, err);
		}
	} // end getValue

	postValue(characteristicName, value){
		var characteristicObj = Bluetooth.gattCharacteristicsMapping[characteristicName];
		var includedProperties = characteristicObj.includedProperties;
		if(includedProperties.includes('write')){
			/**
			 * TODO: add functionality to map through all primary services
			 *       to characteristic, if multiple exist e.g. 'sensor_location'...
			 *       or add functionality at device connection to filter primary
			 *       services based on only those available to device
			 */
		 return this.apiServer.getPrimaryService(characteristicObj.primaryServices[0])
			.then(service => {
				console.log('service',service);
				return service.getCharacteristic(characteristicName);
			})
			.then(characteristic => {
				/**
				*TODO: Add functionality to make sure that the values passed in are in the proper format,
				*	   and are compatible with the writable device.
				*/
				var formattedValue = characteristicObj.prepValue(value);
				return characteristic.writeValue(formattedValue);
			})
			.then(changedChar => {
				console.log('changed characteristic:', changedChar);
			})
			.catch(err => {
				console.log('error',err);
				// errorHandler('disconnect_error', {}, err);
			})
		}
		else {
			// handle errors for incorrectly formatted data or whatnot.
		}
	} // end of postValue

	/**
	 * Attempts to start notifications for changes to BT device values and retrieve
	 * updated values
	 *
	 * @param {string} GATT characteristic name
	 * @return TODO: what does this return!?!
	 *
	 */
	startNotifications(characteristicName, func){
		var characteristicObj = Bluetooth.gattCharacteristicsMapping[characteristicName];
		var includedProperties = characteristicObj.includedProperties;
		if(includedProperties.includes('notify')){
			/**
			 * TODO: add functionality to map through all primary services
			 *       to characteristic, if multiple exist e.g. 'sensor_location'...
			 *       or add functionality at device connection to filter primary
			 *       services based on only those available to device
			 */
		 return this.apiServer.getPrimaryService(characteristicObj.primaryServices[0])
			.then(service => {
				return service.getCharacteristic(characteristicName);
			})
			.then(characteristic => {
				/**
				*TODO: Add functionality to make sure that the values passed in are in the proper format,
				*	   and are compatible with the writable device.
				*/
				return characteristic.startNotifications()
				.then( () => {
					// return characteristic;
					return characteristic.addEventListener('characteristicvaluechanged', event => {
				      func(event);
				    });
				})
			})
			.catch(err => {
				console.log('error',err);
				// errorHandler('disconnect_error', {}, err);
			})
		}
		else {
			// handle errors for incorrectly formatted data or whatnot.
		}
	} // end of postValue
}
