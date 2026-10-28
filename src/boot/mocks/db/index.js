import {createUsersDb} from 'src/boot/mocks/db/usersDb'
import {createSettingsDb} from 'src/boot/mocks/db/settingsDb'
import {createDirectoriesDb} from 'src/boot/mocks/db/directoriesDb'
import {createTasksDb} from 'src/boot/mocks/db/tasksDb'
import {createClientsDb} from 'src/boot/mocks/db/clientsDb'

// In-memory mock DB
export function createMockDb() {
  return {
    ...createUsersDb(),
    ...createSettingsDb(),
    ...createTasksDb(),
    ...createDirectoriesDb(),
    ...createClientsDb()
  }
}
