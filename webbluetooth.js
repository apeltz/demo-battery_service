  /**
		* @method connect - Calls navigator.bluetooth.requestDevice
		*		(?? If it has not yet been called already??), then calls device.gatt.connect
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
class Bluetoothdevice {

	constructor(requestParams) {
		this.requestParams = requestParams;
		this.apiDevice = null;
		this.apiServer = null;
		this.cache = {};
	}

	/**
		* checks apiDevice to see whether device is connected
		*/
	connected() {
		if(!this.apiDevice) return errorHandler('no_device');
		return this.apiDevice.gatt.connected;
	}

	/**
		* Establishes a new GATT connection w/ the device
		* 	and stores the return of the promise as this.apiServer
		*
	  */
	connect() {
		const filters = this.requestParams;
		const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
		if (Object.keys(filters).length) {
			const requestParams = {
				filters: [],
			};
			// FIXME: validate name and throw error if not valid - 'string'
			if (filters.name) requestParams.filters.push({ name: filters.name });
			// FIXME: validate name and throw error if not valid - 'string'
			if (filters.namePrefix) requestParams.filters.push({ namePrefix: filters.namePrefix });
			if (filters.uuid) {
				if (!filters.uuid.match(uuidRegex)) {
					errorHandler('uuid_error');
				}
				else {
					requestParams.filters.push({ uuid: filters.uuid });
				}
			}
			if (filters.services) {
				let services =[];
				filters.services.forEach(service => {
					if (!bluetooth.gattServiceList.includes(service)) {
						console.warn(`${service} is not a valid service. Please check the service name.`);
					}
					else {
						services.push(service);
					}
				});
				requestParams.filters.push({ services: services });
			}
			if (filters.optional_services) {
				filters.optional_services.forEach(service => {
					if(!bluetooth.gattServiceList.includes(service)) bluetooth.gattServiceList.push(service);
				});
			}

			requestParams.optionalServices = bluetooth.gattServiceList;

			// TODO: think about what we want to return here.
			return navigator.bluetooth.requestDevice(requestParams).then(device => {
				this.apiDevice = device;
				return device.gatt.connect()
			})
			.then(server => {
				this.apiServer = server;
				return server;
			})
			.catch(err => {
				// FIXME: parse error as it can be a result of a few things: 1. user cancelled, 2. 'unknown connection error'
				errorHandler('user_cancelled',err);
				return;
			});
		} else {
			return errorHandler('no_filters');
		}
	};

	/**
	 * Attempts to disconnect from BT device
	 *
	 * @Return {Boolean} successfully disconnected
	 *					returns an error.
	 * Disconnect from device if the connected property in the bluetooth object
	 * evaluates to true otherwise, disconnecting issue throws an error.
	 */
	disconnect() {
        if (this.apiServer.connected) {
          this.apiServer.disconnect();
					//TODO: check if this is asynchronous when retesting.
          if (!this.apiServer.connected) {
            return true;
          }
					return errorHandler('issue_disconnecting');
        }
				return errorHandler('not_connected');
	}

	/**
	 * Gets requested characteristic before attempting to read value of that characteristic
	 * and returning an object with the parsed value (if characterisitc is fully supported)
	 * and raw value (provided regardles of whether device is fully supported or not).
	 *
	 * @param {string} characteristic_name - GATT characteristic  name
	 * @return {Object} An object that includes key-value pairs for each of the properties
	 *									successfully read and parsed from the device, as well as the
	 *									raw value object returned by a native readValue request to the
	 *									device characteristic.
	 */
	getValue(characteristic_name) {
		/**
		* Check to see if characteristic exists in bluetooth.gattCharacteristicsMapping
		* and throw error if not found.
		*/
		if(!bluetooth.gattCharacteristicsMapping[characteristic_name]) {
			return errorHandler('characteristic_error', null, characteristic_name);
		}
		// Retrieve characteristic object from bluetooth.gattCharacteristicsMapping
		var characteristicObj = bluetooth.gattCharacteristicsMapping[characteristic_name];
		/**
		* Check characteristic object to see if support for read property is provided.
		* If not provided, proceed with attempt to read value of characteristic but
		* provide warning indicating such.
		*/
		if(!characteristicObj.includedProperties.includes('read')) {
			console.warn(`Attempting to access read property of ${characteristic_name},
										which is not a included as a supported property of the
										characteristic. Attempt will resolve with an object including
										only a rawValue property with the native API return
										for an attempt to readValue() of ${characteristic_name}.`);
			}
		// Call returnCharacteristic to retrieve characteristic from which to read
		// FIXME: Check bound context of 'this' here
		this.returnCharacteristic(characteristic_name)
			.then(characteristic =>{
				return characteristic.readValue();
			})
			.then(value =>{
				/**
				* Check characteristic object to see if parsing method exists. If present,
				* call the parseValue method with value returned from readValue() as the
				* argument, and add returned value from readValue() as another parameter to
				* the returned object from parseValue before returning. If no parsing method
				* is present, return an object with the returned value from readValue() as
				* the only parameter.
				*/
				let returnObj = characteristicObj.parseValue ? characteristicObj.parseValue(value):{};
				// Always include the raw value returned from readValue() in the object returned
				returnObj.rawValue = value;
				return returnObj;
			})
			.catch(err => {
				return errorHandler('read_error',err);
			});
	} // End getValue

	/**
	 * Attempts to write a given value to the device for a given characteristic
	 •
	 * @param {String} characteristic_name - GATT characteristic  name
	 * @param {String or Number} value - String or Number that will be written to
	 																		 the requested device characteristic
	 * FIXME: What do we want to return?
	 * @return {Boolean} - Result of attempt to write characteristic where true === successfully written
	 */
	writeValue(characteristic_name, value){
		/**
		* Check to see if characteristic exists in bluetooth.gattCharacteristicsMapping
		* and throw error if not found.
		*/
		if(!bluetooth.gattCharacteristicsMapping[characteristic_name]) {
			return errorHandler('characteristic_error', null, characteristic_name);
		}
		// Retrieve characteristic object from bluetooth.gattCharacteristicsMapping
		var characteristicObj = bluetooth.gattCharacteristicsMapping[characteristic_name];
		/**
		* Check characteristic object to see if support for write property is provided.
		* If not provided, proceed with attempt to write value to characteristic but
		* provide warning indicating such.
		*/
		if(!characteristicObj.includedProperties.includes('write')) {
			console.warn(`Attempting to access write property of ${characteristic_name},
										which is not a included as a supported property of the
										characteristic. Attempt will resolve with native API return
										for an attempt to writeValue(${value}) to ${characteristic_name}.`);
			}
		// Call returnCharacteristic to retrieve characteristic from which to read
		// FIXME: Check bound context of 'this' here
		this.returnCharacteristic(characteristic_name)
			.then(characteristic => {
				/**
				* Check characteristic object to see if prepping method exists. If present,
				* call the prepValue method with the provided value as the argument. If
				* no prepping method is present, attempt to call writeValue() to the
				* characteristic with the provided value as the the argument.
				*/
				value = characteristicObj.prepValue ? characteristicObj.prepValue(value):value;
				return characteristic.writeValue(value);
			})
			.then(changedChar => {
				//FIXME: what do we want return? check how this resolves (i.e Undefined?).
				return value;
			})
			.catch(err => {
				return errorHandler('write_error',err,characteristic_name);
			})
	} // End writeValue

	/**
	* Attempts to start notifications for changes to device values and adds event
	* listener to listen for events to which a provided callback will be applied
	*
	* @param {String} characteristic_name - GATT characteristic name
	* @param {Function} func - callback function to apply to each event while
															notifications are active
	* FIXME: What do we want to return? The event returned is visible in the callback provided... so maybe nothing?
	* @return TBD
	*
	*/
	startNotifications(characteristic_name, func){
		/**
		* Check to see if characteristic exists in bluetooth.gattCharacteristicsMapping
		* and throw error if not found.
		*/
		if(!bluetooth.gattCharacteristicsMapping[characteristic_name]) {
			return errorHandler('characteristic_error', null, characteristic_name);
		}
		// Retrieve characteristic object and primary service from bluetooth.gattCharacteristicsMapping
		var characteristicObj = bluetooth.gattCharacteristicsMapping[characteristic_name];
		var primary_service_name = characteristicObj.primaryServices[0];
		/**
		* Check characteristic object to see if support for notify property is provided.
		* If not provided, proceed with attempt to start notifications from characteristic but
		* provide warning indicating such.
		*/
		if(!characteristicObj.includedProperties.includes('notify')) {
			console.warn(`Attempting to access notify property of ${characteristic_name},
										which is not a included as a supported property of the
										characteristic. Attempt will resolve with an object including
										only a rawValue property with the native API return
										for an attempt to startNotifications() for ${characteristic_name}.`);
			}
		// Call returnCharacteristic to retrieve characteristic from which to read
		// FIXME: Check bound context of 'this' here
		this.returnCharacteristic(characteristic_name)
			.then(characteristic =>{
				// Start notifications from characteristic and add event listener
				characteristic.startNotifications()
				.then(() => {
					/**
					* After successfully starting notifications from characteristic, update
					* cache to reflect current notification status.
					*/
					this.cache[primary_service_name][characteristic_name].notifying = true;
					// Add listener to subscribe to notifications from device
					return characteristic.addEventListener('characteristicvaluechanged', event => {
						/**
						* Check characteristic object to see if parsing method exists. If present,
						* call the parseValue method with value attached to the event object,
						* and add the raw event object as another parameter to the returned
						* object from parseValue before returning. If no parsing method is
						* present, return an object with the raw event object as the only parameter.
						*/
						let eventObj = characteristicObj.parseValue ? characteristicObj.parseValue(event.target.value):{};
						// Always include the raw event object in the object returned
						eventObj.rawValue = event;
						func(eventObj);
					});
				})
				.catch(err => {
					return errorHandler('start_notifications_error', err, characteristic_name);
				});
			})
	} // End startNotifications

	/**
	* Attempts to stop previously started notifications for a provided characteristic
	*
	* @param {String} characteristic_name - GATT characteristic name
	* FIXME: What do we want to return?
	* @return {Boolean} - Result of attempt to stop notifications where true === successfully written
	*/
	stopNotifications(characteristic_name) {
			/**
			* Check to see if characteristic exists in bluetooth.gattCharacteristicsMapping
			* and throw error if not found.
			*/
			if(!bluetooth.gattCharacteristicsMapping[characteristic_name]) {
				return errorHandler('characteristic_error', null, characteristic_name);
			}
			// Retrieve characteristic object and primary service from bluetooth.gattCharacteristicsMapping
			var characteristicObj = bluetooth.gattCharacteristicsMapping[characteristic_name];
			var primary_service_name = characteristicObj.primaryServices[0];
			/**
			* Check characteristic object to see if notifications are currently active
			* and attempt to stop notifications if active, otherwise throw error.
			*/
			if(this.cache[primary_service_name][characteristic_name].notifying) {
				// Call returnCharacteristic to retrieve characteristic from which to read
				// FIXME: Check bound context of 'this' here
				this.returnCharacteristic(characteristic_name)
					.then(characteristic =>{
						characteristic.stopNotifications()
						.then(() => {
							/**
							* After successfully stopping notifications from characteristic, update
							* cache to reflect current notification status.
							*/
							this.cache[primary_service_name][characteristic_name].notifying = false;
							// FIXME: what do we want to return here?
							return true;
						})
						.catch(err => {
							return errorHandler('stop_notifications_error', err, characteristic_name);
						})
					})
			}
			else {
				errorHandler('stop_notifications_not_notifying',null,characteristic_name);
			}
		} // End stopNotifications

		/**
		* Adds a new characteristic object to  bluetooth.gattCharacteristicsMapping
		*
		* @param {String} characteristic_name - GATT characteristic name or other characteristic
		* @param {String} primary_service_name - GATT primary service name or other parent service of characteristic
		* @param {Array} propertiesArr - Array of GATT properties as Strings
		* FIXME: What do we want to return?
		* @return {Boolean} - Result of attempt to add characteristic where true === successfully added
		*/
		addCharacteristic(characteristic_name, primary_service_name, propertiesArr) {
			/**
			* Check to see if characteristic exists in bluetooth.gattCharacteristicsMapping
			* and throw error if found.
			*/
			if(bluetooth.gattCharacteristicsMapping[characteristic_name]) {
				return errorHandler('add_characteristic_exists_error', null, characteristic_name);
			}
			// Check formatting of characteristic_name and throw error if improperly formatted
			if (!characteristic_name || characteristic_name.constructor !== String || !characteristic_name.length){
				return errorHandler(`improper_characteristic_format`,null, characteristic_name);
			}
			/**
			* If characteristic does not exist in bluetooth.gattCharacteristicsMapping
			* validate presence and format of other required parameters. Throw errors if
			* other required parameters are missing or improperly formatted.
			*/
			if (!bluetooth.gattCharacteristicsMapping[characteristic_name]) {
				// If missing any of other required parameters, throw error
				if (!primary_service_name || !propertiesArr) {
					return errorHandler(`new_characteristic_missing_params`,null, characteristic_name);
				}
				// Check formatting of primary_service_name and throw error if improperly formatted
				if (primary_service_name.constructor !== String || !primary_service_name.length){
					return errorHandler(`improper_service_format`,null, primary_service_name);
				}
				// Check formatting of propertiesArr and throw error if improperly formatted
				// TODO: Add validation and error handling for all properties in propertiesArr
				if (propertiesArr.constuctor !== Array || !propertiesArr.length) {
					return errorHandler(`improper_properties_format`,null, propertiesArr);
				}
				/**
				* If all parameters are present and properly formatted add new object to
				* bluetooth.gattCharacteristicsMapping and provide warning that added
				* characteristic is not fully supported.
				*/
				console.warn(`Attempting to add ${characteristic_name}. Full support
											for this characteristic is not provided.`);
				bluetooth.gattCharacteristicsMapping[characteristic_name] = {
					characteristic_name: {
						primaryServices: [primary_service_name],
						includedProperties: propertiesArr
					},
				}
				// FIXME: What do we want to return here?
				return true;
			}
		} // End addCharacteristic

		/**
		* Returns a cached characteristic or resolved characteristic after successful
		* connection with device
		*
		* @param {String} characteristic_name - GATT characteristic name
		* @return {Object} - If the method successfully retrieves the characteristic,
		*											that characteristic is returned
		*/
		returnCharacteristic(characteristic_name) {
			/**
			* Check to see if characteristic exists in bluetooth.gattCharacteristicsMapping
			* and throw error if not found.
			*/
			if(!bluetooth.gattCharacteristicsMapping[characteristic_name]) {
				return errorHandler('characteristic_error', null, characteristic_name);
			}
			/**
			* Retrieve characteristic object from bluetooth.gattCharacteristicsMapping
			* and establish primary service
			* FIXME: Consider characteristics that are children of multiple services
			*/
			 var characteristicObj = bluetooth.gattCharacteristicsMapping[characteristic_name];
			 var primary_service_name = characteristicObj.primaryServices[0];
			 /**
				* Check to see if requested characteristic has been cached from a previous
				* interaction of any type to characteristic_name and return if found
				*/
			 if (this.cache[primary_service_name][characteristic_name].cachedCharacteristic) {
					 return this.cache[primary_service_name][characteristic_name].cachedCharacteristic;
			 }
			 /**
				* Check to see if requested characteristic's parent primary service  has
				* been cached from a any previous interaction with that primary service
				*/
			 else if (this.cache[primary_service_name].cachedService) {
					/**
					* If parent primary service has been cached, use getCharacteristic method
					* on the cached service and cache resolved characteristic before returning
					*/
					this.cache[primary_service_name].cachedService.getCharacteristic(characteristic_name)
					.then(characteristic => {
						// Cache characteristic before returning characteristic
						this.cache[primary_service_name][characteristic_name] = {'cachedCharacteristic': characteristic};
						return characteristic;
					})
					.catch(err => {
						return errorHandler('returnCharacteristic_error', err, characteristic_name);
					});
				}
				/**
				* If neither characteristic nor any parent primary service of that characteristic
				* has been cached, use cached device server to access and cache both the
				* characteristic and primary parent service before returning characteristic
				*/
				else {
					return this.apiServer.getPrimaryService(primary_service_name)
					.then(service => {
						// Cache primary service before attempting to access characteristic
						this.cache[primary_service_name] = {'cachedService': service};
						return service.getCharacteristic(characteristic_name);
					})
					.then(characteristic => {
						// Cache characteristic before returning characteristic
						this.cache[primary_service_name][characteristic_name] = {'cachedCharacteristic': characteristic};
						return characteristic;
					})
					.catch(err => {
						return errorHandler('returnCharacteristic_error', err, characteristic_name);
					});
				}
		} // End returnCharacteristic

} // End Device constructor

