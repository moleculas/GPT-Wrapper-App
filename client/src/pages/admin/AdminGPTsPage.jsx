import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  CircularProgress,
  Tooltip,
  Stack
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PeopleIcon from '@mui/icons-material/People';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchAllGPTs, deleteGPT } from '../../redux/slices/gptSlice';
import { addAlert } from '../../redux/slices/uiSlice';
import MainLayout from '../../components/layout/MainLayout';
import ConfirmDialog from '../../components/shared/ConfirmDialog';

const AdminGPTsPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { gpts, loading, error } = useSelector(state => state.gpts);
  const { user } = useSelector(state => state.auth);

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [gptToDelete, setGptToDelete] = useState(null);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/');
      dispatch(addAlert({
        message: 'No tienes permisos para acceder a esta sección',
        type: 'error'
      }));
    } else {
      dispatch(fetchAllGPTs());
    }
  }, [dispatch, navigate, user]);

  const handleDeleteClick = (id) => {
    setGptToDelete(id);
    setConfirmDialogOpen(true);
  };

  const confirmDelete = () => {
    if (gptToDelete) {
      dispatch(deleteGPT(gptToDelete))
        .unwrap()
        .then(() => {
          dispatch(addAlert({
            message: 'GPT eliminado correctamente de la aplicación',
            type: 'success'
          }));
        })
        .catch((error) => {
          dispatch(addAlert({
            message: `Error al eliminar el GPT: ${error || 'Desconocido'}`,
            type: 'error'
          }));
        });
    }
  };

  return (
    <MainLayout>
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3
        }}>
          <Typography variant="h4" component="h1">
            Administrar Asistentes
          </Typography>

          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/admin/gpts/new')}
          >
            Importar Asistente
          </Button>
        </Box>

        <Paper sx={{ p: 3, mb: 4, bgcolor: '#f9f9f9', borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom>
            Gestión de Asistentes personalizados
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Desde aquí puedes importar Asistentes desde tu cuenta de OpenAI, gestionar sus ajustes de visibilidad
            y controlar qué usuarios tienen acceso a cada Asistente. Los Asistentes importados deben existir previamente en tu cuenta empresarial de OpenAI.
          </Typography>
        </Paper>

        {error && (
          <Paper sx={{ p: 2, mb: 3, bgcolor: 'error.light', color: 'error.contrastText' }}>
            <Typography>Error: {error}</Typography>
          </Paper>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table sx={{ tableLayout: 'fixed' }}>
              <TableHead>
                <TableRow>
                  <TableCell width="20%" align="left" sx={{ verticalAlign: 'top' }}>Nombre</TableCell>
                  <TableCell width="52%" align="left" sx={{ verticalAlign: 'top' }}>Descripción</TableCell>
                  <TableCell width="10%" align="center" sx={{ verticalAlign: 'top' }}>Acceso</TableCell>
                  <TableCell width="18%" align="center" sx={{ verticalAlign: 'top' }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {gpts.length > 0 ? (
                  gpts.map((gpt) => (
                    <TableRow key={gpt._id}>
                      <TableCell sx={{
                        verticalAlign: 'top',
                        overflowWrap: 'break-word',
                        wordWrap: 'break-word',
                        hyphens: 'auto'
                      }}>
                        {gpt.name}
                      </TableCell>
                      <TableCell sx={{
                        verticalAlign: 'top',
                        overflowWrap: 'break-word',
                        wordWrap: 'break-word',
                        hyphens: 'auto'
                      }}>
                        {gpt.description}
                      </TableCell>
                      <TableCell align="center" sx={{ verticalAlign: 'top' }}>
                        <Chip
                          label={gpt.isPublic ? 'Público' : 'Privado'}
                          color={gpt.isPublic ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ verticalAlign: 'top' }}>
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end" sx={{ minWidth: 'fit-content' }}>
                          <Tooltip title="Ver GPT">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => navigate(`/gpts/${gpt._id}`)}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Editar configuración">
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => navigate(`/admin/gpts/edit/${gpt._id}`)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Editar permisos de acceso">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => navigate(`/admin/gpts/${gpt._id}/permissions`)}
                            >
                              <PeopleIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar de la aplicación">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteClick(gpt._id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Box sx={{ py: 3 }}>
                        <Typography variant="body1" gutterBottom>
                          No hay GPTs importados en la aplicación
                        </Typography>
                        <Button
                          variant="outlined"
                          color="primary"
                          startIcon={<AddIcon />}
                          onClick={() => navigate('/admin/gpts/new')}
                          sx={{ mt: 2 }}
                        >
                          Importar tu primer GPT
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Diálogo de confirmación para eliminar GPT */}
        <ConfirmDialog
          open={confirmDialogOpen}
          onClose={() => setConfirmDialogOpen(false)}
          onConfirm={confirmDelete}
          title="Eliminar GPT"
          content="¿Estás seguro de que deseas eliminar este GPT de la aplicación? Esta acción no afectará al GPT en OpenAI."
          confirmText="Aceptar"
          cancelText="Cancelar"
          confirmColor="error"
        />
      </Box>
    </MainLayout>
  );
};

export default AdminGPTsPage;