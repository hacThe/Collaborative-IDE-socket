import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  username: null,
  isAuth: false,
}

export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setUserName: (state, action) => {
      state.username = action.payload
    },
    setAuthState: (state, action) => {
      state.isAuth = action.payload
    }
  },
})

// Action creators are generated for each case reducer function
export const { setUserName, setAuthState } = appSlice.actions

export default appSlice.reducer