const Bluetooth = {
	gattCharacteristicsMapping: {

		// battery_level characteristic
		battery_level: {
			primaryServices: ['battery_service'],
			includedProperties: ['read', 'notify'],
			parseValue: value => {
				value = value.buffer ? value : new DataView(value);
				let result = {};
				result.battery_level = value.getUint8(0);
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
				return result;
			},
			prepValue: value => {
				// TODO: determine max eligible byte length based on characteristic payload
				let buffer = new ArrayBuffer(value.length);
				let preppedValue = new DataView(buffer);
				value.split('').forEach((char, i)=>{
					preppedValue.setUint8(i, char.charCodeAt(0));
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
			includedProperties: ['read'],
			parseValue: value => {
				value = value.buffer ? value : new DataView(value);
				let result = {};
				let flags = value.getUint16(0);
				result.low_battery_detection_supported = flags & 0x1;
				result.sensor_malfunction_detection_supported = flags & 0x2;
				result.sensor_sample_size_supported = flags & 0x4;
				result.sensor_strip_insertion_error_detection_supported = flags & 0x8;
				result.sensor_strip_type_error_detection_supported = flags & 0x10;
				result.sensor_result_highLow_detection_supported = flags & 0x20;
				result.sensor_temperature_highLow_detection_supported = flags & 0x40;
				result.sensor_read_interruption_detection_supported = flags & 0x80;
				result.general_device_fault_supported = flags & 0x100;
				result.time_fault_supported = flags & 0x200;
				result.multiple_bond_supported = flags & 0x400;
				// Remaining flags reserved for future use
				return result;
			}
		},
		//http_entity_body characteristic
		http_entity_body: {
			primaryServices: ['http_proxy'],
			includedProperties: ['read', 'write']
		},
		glucose_measurement: {
			primaryServices: ['glucose'],
			includedProperties: ['notify'],
			parseValue: value => {
				value = value.buffer ? value : new DataView(value);
				let flags = value.getUint8(0);
				let timeOffset = flags & 0x1;
				let concentrationTypeSampleLoc = flags & 0x2;
				let concentrationUnits = flags & 0x4;
				let statusAnnunciation = flags & 0x8;
				let contextInformation = flags & 0x10;
				let result = {};
				let index = 1;

				// FIXME: THIS PARSING METHOD INCOMPLETE!!! AP TO FINISH!!!
				if (timeOffset) {
					result.time_offset = value.getInt16(index, /*little-endian=*/true);
					index += 2;
				}
				if (concentrationTypeSampleLoc){
					if(concentrationUnits){
						// FIXME: CURRENTLY GETTING SIGNED INT 16, NEED SIGNED FLOAT 16
						result.glucose_concentraiton_molPerL = value.getInt16(index, /*little-endian=*/true )
						index += 2;
					}
					else {
						// FIXME: CURRENTLY GETTING SIGNED INT 16, NEED SIGNED FLOAT 16
						result.glucose_concentraiton_kgPerL = value.getInt16(index, /*little-endian=*/true )
						index += 2;
					}
				}

				return result;
			}
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
				let val = value.getUint8(0);
				let result = {};
				switch (val) {
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
					result.heartRate = value.getUint16(index, /*little-endian=*/true);
					index += 2;
				} else {
					result.heartRate = value.getUint8(index);
					index += 1;
				}
				if (contactSensorPresent) {
					result.contactDetected = !!contactDetected;
				}
				if (energyPresent) {
					result.energyExpended = value.getUint16(index, /*little-endian=*/true);
					index += 2;
				}
				if (rrIntervalPresent) {
					let rrIntervals = [];
					for (; index + 1 < value.byteLength; index += 2) {
						rrIntervals.push(value.getUint16(index, /*little-endian=*/true));
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
		//environmental_sensing
		//FIXME: explore indications, writeAux, extProp and how to access
		descriptor_value_changed: {
			primaryServices: ['environmental_sensing'],
			includedProperties: ['indicate', 'writeAux', 'extProp'],
		},
		apparent_wind_direction: {
			primaryServices: ['environmental_sensing'],
			includedProperties: ['read', 'notify','writeAux', 'extProp'],
			parseValue: value => {
				value = value.buffer ? value : new DataView(value);
				let result = {};
				// TODO: test decimal resolution, -2 per protocol docs
				// FIXME: docs do not specify Endianness of values stored... assumed to be big-endian
				result.apparent_wind_direction = value.getUint16(0) * 0.01;
				return result;
			}
		},
		apparent_wind_speed: {
			primaryServices: ['environmental_sensing'],
			includedProperties: ['read', 'notify','writeAux', 'extProp'],
			parseValue: value => {
				value = value.buffer ? value : new DataView(value);
				let result = {};
				// TODO: test decimate resolution, -2 per protocol docs
				// FIXME: docs do not specify Endianness of values stored... assumed to be big-endian
				result.apparent_wind_speed = value.getUint16(0) * 0.01;
				return result;
			}
		},
		dew_point: {
			primaryServices: ['environmental_sensing'],
			includedProperties: ['read', 'notify','writeAux', 'extProp'],
			parseValue: value => {
				value = value.buffer ? value : new DataView(value);
				let result = {};
				result.dew_point = value.getInt8(0);
				return result;
			}
		},
		elevation: {
			primaryServices: ['environmental_sensing'],
			includedProperties: ['read', 'notify','writeAux', 'extProp'],
			parseValue: value => {
				value = value.buffer ? value : new DataView(value);
				let result = {};
				// elevation is a sint24, for which there is no native DataView prototype method
				// FIXME: docs do not specify Endianness of values stored... assumed to be big-endian
				result.elevation = value.getInt8(0) << 16 | value.getInt8(1) << 8 | value.getInt8(2);
				return result;
			}
		},
		gust_factor: {
			primaryServices: ['environmental_sensing'],
			includedProperties: ['read', 'notify','writeAux', 'extProp'],
			parseValue: value => {
				value = value.buffer ? value : new DataView(value);
				let result = {};
				result.gust_factor = value.getUint8(0) * 0.1;
				return result;
			}
		},
		heat_index: {
			primaryServices: ['environmental_sensing'],
			includedProperties: ['read', 'notify','writeAux', 'extProp'],
			parseValue: value => {
				value = value.buffer ? value : new DataView(value);
				let result = {};
				result.heat_index = value.getInt8(0);
				return result;
			}
		},
		humidity: {
			primaryServices: ['environmental_sensing'],
			includedProperties: ['read', 'notify','writeAux', 'extProp'],
			parseValue: value => {
				value = value.buffer ? value : new DataView(value);
				let result = {};
				// FIXME: docs do not specify Endianness of values stored... assumed to be big-endian
				result.humidity = value.getUint16(0) * 0.01;
				return result;
			}
		},
		irradiance: {
			primaryServices: ['environmental_sensing'],
			includedProperties: ['read', 'notify','writeAux', 'extProp'],
			parseValue: value => {
				value = value.buffer ? value : new DataView(value);
				let result = {};
				// FIXME: docs do not specify Endianness of values stored... assumed to be big-endian
				result.irradiance = value.getUint16(0) * 0.1;
				return result;
			}
		},
		rainfall: {
			primaryServices: ['environmental_sensing'],
			includedProperties: ['read', 'notify','writeAux', 'extProp'],
			parseValue: value => {
				value = value.buffer ? value : new DataView(value);
				let result = {};
				// FIXME: docs do not specify Endianness of values stored... assumed to be big-endian
				result.rainfall = value.getUint16(0) * 0.001;
				return result;
			}
		},
		pressure: {
			primaryServices: ['environmental_sensing'],
			includedProperties: ['read', 'notify','writeAux', 'extProp'],
			parseValue: value => {
				value = value.buffer ? value : new DataView(value);
				let result = {};
				// FIXME: docs do not specify Endianness of values stored... assumed to be big-endian
				result.pressure = value.getUint32(0) * 0.1;
				return result;
			}
		},
		temperature: {
			primaryServices: ['environmental_sensing'],
			includedProperties: ['read', 'notify','writeAux', 'extProp'],
			parseValue: value => {
				value = value.buffer ? value : new DataView(value);
				let result = {};
				// FIXME: docs do not specify Endianness of values stored... assumed to be big-endian
				result.temperature = value.getInt16(0) * 0.01;
				return result;
			}
		},
		true_wind_direction: {
			primaryServices: ['environmental_sensing'],
			includedProperties: ['read', 'notify','writeAux', 'extProp'],
			parseValue: value => {
				value = value.buffer ? value : new DataView(value);
				let result = {};
				// FIXME: docs do not specify Endianness of values stored... assumed to be big-endian
				result.true_wind_direction = value.getUint16(0) * 0.01;
				return result;
			}
		},
		true_wind_speed: {
			primaryServices: ['environmental_sensing'],
			includedProperties: ['read', 'notify','writeAux', 'extProp'],
			parseValue: value => {
				value = value.buffer ? value : new DataView(value);
				let result = {};
				// FIXME: docs do not specify Endianness of values stored... assumed to be big-endian
				result.true_wind_speed = value.getUint16(0) * 0.01;
				return result;
			}
		},
		uv_index: {
			primaryServices: ['environmental_sensing'],
			includedProperties: ['read', 'notify','writeAux', 'extProp'],
			parseValue: value => {
				value = value.buffer ? value : new DataView(value);
				let result = {};
				result.uv_index = value.getUint8(0);
				return result;
			}
		},
		wind_chill: {
			primaryServices: ['environmental_sensing'],
			includedProperties: ['read', 'notify','writeAux', 'extProp'],
			parseValue: value => {
				value = value.buffer ? value : new DataView(value);
				let result = {};
				result.wind_chill = value.getInt8(0);
				return result;
			}
		},
		barometric_pressure_trend: {
			primaryServices: ['environmental_sensing'],
			includedProperties: ['read', 'notify','writeAux', 'extProp'],
			parseValue: value => {
				value = value.buffer ? value : new DataView(value);
				let val = value.getUint8(0);
				let result = {};
				switch (val) {
					case 0: result.barometric_pressure_trend = 'Unknown';
					case 1: result.barometric_pressure_trend = 'Continuously falling';
					case 2: result.barometric_pressure_trend = 'Continously rising';
					case 3: result.barometric_pressure_trend = 'Falling, then steady';
					case 4: result.barometric_pressure_trend = 'Rising, then steady';
					case 5: result.barometric_pressure_trend = 'Falling before a lesser rise';
					case 6: result.barometric_pressure_trend = 'Falling before a greater rise';
					case 7: result.barometric_pressure_trend = 'Rising before a greater fall';
					case 8: result.barometric_pressure_trend = 'Rising before a lesser fall';
					case 9: result.barometric_pressure_trend = 'Steady';
					default: result.barometric_pressure_trend = 'Could not resolve to trend';
				}
				return result;
			}
		},
		magnetic_declination: {
			primaryServices: ['environmental_sensing'],
			includedProperties: ['read', 'notify','writeAux', 'extProp'],
			parseValue: value => {
				value = value.buffer ? value : new DataView(value);
				let result = {};
				// FIXME: docs do not specify Endianness of values stored... assumed to be big-endian
				result.magnetic_declination = value.getUint16(0) * 0.01;
				return result;
			}
		},
		magnetic_flux_density_2D: {
			primaryServices: ['environmental_sensing'],
			includedProperties: ['read', 'notify','writeAux', 'extProp'],
			parseValue: value => {
				value = value.buffer ? value : new DataView(value);
				let result = {};
				//FIXME: need to find out if these values are stored at different byte addresses
				//       below assumes that values are stored at successive byte addresses
				result.magnetic_flux_density_x_axis = value.getInt16(0,/*little-endian=*/ true) * 0.0000001;
				result.magnetic_flux_density_y_axis = value.getInt16(2,/*little-endian=*/ true) * 0.0000001;
				return result;
			}
		},
		magnetic_flux_density_3D: {
			primaryServices: ['environmental_sensing'],
			includedProperties: ['read', 'notify','writeAux', 'extProp'],
			parseValue: value => {
				value = value.buffer ? value : new DataView(value);
				let result = {};
				//FIXME: need to find out if these values are stored at different byte addresses
				//       below assumes that values are stored at successive byte addresses
				result.magnetic_flux_density_x_axis = value.getInt16(0,/*little-endian=*/ true) * 0.0000001;
				result.magnetic_flux_density_y_axis = value.getInt16(2,/*little-endian=*/ true) * 0.0000001;
				result.magnetic_flux_density_z_axis = value.getInt16(4,/*little-endian=*/ true) * 0.0000001;
				return result;
			}
		},
		tx_power_level: {
			primaryServices: ['tx_power'],
			includedProperties: ['read'],
			parseValue: value => {
				value = value.buffer ? value : new DataView(value);
				let result = {};
				result.tx_power_level = value.getInt8(0);
				return result;
			}
		},
		weight_scale_feature: {
			primaryServices: ['weight_scale'],
			includedProperties: ['read'],
			parseValue: value => {
				value = value.buffer ? value : new DataView(value);
				let result = {};
				let flags = value.getInt32(0);
				result.time_stamp_supported = flags & 0x1;
				result.multiple_sensors_supported = flags & 0x2;
				result.BMI_supported = flags & 0x4;
				switch (flags & 0x78 >> 3) {
					case 0: result.weight_measurement_resolution = 'Not specified';
					case 1: result.weight_measurement_resolution = 'Resolution of 0.5 kg or 1 lb';
					case 2: result.weight_measurement_resolution = 'Resolution of 0.2 kg or 0.5 lb';
					case 3: result.weight_measurement_resolution = 'Resolution of 0.1 kg or 0.2 lb';
					case 4: result.weight_measurement_resolution = 'Resolution of 0.05 kg or 0.1 lb';
					case 5: result.weight_measurement_resolution = 'Resolution of 0.02 kg or 0.05 lb';
					case 6: result.weight_measurement_resolution = 'Resolution of 0.01 kg or 0.02 lb';
					case 7: result.weight_measurement_resolution = 'Resolution of 0.005 kg or 0.01 lb';
					default: result.weight_measurement_resolution = 'Could not resolve';
				}
				switch (flags & 0x380 >> 7) {
					case 0: result.height_measurement_resolution = 'Not specified';
					case 1: result.height_measurement_resolution = 'Resolution of 0.1 meter or 1 inch';
					case 2: result.height_measurement_resolution = 'Resolution of 0.005 meter or 0.5 inch';
					case 3: result.height_measurement_resolution = 'Resolution of 0.001 meter or 0.1 inch';
					default: result.height_measurement_resolution = 'Could not resolve';
				}
				// Remaining flags reserved for future use
				return result;
			}
		},
		csc_measurement: {
			primaryServices: ['cycling_speed_and_cadence'],
			includedProperties: ['notify'],
			parseValue: value => {
				value = value.buffer ? value : new DataView(value);

				let flags = value.getUint8(0);
				let wheelRevolution = flags & 0x1;
				let crankRevolution = flags & 0x2;

				let index = 1;

				if(wheelRevolution) {
					result.cumulative_wheel_revolutions =
				}

				let result = {};
				result.tx_power_level = value.getInt8(0);
				return result;
			}
		},
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
}

/**
*
*
*/
function errorHandler(error, nativeError, alternateParam) {
	// Big object mapping error codes (keys) to error messages (values)
	const errorMap = {
		add_characteristic_exists_error: `Characteristic ${alternateParam} already exists.`,
		characteristic_error: `Characteristic ${alternateParam} not found. Add ${alternateParam} to device using addCharacteristic or try another characteristic.`,
		connect_gatt: `Error. Could not connect to GATT. Device might be out of range. Also check to see if filters are vaild.`,
		connect_server: `Error. Could not connect to server on device.`,
		connect_service: `Error. Could not find service.`,
		disconnect_timeout: `Timed out. Could not disconnect.`,
		disconnect_error: `Error. Could not disconnect from device.`,
		improper_characteristic_format: `Error. ${alternateParam} is not a properly formatted characteristic.`,
		improper_properties_format: `Error. ${alternateParam} is not a properly formatted properties array.`,
		improper_service_format: `Error. ${alternateParam} is not a properly formatted service.`,
    issue_disconnecting: `Issue disconnecting with device.`,
		new_characteristic_missing_params: `Error. ${alternateParam} is not a fully supported characteristic. Please provide an associated primary service and at least one property.`,
		no_device: `Error. No instance of device found.`,
		no_filters: `No filters found on instance of Device. For more information, please visit http://sabertooth-io.github.io/#method-newdevice`,
		no_read_property: `No read property on characteristic: ${alternateParam}.`,
		no_write_property: `No write property on this characteristic.`,
    not_connected: `Could not disconnect. Device not connected.`,
		parsing_not_supported: `Parsing not supported for characterstic: ${alternateParam}.`,
		postValue_error: `Error. Could not post value to device.`,
		read_error: `Error. Cannot read value on the characteristic.`,
		returnCharacteristic_error: `Error accessing characteristic ${alternateParam}.`,
		start_notifications_error: `Error. Not able to read stream of data from characteristic: ${alternateParam}.`,
		start_notifications_no_notify: `Error. No notify property found on this characteristic: ${alternateParam}.`,
		stop_notifications_not_notifying: `Notifications not established for characteristic: ${alternateParam} or you have not started notifications.`,
		stop_notifications_error: `Issue stopping notifications for characteristic: ${alternateParam} or you have not started notifications.`,
		user_cancelled: `User cancelled the permission request.`,
		uuid_error: `Error. Invalid UUID. For more information on proper formatting of UUIDs, visit https://webbluetoothcg.github.io/web-bluetooth/#uuids`,
		write_error: `Error. Could not change value of characteristic: ${alternateParam}.`,
    write_permissions: `Error. ${alternateParam} characteristic does not have a write property.`
	}
  if(nativeError) {
    throw new Error(`${errorMap[error]} ${nativeError}`);
  }
  else {
    throw new Error(errorMap[error]);
  }
}
