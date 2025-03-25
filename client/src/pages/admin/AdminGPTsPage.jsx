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
  CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchGPTs, deleteGPT } from '../../redux/slices/gptSlice';
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
      dispatch(fetchGPTs());
    }
  }, [dispatch, navigate, user]);
  
  const handleDelete = (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este GPT?')) {
      dispatch(deleteGPT(id))
        .unwrap()
        .then(() => {
          dispatch(addAlert({ 
            message: 'GPT eliminado correctamente', 
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
      <Box sx={{ flexGrow: 1, pt: 2 }}>
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
            Nuevo GPT
          </Button>
        </Box>
        
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
                  <TableCell>Modelo</TableCell>
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
                      <TableCell>{gpt.model}</TableCell>
                      <TableCell>
                        <Chip 
                          label={gpt.isPublic ? 'Público' : 'Privado'} 
                          color={gpt.isPublic ? 'success' : 'default'} 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton 
                          color="primary" 
                          onClick={() => navigate(`/gpts/${gpt._id}`)}
                        >
                          <VisibilityIcon />
                        </IconButton>
                        <IconButton 
                          color="info" 
                          onClick={() => navigate(`/admin/gpts/edit/${gpt._id}`)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          color="error" 
                          onClick={() => handleDelete(gpt._id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No hay GPTs disponibles
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