import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  sidebarOpen: true, 
  darkMode: false,
  alerts: [],
  activeView: 'chat',
  notifications: {  
    systemAlerts: true,
    sounds: false
  }
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
    },
    setActiveView: (state, action) => {
      state.activeView = action.payload;
    },
    addAlert: (state, action) => {
      const { message, type, id } = action.payload;
      state.alerts.push({
        id: id || Date.now(),
        message,
        type
      });
    },
    removeAlert: (state, action) => {
      state.alerts = state.alerts.filter(alert => alert.id !== action.payload);
    },    
    toggleSystemAlerts: (state) => {
      state.notifications.systemAlerts = !state.notifications.systemAlerts;
    },
    toggleNotificationSounds: (state) => {
      state.notifications.sounds = !state.notifications.sounds;
    }
  }
});

export const {
  toggleSidebar,
  setSidebarOpen,
  toggleDarkMode,
  setActiveView,
  addAlert,
  removeAlert,
  toggleSystemAlerts,  
  toggleNotificationSounds
} = uiSlice.actions;

export default uiSlice.reducer;