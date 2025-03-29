import React, { useEffect } from 'react';
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
  Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchAllGPTs, deleteGPT } from '../../redux/slices/gptSlice';
import { addAlert } from '../../redux/slices/uiSlice';
import MainLayout from '../../components/layout/MainLayout';

const AdminGPTsPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { gpts, loading, error } = useSelector(state => state.gpts);
  const { user } = useSelector(state => state.auth);

  useEffect(() => {
    // Verificar si el usuario es administrador
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

  const handleDelete = (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este GPT de la aplicación? Esta acción no afectará al GPT en OpenAI.')) {
      dispatch(deleteGPT(id))
        .unwrap()
        .then(() => {
          dispatch(addAlert({
            message: 'GPT eliminado correctamente de la aplicación',
            type: 'success'
          }));
        })
        .catch(() => {
          dispatch(addAlert({
            message: 'Error al eliminar el GPT',
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
            Administrar GPTs
          </Typography>

          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/admin/gpts/new')}
          >
            Importar GPT
          </Button>
        </Box>

        <Paper sx={{ p: 3, mb: 4, bgcolor: '#f9f9f9', borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom>
            Gestión de GPTs personalizados
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Desde aquí puedes importar GPTs personalizados desde tu cuenta de OpenAI, gestionar sus ajustes de visibilidad
            y controlar qué usuarios tienen acceso a cada GPT. Los GPTs importados deben existir previamente en tu cuenta empresarial de OpenAI.
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
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell>ID en OpenAI</TableCell>
                  <TableCell>Acceso</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {gpts.length > 0 ? (
                  gpts.map((gpt) => (
                    <TableRow key={gpt._id}>
                      <TableCell>{gpt.name}</TableCell>
                      <TableCell>
                        {gpt.description.length > 50
                          ? `${gpt.description.substring(0, 50)}...`
                          : gpt.description}
                      </TableCell>
                      <TableCell>
                        <code>{gpt.openaiId}</code>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={gpt.isPublic ? 'Público' : 'Privado'}
                          color={gpt.isPublic ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Ver GPT">
                          <IconButton
                            color="primary"
                            onClick={() => navigate(`/gpts/${gpt._id}`)}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Editar configuración">
                          <IconButton
                            color="info"
                            onClick={() => navigate(`/admin/gpts/edit/${gpt._id}`)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar de la aplicación">
                          <IconButton
                            color="error"
                            onClick={() => handleDelete(gpt._id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
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
      </Box>
    </MainLayout>
  );
};

export default AdminGPTsPage;