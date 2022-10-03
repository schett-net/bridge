import Session from './sessions/generic'

// @ts-ignore
import AsyncStorage from '@react-native-async-storage/async-storage'

Session.tokenStorageAdapter = {
  getToken: async (self: Session) => {
    return (await AsyncStorage.getItem(self.tokenName)) || undefined
  },
  setToken: async (self: Session, value: string | undefined) => {
    if (value) {
      await AsyncStorage.setItem(self.tokenName, value)
    } else {
      await AsyncStorage.removeItem(self.tokenName)
    }
  },
  getRefreshToken: async (self: Session) => {
    return (await AsyncStorage.getItem(self.refreshTokenName)) || undefined
  },
  setRefreshToken: async (self: Session, value: string | undefined) => {
    if (value) {
      await AsyncStorage.setItem(self.refreshTokenName, value)
    } else {
      await AsyncStorage.removeItem(self.refreshTokenName)
    }
  }
}

export * from './index'
