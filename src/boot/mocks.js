import {boot} from 'quasar/wrappers'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import {api} from 'src/boot/axios'
import {appConfig} from 'src/config/appConfig'
import {createMockDb} from 'src/boot/mocks/db'
import {registerClientMocks} from 'src/boot/mocks/routes/clients'
import {registerDirectoryMocks} from 'src/boot/mocks/routes/directories'
import {registerSessionMocks} from 'src/boot/mocks/routes/session'
import {registerSettingsMocks} from 'src/boot/mocks/routes/settings'
import {registerAutomationMocks} from 'src/boot/mocks/routes/automation'
import {registerTaskMocks} from 'src/boot/mocks/routes/tasks'
import {registerFallbackMock} from 'src/boot/mocks/routes/fallback'

export default boot(() => {
  if (!appConfig.useMocks) return

  console.log('[MOCK] enabled')

  const mockApi = new MockAdapter(api, {delayResponse: 200})
  const mockAxios = new MockAdapter(axios, {delayResponse: 200})

  const db = createMockDb()

  const apply = (mock) => {
    registerClientMocks(mock, db)
    registerDirectoryMocks(mock, db)
    registerSessionMocks(mock, db)
    registerSettingsMocks(mock, db)
    registerAutomationMocks(mock, db)
    registerTaskMocks(mock, db)
    registerFallbackMock(mock)
  }

  apply(mockApi)
  apply(mockAxios)
})
