import {createSlice} from '@reduxjs/toolkit'
const slice=createSlice({name:'auth',initialState:{user:null,ready:false},reducers:{setUser(s,a){s.user=a.payload;s.ready=true},clearUser(s){s.user=null;s.ready=true}}})
export const {setUser,clearUser}=slice.actions;export default slice.reducer
