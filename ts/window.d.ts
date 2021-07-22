// Copyright 2020-2021 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

// Captures the globals put in place by preload.js, background.js and others

import { DeepPartial, Store } from 'redux';
import * as Backbone from 'backbone';
import * as Underscore from 'underscore';
import moment from 'moment';
import PQueue from 'p-queue/dist';
import { Ref } from 'react';
import { imageToBlurHash } from './util/imageToBlurHash';
import * as Util from './util';
import {
  ConversationModelCollectionType,
  MessageModelCollectionType,
  MessageAttributesType,
  ReactionAttributesType,
  ReactionModelType,
} from './model-types.d';
import { TextSecureType, DownloadAttachmentType } from './textsecure.d';
import { Storage } from './textsecure/Storage';
import {
  ChallengeHandler,
  IPCRequest as IPCChallengeRequest,
} from './challenge';
import { WebAPIConnectType } from './textsecure/WebAPI';
import { uploadDebugLogs } from './logging/debuglogs';
import { CallingClass } from './services/calling';
import * as Groups from './groups';
import * as Crypto from './Crypto';
import * as Curve from './Curve';
import * as RemoteConfig from './RemoteConfig';
import * as OS from './OS';
import { getEnvironment } from './environment';
import * as zkgroup from './util/zkgroup';
import { LocalizerType, BodyRangesType, BodyRangeType } from './types/Util';
import * as Attachment from './types/Attachment';
import * as MIME from './types/MIME';
import * as Contact from './types/Contact';
import * as Errors from '../js/modules/types/errors';
import { ConversationController } from './ConversationController';
import { ReduxActions } from './state/types';
import { createStore } from './state/createStore';
import { createApp } from './state/roots/createApp';
import { createChatColorPicker } from './state/roots/createChatColorPicker';
import { createCompositionArea } from './state/roots/createCompositionArea';
import { createContactModal } from './state/roots/createContactModal';
import { createConversationDetails } from './state/roots/createConversationDetails';
import { createConversationHeader } from './state/roots/createConversationHeader';
import { createForwardMessageModal } from './state/roots/createForwardMessageModal';
import { createGroupLinkManagement } from './state/roots/createGroupLinkManagement';
import { createGroupV1MigrationModal } from './state/roots/createGroupV1MigrationModal';
import { createGroupV2JoinModal } from './state/roots/createGroupV2JoinModal';
import { createGroupV2Permissions } from './state/roots/createGroupV2Permissions';
import { createLeftPane } from './state/roots/createLeftPane';
import { createMessageDetail } from './state/roots/createMessageDetail';
import { createPendingInvites } from './state/roots/createPendingInvites';
import { createSafetyNumberViewer } from './state/roots/createSafetyNumberViewer';
import { createShortcutGuideModal } from './state/roots/createShortcutGuideModal';
import { createStickerManager } from './state/roots/createStickerManager';
import { createStickerPreviewModal } from './state/roots/createStickerPreviewModal';
import { createTimeline } from './state/roots/createTimeline';
import * as appDuck from './state/ducks/app';
import * as callingDuck from './state/ducks/calling';
import * as conversationsDuck from './state/ducks/conversations';
import * as emojisDuck from './state/ducks/emojis';
import * as expirationDuck from './state/ducks/expiration';
import * as itemsDuck from './state/ducks/items';
import * as linkPreviewsDuck from './state/ducks/linkPreviews';
import * as networkDuck from './state/ducks/network';
import * as updatesDuck from './state/ducks/updates';
import * as userDuck from './state/ducks/user';
import * as searchDuck from './state/ducks/search';
import * as stickersDuck from './state/ducks/stickers';
import * as conversationsSelectors from './state/selectors/conversations';
import * as searchSelectors from './state/selectors/search';
import AccountManager from './textsecure/AccountManager';
import { SendOptionsType } from './textsecure/SendMessage';
import Data from './sql/Client';
import { UserMessage } from './types/Message';
import { PhoneNumberFormat } from 'google-libphonenumber';
import { MessageModel } from './models/messages';
import { ConversationModel } from './models/conversations';
import { combineNames } from './util';
import { BatcherType } from './util/batcher';
import { AttachmentList } from './components/conversation/AttachmentList';
import {
  CallingScreenSharingController,
  PropsType as CallingScreenSharingControllerProps,
} from './components/CallingScreenSharingController';
import { CaptionEditor } from './components/CaptionEditor';
import { ChatColorPicker } from './components/ChatColorPicker';
import { ConfirmationDialog } from './components/ConfirmationDialog';
import { ContactDetail } from './components/conversation/ContactDetail';
import { ContactModal } from './components/conversation/ContactModal';
import { ErrorModal } from './components/ErrorModal';
import { Lightbox } from './components/Lightbox';
import { LightboxGallery } from './components/LightboxGallery';
import { MediaGallery } from './components/conversation/media-gallery/MediaGallery';
import { MessageDetail } from './components/conversation/MessageDetail';
import { ProgressModal } from './components/ProgressModal';
import { Quote } from './components/conversation/Quote';
import { StagedLinkPreview } from './components/conversation/StagedLinkPreview';
import { DisappearingTimeDialog } from './components/DisappearingTimeDialog';
import { MIMEType } from './types/MIME';
import { AttachmentType } from './types/Attachment';
import { ElectronLocaleType } from './util/mapToSupportLocale';
import { SignalProtocolStore } from './SignalProtocolStore';
import { Context as SignalContext } from './context';
import { StartupQueue } from './util/StartupQueue';
import * as synchronousCrypto from './util/synchronousCrypto';
import { SocketStatus } from './types/SocketStatus';
import SyncRequest from './textsecure/SyncRequest';
import { ConversationColorType, CustomColorType } from './types/Colors';
import { MessageController } from './util/MessageController';
import { isValidGuid } from './util/isValidGuid';
import { StateType } from './state/reducer';
import { SystemTraySetting } from './types/SystemTraySetting';

