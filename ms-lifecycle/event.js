const catalog = require('../opt/nodejs/asn-common/catalog.js');
const logger = require('../opt/nodejs/asn-common/logger.js')(
  catalog.LOG_PREFIX.LIFECYCLE
);
const utils = require('../opt/nodejs/asn-common/utils');
const observationEventsTypes = catalog.EVENTS_TYPES.PRODUCT_OBSERVATION;

/**
 * LifecycleEvent.
 * This class contains the necessary information to define a Lifecycle Event.
 */
class LifecycleEvent {
  /**
   * Constructor.
   * @param {json} type event type
   * @param {string} observationDate event observation date
   * @param {json} notificationVariables notification variables
   * @param {boolean} forceNotification true in order to notify even if the observation date does not match with today
   */
  constructor(type, observationDate, notificationVariables, forceNotification) {
    this.type = type;
    this.observationDate = observationDate;
    this.notification = this.initNotification(type, notificationVariables);
    this.forceNotification = forceNotification;
  }

  /**
   * It initializes the event notification
   * @param {string} type event notification type
   * @param {array} notificationVariables notification variables
   */
  initNotification(type, notificationVariables) {
    let notificationMessage = new appsync.Message(
      type,
      true,
      undefined,
      undefined,
      notificationVariables
    );
    this.notification = new appsync.Notification(notificationMessage);
  }

  /**
   * It validates if the event type is notifiable or not
   * @returns true if the event is notifiable
   */
  isANotifiableEventType() {
    return ![
      observationEventsTypes.CANCEL_COUPON,
      observationEventsTypes.EXTRA_CANCEL_COUPON,
      observationEventsTypes.BARRIER_COUPON,
      observationEventsTypes.GUARANTEED_COUPON,
      observationEventsTypes.MIN_COUPON,
    ].includes(this.type);
  }

  /**
   * It validates if the event must be notified or not
   * @returns true to notify
   */
  mustBeNotified() {
    return (
      (this.isANotifiableEventType() &&
        this.observationDate == utils.getCurrentDateStr()) ||
      this.forceNotification
    );
  }

  /**
   * It notifies users via appsync
   * @param tradeUuid trade unique identifier to which the notification is associated
   * @param recipientUsersUuids users unique identifiers to be notified
   */
  async notify(tradeUuid, recipientUsersUuids) {
    if (this.mustBeNotified()) {
      logger.info('Sending event notification to users:', recipientUsersUuids);
      this.notification.tradeUuid = tradeUuid;
      for (let i = 0; i < recipientUsersUuids.length; i++) {
        this.notification.userUuid = recipientUsersUuids[i];
        console.info('Notify:', JSON.stringy(this.notification, null, 2));
      }
    }
  }
}

module.exports = {
  LifecycleEvent,
};
