const BASE_BACKEND_URL = 'https://collaborative-ide-backend.onrender.com'
// const BASE_BACKEND_URL = 'http://localhost:3001'
const GET_COMPILER_LANGUAGE_URL = `${BASE_BACKEND_URL}/compiler/get-programming-languages`
const SAVE_CODE_URL = `${BASE_BACKEND_URL}/data/save`
const RUN_COMPILER_URL = `${BASE_BACKEND_URL}/compiler/execute`
const CREATE_ROOM_URL = `${BASE_BACKEND_URL}/create-room-with-user`
const FIND_ROOM_URL = `${BASE_BACKEND_URL}/find-room-with-id`
const CHECK_DUPLICATE_USERNAME_URL = `${BASE_BACKEND_URL}/check-if-username-exist`

module.exports = { BASE_BACKEND_URL, GET_COMPILER_LANGUAGE_URL, SAVE_CODE_URL, RUN_COMPILER_URL, CREATE_ROOM_URL, FIND_ROOM_URL, CHECK_DUPLICATE_USERNAME_URL }