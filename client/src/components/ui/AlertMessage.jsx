import React, { useEffect } from 'react';
import { Alert, Snackbar } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { removeAlert } from '../../redux/slices/uiSlice';

const AlertMessage = () => {
  const dispatch = useDispatch();
  const { alerts } = useSelector(state => state.ui);

  // Auto-cerrar alertas después de 5 segundos
  useEffect(() => {
    if (alerts.length > 0) {
      const timer = setTimeout(() => {
        dispatch(removeAlert(alerts[0].id));
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [alerts, dispatch]);

  if (alerts.length === 0) return null;

  return (
    <Snackbar
      open={alerts.length > 0}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert
        severity={alerts[0].type || 'info'}
        onClose={() => dispatch(removeAlert(alerts[0].id))}
      >
        {alerts[0].message}
      </Alert>
    </Snackbar>
  );
};

export default AlertMessage;