export { Long } from 'long';

type TaskResultType = any;

export type WhatIsThis = any;

// Synced with the type in ts/shims/showConfirmationDialog
// we are duplicating it here because that file cannot import/export.
type ConfirmationDialogViewProps = {
  cancelText?: string;
  confirmStyle?: 'affirmative' | 'negative';
  message: string;
  okText: string;
  reject?: (error: Error) => void;
  resolve: () => void;
};

declare global {
  // We want to extend `window`'s properties, so we need an interface.
  // eslint-disable-next-line no-restricted-syntax
  interface Window {
    startApp: () => void;

    _: typeof Underscore;
    $: typeof jQuery;

    moment: typeof moment;
    imageToBlurHash: typeof imageToBlurHash;
    loadImage: any;
    isBehindProxy: () => boolean;
    getAutoLaunch: () => boolean;
    setAutoLaunch: (value: boolean) => void;

    PQueue: typeof PQueue;
    PQueueType: PQueue;
    Mustache: {
      render: (template: string, data: any, partials?: any) => string;
      parse: (template: string) => void;
    };

    WhatIsThis: WhatIsThis;

    subscribeToSystemThemeChange: (fn: () => void) => void;

    registerScreenShareControllerRenderer: (
      f: (
        component: typeof CallingScreenSharingController,
        props: CallingScreenSharingControllerProps
      ) => void
    ) => void;

    addSetupMenuItems: () => void;
    attachmentDownloadQueue: Array<MessageModel> | undefined;
    startupProcessingQueue: StartupQueue | undefined;
    baseAttachmentsPath: string;
    baseStickersPath: string;
    baseTempPath: string;
    receivedAtCounter: number;
    enterKeyboardMode: () => void;
    enterMouseMode: () => void;
    getAccountManager: () => AccountManager | undefined;
    getAlwaysRelayCalls: () => Promise<boolean>;
    getBuiltInImages: () => Promise<Array<string>>;
    getCallRingtoneNotification: () => Promise<boolean>;
    getCallSystemNotification: () => Promise<boolean>;
    getConversations: () => ConversationModelCollectionType;
    getCountMutedConversations: () => Promise<boolean>;
    getEnvironment: typeof getEnvironment;
    getExpiration: () => string;
    getGuid: () => string;
    getInboxCollection: () => ConversationModelCollectionType;
    getIncomingCallNotification: () => Promise<boolean>;
    getInteractionMode: () => 'mouse' | 'keyboard';
    getLocale: () => ElectronLocaleType;
    getMediaCameraPermissions: () => Promise<boolean>;
    getMediaPermissions: () => Promise<boolean>;
    getNodeVersion: () => string;
    getServerPublicParams: () => string;
    getSfuUrl: () => string;
    getSocketStatus: () => SocketStatus;
    getSyncRequest: (timeoutMillis?: number) => SyncRequest;
    getTitle: () => string;
    waitForEmptyEventQueue: () => Promise<void>;
    getVersion: () => string;
    showCallingPermissionsPopup: (forCamera: boolean) => Promise<void>;
    i18n: LocalizerType;
    isActive: () => boolean;
    isAfterVersion: (version: string, anotherVersion: string) => boolean;
    isBeforeVersion: (version: string, anotherVersion: string) => boolean;
    isFullScreen: () => boolean;
    isValidGuid: typeof isValidGuid;
    isValidE164: (maybeE164: unknown) => boolean;
    libphonenumber: {
      util: {
        getRegionCodeForNumber: (number: string) => string;
        parseNumber: (
          e164: string,
          defaultRegionCode?: string
        ) =>
          | { isValidNumber: false; error: unknown }
          | {
              isValidNumber: true;
              regionCode: string | undefined;
              countryCode: string;
              nationalNumber: string;
              e164: string;
            };
      };
      parse: (number: string) => string;
      getRegionCodeForNumber: (number: string) => string;
      format: (number: string, format: PhoneNumberFormat) => string;
    };
    log: LoggerType;
    nodeSetImmediate: typeof setImmediate;
    onFullScreenChange: (fullScreen: boolean) => void;
    platform: string;
    preloadedImages: Array<WhatIsThis>;
    reduxActions: ReduxActions;
    reduxStore: Store<StateType>;
    registerForActive: (handler: () => void) => void;
    restart: () => void;
    setImmediate: typeof setImmediate;
    showWindow: () => void;
    showSettings: () => void;
    shutdown: () => void;
    sendChallengeRequest: (request: IPCChallengeRequest) => void;
    setAutoHideMenuBar: (value: WhatIsThis) => void;
    setBadgeCount: (count: number) => void;
    setMenuBarVisibility: (value: WhatIsThis) => void;
    updateSystemTraySetting: (value: SystemTraySetting) => void;
    showConfirmationDialog: (options: ConfirmationDialogViewProps) => void;
    showKeyboardShortcuts: () => void;
    storage: Storage;
    systemTheme: WhatIsThis;
    textsecure: TextSecureType;
    synchronousCrypto: typeof synchronousCrypto;
    titleBarDoubleClick: () => void;
    unregisterForActive: (handler: () => void) => void;
    updateTrayIcon: (count: number) => void;
    sqlInitializer: {
      initialize: () => Promise<void>;
      goBackToMainProcess: () => Promise<void>;
    };

    Backbone: typeof Backbone;
    CI:
      | {
          setProvisioningURL: (url: string) => void;
          deviceName: string;
        }
      | undefined;
    Accessibility: {
      reducedMotionSetting: boolean;
    };
    Signal: {
      Backbone: any;
      Crypto: typeof Crypto;
      Curve: typeof Curve;
      Data: typeof Data;
      Groups: typeof Groups;
      RemoteConfig: typeof RemoteConfig;
      Services: {
        calling: CallingClass;
        enableStorageService: () => boolean;
        eraseAllStorageServiceState: () => Promise<void>;
        initializeGroupCredentialFetcher: () => void;
        initializeNetworkObserver: (network: WhatIsThis) => void;
        initializeUpdateListener: (
          updates: WhatIsThis,
          events: WhatIsThis
        ) => void;
        onTimeout: (timestamp: number, cb: () => void, id?: string) => string;
        removeTimeout: (uuid: string) => void;
        retryPlaceholders?: Util.RetryPlaceholders;
        runStorageServiceSyncJob: () => Promise<void>;
        storageServiceUploadJob: () => void;
      };
      Migrations: {
        readTempData: any;
        deleteAttachmentData: (path: string) => Promise<void>;
        doesAttachmentExist: () => unknown;
        writeNewAttachmentData: (data: ArrayBuffer) => Promise<string>;
        deleteExternalMessageFiles: (attributes: unknown) => Promise<void>;
        getAbsoluteAttachmentPath: (path: string) => string;
        loadAttachmentData: (attachment: WhatIsThis) => WhatIsThis;
        loadQuoteData: (quote: unknown) => WhatIsThis;
        loadPreviewData: (preview: unknown) => WhatIsThis;
        loadStickerData: (sticker: unknown) => WhatIsThis;
        readStickerData: (path: string) => Promise<ArrayBuffer>;
        deleteSticker: (path: string) => Promise<void>;
        getAbsoluteStickerPath: (path: string) => string;
        processNewEphemeralSticker: (
          stickerData: ArrayBuffer
        ) => {
          path: string;
          width: number;
          height: number;
        };
        processNewSticker: (
          stickerData: ArrayBuffer
        ) => {
          path: string;
          width: number;
          height: number;
        };
        copyIntoAttachmentsDirectory: (path: string) => Promise<string>;
        upgradeMessageSchema: (attributes: unknown) => WhatIsThis;
        processNewAttachment: (
          attachment: DownloadAttachmentType
        ) => Promise<AttachmentType>;

        copyIntoTempDirectory: any;
        deleteDraftFile: (path: string) => Promise<void>;
        deleteTempFile: (path: string) => Promise<void>;
        getAbsoluteDraftPath: any;
        getAbsoluteTempPath: any;
        openFileInFolder: any;
        readAttachmentData: any;
        readDraftData: any;
        saveAttachmentToDisk: any;
        writeNewDraftData: any;
      };
      Types: {
        Attachment: {
          save: any;
          path: string;
          pending: boolean;
          flags: number;
          size: number;
          screenshot: {
            path: string;
          };
          thumbnail: {
            path: string;
            objectUrl: string;
          };
          contentType: MIMEType;
          error: unknown;
          caption: string;

          migrateDataToFileSystem: (
            attachment: WhatIsThis,
            options: unknown
          ) => WhatIsThis;

          isVoiceMessage: (attachments: unknown) => boolean;
          isImage: typeof Attachment.isImage;
          isGIF: typeof Attachment.isGIF;
          isVideo: typeof Attachment.isVideo;
          isAudio: typeof Attachment.isAudio;

          getUploadSizeLimitKb: typeof Attachment.getUploadSizeLimitKb;
        };
        MIME: typeof MIME;
        Contact: typeof Contact;
        Conversation: {
          computeHash: (data: string) => Promise<string>;
          deleteExternalFiles: (
            attributes: unknown,
            options: unknown
          ) => Promise<void>;
          maybeUpdateProfileAvatar: (
            attributes: unknown,
            decrypted: unknown,
            options: unknown
          ) => Promise<Record<string, unknown>>;
          maybeUpdateAvatar: (
            attributes: unknown,
            data: unknown,
            options: unknown
          ) => Promise<WhatIsThis>;
        };
        Errors: typeof Errors;
        Message: {
          CURRENT_SCHEMA_VERSION: number;
          VERSION_NEEDED_FOR_DISPLAY: number;
          GROUP: 'group';
          PRIVATE: 'private';

          initializeSchemaVersion: (version: {
            message: unknown;
            logger: unknown;
          }) => unknown & {
            schemaVersion: number;
          };
          hasExpiration: (json: string) => boolean;
        };
        Sticker: {
          emoji: string;
          packId: string;
          packKey: string;
          stickerId: number;
          data: {
            pending: boolean;
            path: string;
          };
          width: number;
          height: number;
          path: string;
        };
        VisualAttachment: any;
      };
      Util: typeof Util;
      GroupChange: {
        renderChange: (change: unknown, things: unknown) => Array<string>;
      };
      Components: {
        AttachmentList: typeof AttachmentList;
        CaptionEditor: typeof CaptionEditor;
        ChatColorPicker: typeof ChatColorPicker;
        ConfirmationDialog: typeof ConfirmationDialog;
        ContactDetail: typeof ContactDetail;
        ContactModal: typeof ContactModal;
        ErrorModal: typeof ErrorModal;
        Lightbox: typeof Lightbox;
        LightboxGallery: typeof LightboxGallery;
        MediaGallery: typeof MediaGallery;
        MessageDetail: typeof MessageDetail;
        ProgressModal: typeof ProgressModal;
        Quote: typeof Quote;
        StagedLinkPreview: typeof StagedLinkPreview;
        DisappearingTimeDialog: typeof DisappearingTimeDialog;
      };
      OS: typeof OS;
      Workflow: {
        IdleDetector: WhatIsThis;
        MessageDataMigrator: WhatIsThis;
      };
      IndexedDB: {
        removeDatabase: WhatIsThis;
        doesDatabaseExist: WhatIsThis;
      };
      Views: WhatIsThis;
      State: {
        createStore: typeof createStore;
        Roots: {
          createApp: typeof createApp;
          createChatColorPicker: typeof createChatColorPicker;
          createCompositionArea: typeof createCompositionArea;
          createContactModal: typeof createContactModal;
          createConversationDetails: typeof createConversationDetails;
          createConversationHeader: typeof createConversationHeader;
          createForwardMessageModal: typeof createForwardMessageModal;
          createGroupLinkManagement: typeof createGroupLinkManagement;
          createGroupV1MigrationModal: typeof createGroupV1MigrationModal;
          createGroupV2JoinModal: typeof createGroupV2JoinModal;
          createGroupV2Permissions: typeof createGroupV2Permissions;
          createLeftPane: typeof createLeftPane;
          createMessageDetail: typeof createMessageDetail;
          createPendingInvites: typeof createPendingInvites;
          createSafetyNumberViewer: typeof createSafetyNumberViewer;
          createShortcutGuideModal: typeof createShortcutGuideModal;
          createStickerManager: typeof createStickerManager;
          createStickerPreviewModal: typeof createStickerPreviewModal;
          createTimeline: typeof createTimeline;
        };
        Ducks: {
          app: typeof appDuck;
          calling: typeof callingDuck;
          conversations: typeof conversationsDuck;
          emojis: typeof emojisDuck;
          expiration: typeof expirationDuck;
          items: typeof itemsDuck;
          linkPreviews: typeof linkPreviewsDuck;
          network: typeof networkDuck;
          updates: typeof updatesDuck;
          user: typeof userDuck;
          search: typeof searchDuck;
          stickers: typeof stickersDuck;
        };
        Selectors: {
          conversations: typeof conversationsSelectors;
          search: typeof searchSelectors;
        };
      };
      Logs: WhatIsThis;
      conversationControllerStart: WhatIsThis;
      Emojis: {
        getInitialState: () => WhatIsThis;
        load: () => void;
      };
      challengeHandler: ChallengeHandler;
    };
    SignalContext: SignalContext;

    ConversationController: ConversationController;
    Events: WhatIsThis;
    MessageController: MessageController;
    SignalProtocolStore: typeof SignalProtocolStore;
    WebAPI: WebAPIConnectType;
    Whisper: WhisperType;

    getServerTrustRoot: () => WhatIsThis;
    readyForUpdates: () => void;
    logAppLoadedEvent: (options: { processedCount?: number }) => void;
    logMessageReceiverConnect: () => void;

    // Runtime Flags
    isShowingModal?: boolean;

    // Feature Flags
    isGroupCallingEnabled: () => boolean;
    GV2_ENABLE_SINGLE_CHANGE_PROCESSING: boolean;
    GV2_ENABLE_CHANGE_PROCESSING: boolean;
    GV2_ENABLE_STATE_PROCESSING: boolean;
    GV2_MIGRATION_DISABLE_ADD: boolean;
    GV2_MIGRATION_DISABLE_INVITE: boolean;
  }

  // We want to extend `Error`, so we need an interface.
  // eslint-disable-next-line no-restricted-syntax
  interface Error {
    originalError?: Event;
    reason?: any;
    stackForLog?: string;
  }

  // Uint8Array and ArrayBuffer are type-compatible in TypeScript's covariant
  // type checker, but in reality they are not. Let's assert correct use!
  interface Uint8Array {
    __uint8array: never;
  }

  interface ArrayBuffer {
    __array_buffer: never;
  }

  interface SharedArrayBuffer {
    __array_buffer: never;
  }
}

