import Session from './sessions/generic'

// @ts-ignore
import AsyncStorage from '@react-native-async-storage/async-storage'

type Data = {
  value: any
  expireAt: Date
}

export default class ExpireStorage {
  private static getDataFromStorage = async (
    key: string
  ): Promise<Data | null> => {
    const data = await AsyncStorage.getItem(key)
    if (data) {
      return JSON.parse(data)
    }
    return null
  }

  static async getItem(key: string) {
    const data = await this.getDataFromStorage(key)

    if (
      data !== null &&
      data.expireAt &&
      new Date(data.expireAt) < new Date()
    ) {
      await AsyncStorage.removeItem(key)
    }
    return data?.value
  }

  static async setItem(key: string, value: any, expireInMinutes?: number) {
    const data = {value} as Data

    if (expireInMinutes) {
      data.expireAt = this.getExpireDate(expireInMinutes)
    } else {
      const oldData = await this.getDataFromStorage(key)

      if (oldData) {
        data.expireAt = oldData.expireAt
      } else {
        // Cannot set item without expire time
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
