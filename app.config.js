const appJson = require('./app.json');

const DEV_ANDROID_APP_ID = 'ca-app-pub-3940256099942544~3347511713';
const DEV_IOS_APP_ID = 'ca-app-pub-3940256099942544~1458002511';

module.exports = ({ config }) => {
  const base = {
    ...appJson.expo,
    ...(config ?? {}),
  };

  const androidAppId = process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID;
  const iosAppId = process.env.EXPO_PUBLIC_ADMOB_IOS_APP_ID;
  const buildProfile = process.env.EAS_BUILD_PROFILE;
  const isProdBuild = buildProfile === 'production';

  if (isProdBuild && (!androidAppId || !iosAppId)) {
    throw new Error(
      'Missing AdMob app IDs. Set EXPO_PUBLIC_ADMOB_ANDROID_APP_ID and EXPO_PUBLIC_ADMOB_IOS_APP_ID for production builds.',
    );
  }

  const resolvedAndroidAppId = androidAppId ?? DEV_ANDROID_APP_ID;
  const resolvedIosAppId = iosAppId ?? DEV_IOS_APP_ID;

  const plugins = (base.plugins ?? []).map((plugin) => {
    if (Array.isArray(plugin) && plugin[0] === 'react-native-google-mobile-ads') {
      return [
        'react-native-google-mobile-ads',
        {
          androidAppId: resolvedAndroidAppId,
          iosAppId: resolvedIosAppId,
        },
      ];
    }
    return plugin;
  });

  return {
    ...base,
    plugins,
  };
};
