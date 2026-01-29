import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'hauntedUploads',
  access: (allow) => ({
    'guestbook/*': [allow.guest.to(['read', 'write'])],
    'gallery/*': [allow.guest.to(['read', 'write'])],
  }),
});