export class CertificateValidatorType {
  validate: (cerficate: any, certificateTime: number) => Promise<void>;
}

export class GumVideoCapturer {
  constructor(
    maxWidth: number,
    maxHeight: number,
    maxFramerate: number,
    localPreview: Ref<HTMLVideoElement>
  );
}

export class CanvasVideoRenderer {
  constructor(canvas: Ref<HTMLCanvasElement>);
}

export type LoggerType = {
  fatal: LogFunctionType;
  info: LogFunctionType;
  warn: LogFunctionType;
  error: LogFunctionType;
  debug: LogFunctionType;
  trace: LogFunctionType;
  fetch: () => Promise<string>;
  publish: typeof uploadDebugLogs;
};

export type LogFunctionType = (...args: Array<unknown>) => void;

export type WhisperType = {
  events: Backbone.Events;
  Database: {
    open: () => Promise<IDBDatabase>;
    handleDOMException: (
      context: string,
      error: DOMException | null,
      reject: Function
    ) => void;
  };
  ConversationCollection: typeof ConversationModelCollectionType;
  ConversationCollectionType: ConversationModelCollectionType;
  Conversation: typeof ConversationModel;
  ConversationType: ConversationModel;
  MessageCollection: typeof MessageModelCollectionType;
  MessageCollectionType: MessageModelCollectionType;
  MessageAttributesType: MessageAttributesType;
  Message: typeof MessageModel;
  MessageType: MessageModel;
  GroupMemberConversation: WhatIsThis;
  KeyChangeListener: WhatIsThis;
  ClearDataView: WhatIsThis;
  ReactWrapperView: WhatIsThis;
  activeConfirmationView: WhatIsThis;
  ToastView: typeof window.Whisper.View & {
    show: (view: typeof Backbone.View, el: Element) => void;
  };
  ConversationArchivedToast: WhatIsThis;
  ConversationUnarchivedToast: WhatIsThis;
  ConversationMarkedUnreadToast: WhatIsThis;
  WallClockListener: WhatIsThis;
  BannerView: any;
  RecorderView: any;
  GroupMemberList: any;
  GroupLinkCopiedToast: typeof Backbone.View;
  InboxView: typeof window.Whisper.View;
  InstallView: typeof window.Whisper.View;
  StandaloneRegistrationView: typeof window.Whisper.View;
  KeyVerificationPanelView: any;
  SafetyNumberChangeDialogView: any;
  BodyRangesType: BodyRangesType;
  BodyRangeType: BodyRangeType;

  Notifications: {
    isEnabled: boolean;
    removeBy: (filter: Partial<unknown>) => void;
    add: (notification: unknown) => void;
    clear: () => void;
    disable: () => void;
    enable: () => void;
    fastClear: () => void;
    on: (
      event: string,
      callback: (id: string, messageId: string) => void
    ) => void;
  };

  IdenticonSVGView: WhatIsThis;

  ExpiringMessagesListener: {
    init: (events: Backbone.Events) => void;
    update: () => void;
  };
  TapToViewMessagesListener: {
    nextCheck: null | number;
    init: (events: Backbone.Events) => void;
    update: () => void;
  };

  deliveryReceiptQueue: PQueue<WhatIsThis>;
  deliveryReceiptBatcher: BatcherType<{
    source?: string;
    sourceUuid?: string;
    timestamp: number;
  }>;
  RotateSignedPreKeyListener: WhatIsThis;

  AlreadyGroupMemberToast: typeof window.Whisper.ToastView;
  AlreadyRequestedToJoinToast: typeof window.Whisper.ToastView;
  BlockedGroupToast: typeof window.Whisper.ToastView;
  BlockedToast: typeof window.Whisper.ToastView;
  CannotMixImageAndNonImageAttachmentsToast: typeof window.Whisper.ToastView;
  CaptchaSolvedToast: typeof window.Whisper.ToastView;
  CaptchaFailedToast: typeof window.Whisper.ToastView;
  DangerousFileTypeToast: typeof window.Whisper.ToastView;
  ExpiredToast: typeof window.Whisper.ToastView;
  FileSavedToast: typeof window.Whisper.ToastView;
  FileSizeToast: any;
  FoundButNotLoadedToast: typeof window.Whisper.ToastView;
  InvalidConversationToast: typeof window.Whisper.ToastView;
  LeftGroupToast: typeof window.Whisper.ToastView;
  MaxAttachmentsToast: typeof window.Whisper.ToastView;
  MessageBodyTooLongToast: typeof window.Whisper.ToastView;
  OneNonImageAtATimeToast: typeof window.Whisper.ToastView;
  OriginalNoLongerAvailableToast: typeof window.Whisper.ToastView;
  OriginalNotFoundToast: typeof window.Whisper.ToastView;
  PinnedConversationsFullToast: typeof window.Whisper.ToastView;
  ReactionFailedToast: typeof window.Whisper.ToastView;
  DeleteForEveryoneFailedToast: typeof window.Whisper.ToastView;
  TapToViewExpiredIncomingToast: typeof window.Whisper.ToastView;
  TapToViewExpiredOutgoingToast: typeof window.Whisper.ToastView;
  TimerConflictToast: typeof window.Whisper.ToastView;
  UnableToLoadToast: typeof window.Whisper.ToastView;
  VoiceNoteLimit: typeof window.Whisper.ToastView;
  VoiceNoteMustBeOnlyAttachmentToast: typeof window.Whisper.ToastView;

  ConversationLoadingScreen: typeof window.Whisper.View;
  ConversationView: typeof window.Whisper.View;
  View: typeof Backbone.View & {
    Templates: Record<string, string>;
  };
  DisappearingTimeDialog: typeof window.Whisper.View | undefined;
};
