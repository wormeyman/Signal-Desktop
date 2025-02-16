// Copyright 2020 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

import * as React from 'react';
import { storiesOf } from '@storybook/react';
import { text, withKnobs } from '@storybook/addon-knobs';
import { action } from '@storybook/addon-actions';

import { setup as setupI18n } from '../../../../js/modules/i18n';
import enMessages from '../../../../_locales/en/messages.json';
import { MediaItemType } from '../../LightboxGallery';
import { AttachmentType } from '../../../types/Attachment';
import { stringToMIMEType } from '../../../types/MIME';

import { MediaGridItem, Props } from './MediaGridItem';
import { Message } from './types/Message';

const i18n = setupI18n('en', enMessages);

const story = storiesOf(
  'Components/Conversation/MediaGallery/MediaGridItem',
  module
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
story.addDecorator((withKnobs as any)({ escapeHTML: false }));

const createProps = (
  overrideProps: Partial<Props> & { mediaItem: MediaItemType }
): Props => ({
  i18n,
  mediaItem: overrideProps.mediaItem,
  onClick: action('onClick'),
});

const createMediaItem = (
  overrideProps: Partial<MediaItemType> = {}
): MediaItemType => ({
  thumbnailObjectUrl: text(
    'thumbnailObjectUrl',
    overrideProps.thumbnailObjectUrl || ''
  ),
  contentType: stringToMIMEType(
    text('contentType', overrideProps.contentType || '')
  ),
  index: 0,
  attachment: {} as AttachmentType, // attachment not useful in the component
  message: {} as Message, // message not used in the component
});

story.add('Image', () => {
  const mediaItem = createMediaItem({
    thumbnailObjectUrl: '/fixtures/kitten-1-64-64.jpg',
    contentType: stringToMIMEType('image/jpeg'),
  });

  const props = createProps({
    mediaItem,
  });

  return <MediaGridItem {...props} />;
});

story.add('Video', () => {
  const mediaItem = createMediaItem({
    thumbnailObjectUrl: '/fixtures/kitten-2-64-64.jpg',
    contentType: stringToMIMEType('video/mp4'),
  });

  const props = createProps({
    mediaItem,
  });

  return <MediaGridItem {...props} />;
});

story.add('Missing Image', () => {
  const mediaItem = createMediaItem({
    contentType: stringToMIMEType('image/jpeg'),
  });

  const props = createProps({
    mediaItem,
  });

  return <MediaGridItem {...props} />;
});

story.add('Missing Video', () => {
  const mediaItem = createMediaItem({
    contentType: stringToMIMEType('video/mp4'),
  });

  const props = createProps({
    mediaItem,
  });

  return <MediaGridItem {...props} />;
});

story.add('Broken Image', () => {
  const mediaItem = createMediaItem({
    thumbnailObjectUrl: '/missing-fixtures/nope.jpg',
    contentType: stringToMIMEType('image/jpeg'),
  });

  const props = createProps({
    mediaItem,
  });

  return <MediaGridItem {...props} />;
});

story.add('Broken Video', () => {
  const mediaItem = createMediaItem({
    thumbnailObjectUrl: '/missing-fixtures/nope.mp4',
    contentType: stringToMIMEType('video/mp4'),
  });

  const props = createProps({
    mediaItem,
  });

  return <MediaGridItem {...props} />;
});

story.add('Other ContentType', () => {
  const mediaItem = createMediaItem({
    contentType: stringToMIMEType('application/text'),
  });

  const props = createProps({
    mediaItem,
  });

  return <MediaGridItem {...props} />;
});
