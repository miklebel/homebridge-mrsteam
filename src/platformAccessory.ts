/* eslint-disable max-len */
import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import axios from 'axios';

import { SteamlinxHomebridgeHomebridgePlugin, SteamConfig } from './platform';

enum CommandId {
  on = 'steam',
  confirm = 'steam-confirm',
  off = 'steam-off',
}

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class MrSteamPlatformAccessory {
  private service: Service;

  private state = {
    steamStatus: false,
  };

  constructor(
    private readonly platform: SteamlinxHomebridgeHomebridgePlugin,
    private readonly accessory: PlatformAccessory,
    private readonly deviceConfig: SteamConfig,
  ) {
    // set accessory information
    this.accessory
      .getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(
        this.platform.Characteristic.Manufacturer,
        'Default-Manufacturer',
      )
      .setCharacteristic(this.platform.Characteristic.Model, 'Default-Model')
      .setCharacteristic(
        this.platform.Characteristic.SerialNumber,
        'Default-Serial',
      );

    // get the LightBulb service if it exists, otherwise create a new LightBulb service
    // you can create multiple services for each accessory
    this.service =
      this.accessory.getService(this.platform.Service.Switch) ||
      this.accessory.addService(this.platform.Service.Switch);

    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.service.setCharacteristic(
      this.platform.Characteristic.Name,
      this.deviceConfig.DeviceName,
    );

    // each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/Lightbulb

    // register handlers for the On/Off Characteristic
    this.service
      .getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setOn.bind(this)) // SET - bind to the `setOn` method below
      .onGet(this.getOn.bind(this)); // GET - bind to the `getOn` method below
  }

  /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory, for example, turning on a Light bulb.
   */
  async setOn(value: CharacteristicValue) {
    // implement your own code to turn your device on/off
    this.state.steamStatus = value as boolean;

    switch (value) {
      case true:
        await axios.get(
          `https://api.voicemonkey.io/trigger?access_token=${this.deviceConfig.VMAccessToken}&secret_token=${this.deviceConfig.VMSecretToken}&monkey=${CommandId.on}`,
        );
        await new Promise((res) => setTimeout(() => res, 4000));
        await axios.get(
          `https://api.voicemonkey.io/trigger?access_token=${this.deviceConfig.VMAccessToken}&secret_token=${this.deviceConfig.VMSecretToken}&monkey=${CommandId.confirm}`,
        );
        break;

      case false:
        await axios.get(
          `https://api.voicemonkey.io/trigger?access_token=${this.deviceConfig.VMAccessToken}&secret_token=${this.deviceConfig.VMSecretToken}&monkey=${CommandId.off}`,
        );

        break;

      default:
        break;
    }

    this.platform.log.debug('Set Characteristic On ->', value);
  }

  /**
   * Handle the "GET" requests from HomeKit
   * These are sent when HomeKit wants to know the current state of the accessory, for example, checking if a Light bulb is on.
   *
   * GET requests should return as fast as possbile. A long delay here will result in
   * HomeKit being unresponsive and a bad user experience in general.
   *
   * If your device takes time to respond you should update the status of your device
   * asynchronously instead using the `updateCharacteristic` method instead.

   * @example
   * this.service.updateCharacteristic(this.platform.Characteristic.On, true)
   */
  async getOn(): Promise<CharacteristicValue> {
    // implement your own code to check if the device is on
    const isOn = this.state.steamStatus;

    this.platform.log.debug('Get Characteristic On ->', isOn);

    // if you need to return an error to show the device as "Not Responding" in the Home app:
    // throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);

    return isOn;
  }
}
