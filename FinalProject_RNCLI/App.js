import React, { useState, useEffect } from 'react';
import { SafeAreaView, Button, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const config = {
  client_id: "healthcare1",
  client_secret: "8f3d796f-0233-4cdc-a2a9-85ca5fc2a7e1",
  redirect_uri: "https://appsmu.azurewebsites.net/callback",
  authorize: "https://oauth.redwoodhealth.kr/oauth/authorize",
  token: "https://oauth.redwoodhealth.kr/oauth/token",
  scope: "phr.read phr.write",
  state: "1234"
};

const App = () => {
  const [authUrl, setAuthUrl] = useState(null);
  const [webviewVisible, setWebviewVisible] = useState(false);

  const getAuthorizationCode = () => {
    const url = `${config.authorize}?response_type=code&client_id=${config.client_id}&redirect_uri=${config.redirect_uri}&scope=${config.scope}&state=${config.state}`;
    setAuthUrl(url);
    setWebviewVisible(true);
  };

  const handleCallback = (event) => {
    const url = event.url;
    if (url.startsWith(config.redirect_uri)) {
      const code = new URL(url).searchParams.get('code');
      if (code) {
        getToken(code);
        setWebviewVisible(false);
      }
    }
  };

  const getToken = async (code) => {
    try {
      const response = await axios.post(config.token, {
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: config.redirect_uri,
        client_id: config.client_id,
        client_secret: config.client_secret
      });
      const token = response.data.access_token;
      await storeToken(token);
    } catch (error) {
      console.error('Error fetching access token:', error);
    }
  };

  const storeToken = async (token) => {
    try {
      await AsyncStorage.setItem('access_token', token);
    } catch (error) {
      console.error('Error saving token:', error);
    }
  };

  const getStoredToken = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      return token;
    } catch (error) {
      console.error('Error retrieving token:', error);
    }
  };

  useEffect(() => {
    const handleOpenURL = (event) => {
      handleCallback(event);
    };

    Linking.addEventListener('url', handleOpenURL);

    return () => {
      Linking.removeEventListener('url', handleOpenURL);
    };
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Button title="Login with OAuth" onPress={getAuthorizationCode} />
      {webviewVisible && authUrl && (
        <WebView
          source={{ uri: authUrl }}
          onNavigationStateChange={handleCallback}
          style={{ flex: 1 }}
        />
      )}
    </SafeAreaView>
  );
};

export default App;
