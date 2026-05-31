export enum UploadPurpose {
  AVATAR = 'avatar',
  STORY_TIME = 'story_time',
  REVIEW_MEDIA = 'review_media',
}

export const UPLOAD_PURPOSES = Object.values(UploadPurpose);

export const UPLOAD_PURPOSE_MIME_TYPES: Record<UploadPurpose, readonly string[]> = {
  [UploadPurpose.AVATAR]: ['image/jpeg', 'image/png', 'image/webp'],
  [UploadPurpose.STORY_TIME]: ['video/mp4', 'video/webm', 'video/quicktime'],
  [UploadPurpose.REVIEW_MEDIA]: ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'],
};

export const UPLOAD_MAX_BYTES: Record<UploadPurpose, number> = {
  [UploadPurpose.AVATAR]: 5 * 1024 * 1024,
  [UploadPurpose.STORY_TIME]: 100 * 1024 * 1024,
  [UploadPurpose.REVIEW_MEDIA]: 20 * 1024 * 1024,
};

export const UPLOAD_PRESIGNED_URL_TTL_SECONDS = 900;
