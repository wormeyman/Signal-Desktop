// Copyright 2020-2021 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

import moment from 'moment';
import { LocalizerType } from '../types/Util';
import { getMutedUntilText } from './getMutedUntilText';
import { isMuted } from './isMuted';

export type MuteOption = {
  name: string;
  disabled?: boolean;
  value: number;
};

export function getMuteOptions(
  muteExpiresAt: undefined | number,
  i18n: LocalizerType
): Array<MuteOption> {
  return [
    ...(isMuted(muteExpiresAt)
      ? [
          {
            name: getMutedUntilText(muteExpiresAt, i18n),
            disabled: true,
            value: -1,
          },
          {
            name: i18n('unmute'),
            value: 0,
          },
        ]
      : []),
    {
      name: i18n('muteHour'),
      value: moment.duration(1, 'hour').as('milliseconds'),
    },
    {
      name: i18n('muteEightHours'),
      value: moment.duration(8, 'hour').as('milliseconds'),
    },
    {
      name: i18n('muteDay'),
      value: moment.duration(1, 'day').as('milliseconds'),
    },
    {
      name: i18n('muteWeek'),
      value: moment.duration(1, 'week').as('milliseconds'),
    },
    {
      name: i18n('muteAlways'),
      value: Number.MAX_SAFE_INTEGER,
    },
  ];
}
