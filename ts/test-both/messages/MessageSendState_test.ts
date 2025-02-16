// Copyright 2021 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

import { assert } from 'chai';
import { sampleSize, times } from 'lodash';
import { v4 as uuid } from 'uuid';

import {
  SendAction,
  SendActionType,
  SendState,
  SendStateByConversationId,
  SendStatus,
  isDelivered,
  isMessageJustForMe,
  isRead,
  isSent,
  isViewed,
  maxStatus,
  sendStateReducer,
  someSendStatus,
} from '../../messages/MessageSendState';

describe('message send state utilities', () => {
  describe('maxStatus', () => {
    const expectedOrder = [
      SendStatus.Failed,
      SendStatus.Pending,
      SendStatus.Sent,
      SendStatus.Delivered,
      SendStatus.Read,
      SendStatus.Viewed,
    ];

    it('returns the input if arguments are equal', () => {
      expectedOrder.forEach(status => {
        assert.strictEqual(maxStatus(status, status), status);
      });
    });

    it('orders the statuses', () => {
      times(100, () => {
        const [a, b] = sampleSize(expectedOrder, 2);
        const isABigger = expectedOrder.indexOf(a) > expectedOrder.indexOf(b);
        const expected = isABigger ? a : b;

        const actual = maxStatus(a, b);
        assert.strictEqual(actual, expected);
      });
    });
  });

  describe('isViewed', () => {
    it('returns true for viewed statuses', () => {
      assert.isTrue(isViewed(SendStatus.Viewed));
    });

    it('returns false for non-viewed statuses', () => {
      assert.isFalse(isViewed(SendStatus.Read));
      assert.isFalse(isViewed(SendStatus.Delivered));
      assert.isFalse(isViewed(SendStatus.Sent));
      assert.isFalse(isViewed(SendStatus.Pending));
      assert.isFalse(isViewed(SendStatus.Failed));
    });
  });

  describe('isRead', () => {
    it('returns true for read and viewed statuses', () => {
      assert.isTrue(isRead(SendStatus.Read));
      assert.isTrue(isRead(SendStatus.Viewed));
    });

    it('returns false for non-read statuses', () => {
      assert.isFalse(isRead(SendStatus.Delivered));
      assert.isFalse(isRead(SendStatus.Sent));
      assert.isFalse(isRead(SendStatus.Pending));
      assert.isFalse(isRead(SendStatus.Failed));
    });
  });

  describe('isDelivered', () => {
    it('returns true for delivered, read, and viewed statuses', () => {
      assert.isTrue(isDelivered(SendStatus.Delivered));
      assert.isTrue(isDelivered(SendStatus.Read));
      assert.isTrue(isDelivered(SendStatus.Viewed));
    });

    it('returns false for non-delivered statuses', () => {
      assert.isFalse(isDelivered(SendStatus.Sent));
      assert.isFalse(isDelivered(SendStatus.Pending));
      assert.isFalse(isDelivered(SendStatus.Failed));
    });
  });

  describe('isSent', () => {
    it('returns true for all statuses sent and "above"', () => {
      assert.isTrue(isSent(SendStatus.Sent));
      assert.isTrue(isSent(SendStatus.Delivered));
      assert.isTrue(isSent(SendStatus.Read));
      assert.isTrue(isSent(SendStatus.Viewed));
    });

    it('returns false for non-sent statuses', () => {
      assert.isFalse(isSent(SendStatus.Pending));
      assert.isFalse(isSent(SendStatus.Failed));
    });
  });

  describe('someSendStatus', () => {
    it('returns false if there are no send states', () => {
      const alwaysTrue = () => true;
      assert.isFalse(someSendStatus(undefined, alwaysTrue));
      assert.isFalse(someSendStatus({}, alwaysTrue));
    });

    it('returns false if no send states match', () => {
      const sendStateByConversationId: SendStateByConversationId = {
        abc: {
          status: SendStatus.Sent,
          updatedAt: Date.now(),
        },
        def: {
          status: SendStatus.Read,
          updatedAt: Date.now(),
        },
      };

      assert.isFalse(
        someSendStatus(
          sendStateByConversationId,
          (status: SendStatus) => status === SendStatus.Delivered
        )
      );
    });

    it('returns true if at least one send state matches', () => {
      const sendStateByConversationId: SendStateByConversationId = {
        abc: {
          status: SendStatus.Sent,
          updatedAt: Date.now(),
        },
        def: {
          status: SendStatus.Read,
          updatedAt: Date.now(),
        },
      };

      assert.isTrue(
        someSendStatus(
          sendStateByConversationId,
          (status: SendStatus) => status === SendStatus.Read
        )
      );
    });
  });

  describe('isMessageJustForMe', () => {
    const ourConversationId = uuid();

    it('returns false if the conversation has an empty send state', () => {
      assert.isFalse(isMessageJustForMe(undefined, ourConversationId));
      assert.isFalse(isMessageJustForMe({}, ourConversationId));
    });

    it('returns false if the message is for anyone else', () => {
      assert.isFalse(
        isMessageJustForMe(
          {
            [ourConversationId]: {
              status: SendStatus.Sent,
              updatedAt: 123,
            },
            [uuid()]: {
              status: SendStatus.Pending,
              updatedAt: 123,
            },
          },
          ourConversationId
        )
      );
      // This is an invalid state, but we still want to test the behavior.
      assert.isFalse(
        isMessageJustForMe(
          {
            [uuid()]: {
              status: SendStatus.Pending,
              updatedAt: 123,
            },
          },
          ourConversationId
        )
      );
    });

    it('returns true if the message is just for you', () => {
      assert.isTrue(
        isMessageJustForMe(
          {
            [ourConversationId]: {
              status: SendStatus.Sent,
              updatedAt: 123,
            },
          },
          ourConversationId
        )
      );
    });
  });

  describe('sendStateReducer', () => {
    const assertTransition = (
      startStatus: SendStatus,
      actionType: SendActionType,
      expectedStatus: SendStatus
    ): void => {
      const startState: SendState = {
        status: startStatus,
        updatedAt: 1,
      };
      const action: SendAction = {
        type: actionType,
        updatedAt: 2,
      };
      const result = sendStateReducer(startState, action);
      assert.strictEqual(result.status, expectedStatus);
      assert.strictEqual(
        result.updatedAt,
        startStatus === expectedStatus ? 1 : 2
      );
    };

    describe('transitions from Pending', () => {
      it('goes from Pending → Failed with a failure', () => {
        const result = sendStateReducer(
          { status: SendStatus.Pending, updatedAt: 999 },
          { type: SendActionType.Failed, updatedAt: 123 }
        );
        assert.deepEqual(result, {
          status: SendStatus.Failed,
          updatedAt: 123,
        });
      });

      it('does nothing when receiving ManuallyRetried', () => {
        assertTransition(
          SendStatus.Pending,
          SendActionType.ManuallyRetried,
          SendStatus.Pending
        );
      });

      it('goes from Pending to all other sent states', () => {
        assertTransition(
          SendStatus.Pending,
          SendActionType.Sent,
          SendStatus.Sent
        );
        assertTransition(
          SendStatus.Pending,
          SendActionType.GotDeliveryReceipt,
          SendStatus.Delivered
        );
        assertTransition(
          SendStatus.Pending,
          SendActionType.GotReadReceipt,
          SendStatus.Read
        );
        assertTransition(
          SendStatus.Pending,
          SendActionType.GotViewedReceipt,
          SendStatus.Viewed
        );
      });
    });

    describe('transitions from Failed', () => {
      it('does nothing when receiving a Failed action', () => {
        const result = sendStateReducer(
          {
            status: SendStatus.Failed,
            updatedAt: 123,
          },
          {
            type: SendActionType.Failed,
            updatedAt: 999,
          }
        );
        assert.deepEqual(result, {
          status: SendStatus.Failed,
          updatedAt: 123,
        });
      });

      it('goes from Failed to all other states', () => {
        assertTransition(
          SendStatus.Failed,
          SendActionType.ManuallyRetried,
          SendStatus.Pending
        );
        assertTransition(
          SendStatus.Failed,
          SendActionType.Sent,
          SendStatus.Sent
        );
        assertTransition(
          SendStatus.Failed,
          SendActionType.GotDeliveryReceipt,
          SendStatus.Delivered
        );
        assertTransition(
          SendStatus.Failed,
          SendActionType.GotReadReceipt,
          SendStatus.Read
        );
        assertTransition(
          SendStatus.Failed,
          SendActionType.GotViewedReceipt,
          SendStatus.Viewed
        );
      });
    });

    describe('transitions from Sent', () => {
      it('does nothing when trying to go "backwards"', () => {
        [SendActionType.Failed, SendActionType.ManuallyRetried].forEach(
          type => {
            assertTransition(SendStatus.Sent, type, SendStatus.Sent);
          }
        );
      });

      it('does nothing when receiving a Sent action', () => {
        assertTransition(SendStatus.Sent, SendActionType.Sent, SendStatus.Sent);
      });

      it('can go forward to other states', () => {
        assertTransition(
          SendStatus.Sent,
          SendActionType.GotDeliveryReceipt,
          SendStatus.Delivered
        );
        assertTransition(
          SendStatus.Sent,
          SendActionType.GotReadReceipt,
          SendStatus.Read
        );
        assertTransition(
          SendStatus.Sent,
          SendActionType.GotViewedReceipt,
          SendStatus.Viewed
        );
      });
    });

    describe('transitions from Delivered', () => {
      it('does nothing when trying to go "backwards"', () => {
        [
          SendActionType.Failed,
          SendActionType.ManuallyRetried,
          SendActionType.Sent,
        ].forEach(type => {
          assertTransition(SendStatus.Delivered, type, SendStatus.Delivered);
        });
      });

      it('does nothing when receiving a delivery receipt', () => {
        assertTransition(
          SendStatus.Delivered,
          SendActionType.GotDeliveryReceipt,
          SendStatus.Delivered
        );
      });

      it('can go forward to other states', () => {
        assertTransition(
          SendStatus.Delivered,
          SendActionType.GotReadReceipt,
          SendStatus.Read
        );
        assertTransition(
          SendStatus.Delivered,
          SendActionType.GotViewedReceipt,
          SendStatus.Viewed
        );
      });
    });

    describe('transitions from Read', () => {
      it('does nothing when trying to go "backwards"', () => {
        [
          SendActionType.Failed,
          SendActionType.ManuallyRetried,
          SendActionType.Sent,
          SendActionType.GotDeliveryReceipt,
        ].forEach(type => {
          assertTransition(SendStatus.Read, type, SendStatus.Read);
        });
      });

      it('does nothing when receiving a read receipt', () => {
        assertTransition(
          SendStatus.Read,
          SendActionType.GotReadReceipt,
          SendStatus.Read
        );
      });

      it('can go forward to the "viewed" state', () => {
        assertTransition(
          SendStatus.Read,
          SendActionType.GotViewedReceipt,
          SendStatus.Viewed
        );
      });
    });

    describe('transitions from Viewed', () => {
      it('ignores all actions', () => {
        [
          SendActionType.Failed,
          SendActionType.ManuallyRetried,
          SendActionType.Sent,
          SendActionType.GotDeliveryReceipt,
          SendActionType.GotReadReceipt,
          SendActionType.GotViewedReceipt,
        ].forEach(type => {
          assertTransition(SendStatus.Viewed, type, SendStatus.Viewed);
        });
      });
    });

    describe('legacy transitions', () => {
      it('allows actions without timestamps', () => {
        const startState: SendState = {
          status: SendStatus.Pending,
          updatedAt: Date.now(),
        };
        const action: SendAction = {
          type: SendActionType.Sent,
          updatedAt: undefined,
        };
        const result = sendStateReducer(startState, action);
        assert.isUndefined(result.updatedAt);
      });
    });
  });
});
