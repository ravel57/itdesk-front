export const EMAIL_REGEX = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

// Колонки таблицы учётных записей клиентов
export const createClientColumns = () => [
  {name: 'username', label: 'E-mail', align: 'left', field: 'username'},
  {name: 'firstname', label: 'Имя', align: 'left', field: 'firstname'},
  {name: 'lastname', label: 'Фамилия', align: 'left', field: 'lastname'},
  {
    name: 'organization',
    label: 'Организация',
    align: 'left',
    field: row => row.organizationName || '—'
  },
  {
    name: 'clientCard',
    label: 'Карточка клиента',
    align: 'left',
    field: row => row.clientCardLabel || '—'
  },
  {name: 'edit', label: '', align: 'center', field: 'edit'}
]

// Колонки таблицы предпросмотра импорта
export const createImportColumns = () => [
  {name: 'selected', label: '', align: 'center', field: 'selected', style: 'width: 44px'},
  {name: 'rowNumber', label: '# CSV', align: 'right', field: 'rowNumber', style: 'width: 64px'},
  {name: 'status', label: 'Статус', align: 'left', field: 'status', style: 'width: 130px'},
  {name: 'username', label: 'Логин *', align: 'left', field: 'username'},
  {name: 'firstname', label: 'Имя *', align: 'left', field: 'firstname'},
  {name: 'lastname', label: 'Фамилия *', align: 'left', field: 'lastname'},
  {name: 'organization', label: 'Организация *', align: 'left', field: 'organization'},
  {name: 'email', label: 'E-mail карточки', align: 'left', field: 'email'},
  {name: 'phoneNumber', label: 'Телефон', align: 'left', field: 'phoneNumber'},
  {name: 'moreInfo', label: 'Информация', align: 'left', field: 'moreInfo'},
  {name: 'remove', label: '', align: 'center', field: 'remove'}
]

// Колонки таблицы созданных учётных записей (результат импорта)
export const createCredentialColumns = () => [
  {name: 'username', label: 'Логин', align: 'left', field: 'username'},
  {name: 'password', label: 'Пароль', align: 'left', field: 'password'},
  {name: 'lastname', label: 'Фамилия', align: 'left', field: 'lastname'},
  {name: 'firstname', label: 'Имя', align: 'left', field: 'firstname'},
  {name: 'organization', label: 'Организация', align: 'left', field: 'organization'}
]

// PowerShell-команда выгрузки пользователей из Active Directory
export const POWERSHELL_SCRIPT = `Import-Module ActiveDirectory

Get-ADUser -Filter 'Enabled -eq $true' -Properties GivenName,Surname,mail,telephoneNumber,Company,Department,Title |
  Select-Object @{N='username';E={$_.SamAccountName}},
                @{N='firstname';E={$_.GivenName}},
                @{N='lastname';E={$_.Surname}},
                @{N='email';E={$_.mail}},
                @{N='phoneNumber';E={$_.telephoneNumber}},
                @{N='organization';E={if ($_.Company) {$_.Company} else {$_.Department}}},
                @{N='moreInfo';E={$_.Title}} |
  Export-Csv -Path '.\\client-users.csv' -NoTypeInformation -Encoding UTF8`
