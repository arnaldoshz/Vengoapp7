import 'dotenv/config';

export default ({ config }) => {
  return {
    ...config,
    extra: {
      eas: {
        projectId: "a2c25f3a-bb73-4a30-b8c6-2058061186f5"
      },
      googleApiKey: process.env.GOOGLE_API_KEY
    }
  };
};
