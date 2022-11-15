import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  username: null
}

export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setUserName: (state, action) => {
      state.username = action.payload
    },
  },
})

// Action creators are generated for each case reducer function
export const {setUserName} = appSlice.actions

export default appSlice.reducer