import { defineData, a } from '@aws-amplify/backend';

const schema = a.schema({
  GuestbookEntry: a
    .model({
      name: a.string(),
      message: a.string().required(),
      imageKey: a.string(),
      imageAlt: a.string(),
      submittedAt: a.datetime(),
    })
    .authorization((allow) => [allow.publicApiKey()]),
  GalleryImage: a
    .model({
      caption: a.string(),
      tags: a.string().array(),
      imageKey: a.string().required(),
      submittedAt: a.datetime(),
    })
    .authorization((allow) => [allow.publicApiKey()]),
});

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: {
      expiresInDays: 365,
    },
  },
});
