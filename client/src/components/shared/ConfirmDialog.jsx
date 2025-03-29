import React from 'react';
import {
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Button
} from '@mui/material';

/**
 * Diálogo de confirmación reutilizable
 * 
 * @param {boolean} open - Estado que controla si el diálogo está abierto
 * @param {function} onClose - Función a ejecutar al cerrar el diálogo (sin confirmar)
 * @param {function} onConfirm - Función a ejecutar al confirmar la acción
 * @param {string} title - Título del diálogo
 * @param {string} content - Contenido/mensaje del diálogo
 * @param {string} confirmText - Texto del botón de confirmación
 * @param {string} cancelText - Texto del botón de cancelación
 * @param {string} confirmColor - Color del botón de confirmación (primary, secondary, error, etc.)
 */
const ConfirmDialog = ({
    open,
    onClose,
    onConfirm,
    title = "Confirmar acción",
    content = "¿Estás seguro de que deseas realizar esta acción?",
    confirmText = "Aceptar",
    cancelText = "Cancelar",
    confirmColor = "primary"
}) => {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-description"
        >
            <DialogTitle id="confirm-dialog-title">
                {title}
            </DialogTitle>
            <DialogContent>
                <DialogContentText id="confirm-dialog-description">
                    {content}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="inherit">
                    {cancelText}
                </Button>
                <Button
                    onClick={() => {
                        onConfirm();
                        onClose();
                    }}
                    color={confirmColor}
                    variant="contained"
                    autoFocus
                >
                    {confirmText}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConfirmDialog;