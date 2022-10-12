import Session from './sessions/generic'

// @ts-ignore
import AsyncStorage from '@react-native-async-storage/async-storage'

type Data = {
  value: any
  expireAt: Date
}

export default class ExpireStorage {
  static async getItem(key: string) {
    let data = await AsyncStorage.getItem(key)
    data = JSON.parse(data)
    if (
      data !== null &&
      data.expireAt &&
      new Date(data.expireAt) < new Date()
    ) {
      await AsyncStorage.removeItem(key)
      data = null
    }
    return data?.value
  }

  static async setItem(key: string, value: any, expireInMinutes: number) {
    const data = {value} as Data
    if (expireInMinutes) {
      const expireAt = this.getExpireDate(expireInMinutes)
      data.expireAt = expireAt
    } else {
      const expireAt = JSON.parse(await AsyncStorage.getItem(key))?.expireAt
      if (expireAt) {
        data.expireAt = expireAt
      } else {
        return
      }
    }
    const objectToStore = JSON.stringify(data)
    return AsyncStorage.setItem(key, objectToStore)
  }

  static async removeItem(key: string) {
    return AsyncStorage.removeItem(key)
  }

  static getExpireDate(expireInMinutes: number) {
    const now = new Date()
    const expireTime = new Date(now)
    expireTime.setMinutes(now.getMinutes() + expireInMinutes)
    return expireTime
  }
}

Session.tokenStorageAdapter = {
  getToken: async (self: Session) => {
    return (await ExpireStorage.getItem(self.tokenName)) || undefined
  },
  setToken: async (self: Session, value: string | undefined) => {
    if (value) {
      await ExpireStorage.setItem(
        self.tokenName,
        value,
        Session.tokenExpireSeconds / 60
      )
    } else {
      await ExpireStorage.removeItem(self.tokenName)
    }
  },
  getRefreshToken: async (self: Session) => {
    return (await ExpireStorage.getItem(self.refreshTokenName)) || undefined
  },
  setRefreshToken: async (self: Session, value: string | undefined) => {
    if (value) {
      await ExpireStorage.setItem(
        self.refreshTokenName,
        value,
        Session.refreshTokenExpireSeconds / 60
      )
    } else {
      await ExpireStorage.removeItem(self.refreshTokenName)
    }
  }
}

export * from './index'
