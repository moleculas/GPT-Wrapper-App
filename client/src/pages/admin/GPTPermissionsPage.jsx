import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    Paper,
    FormControlLabel,
    Switch,
    Stack,
    CircularProgress,
    Alert,
    Divider,
    TextField,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Autocomplete
} from '@mui/material';
import { Delete as DeleteIcon, Check as CheckIcon } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchGPT, updateGPT } from '../../redux/slices/gptSlice';
import { fetchUsers } from '../../redux/slices/userSlice';
import { addAlert } from '../../redux/slices/uiSlice';
import MainLayout from '../../components/layout/MainLayout';

const GPTPermissionsPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { currentGPT, loading, error } = useSelector(state => state.gpts);
    const { users, loading: usersLoading } = useSelector(state => state.users);
    const { user } = useSelector(state => state.auth);

    const [isPublic, setIsPublic] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [userInput, setUserInput] = useState('');
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [initialLoading, setInitialLoading] = useState(true);

    useEffect(() => {
        if (user && user.role !== 'admin') {
            navigate('/');
            dispatch(addAlert({
                message: 'No tienes permisos para acceder a esta sección',
                type: 'error'
            }));
            return;
        }

        if (id) {
            dispatch(fetchUsers())
                .then(() => dispatch(fetchGPT(id)))
                .finally(() => setInitialLoading(false));
        } else {
            navigate('/admin/gpts');
            dispatch(addAlert({
                message: 'No se encontró el ID del GPT',
                type: 'error'
            }));
        }
    }, [dispatch, navigate, id, user]);

    useEffect(() => {
        if (currentGPT && users && users.length > 0 && user) {
            setIsPublic(currentGPT.isPublic || false);
            if (Array.isArray(currentGPT.allowedUsers) && currentGPT.allowedUsers.length > 0) {                
                const allowedUsersObjects = currentGPT.allowedUsers
                    .map(allowedUser => {
                        if (allowedUser && typeof allowedUser === 'object' && allowedUser._id) {
                            return allowedUser;
                        }
                        const userId = typeof allowedUser === 'string' ? allowedUser : allowedUser?._id;
                        if (userId) {
                            const foundUser = users.find(u => u._id === userId);
                            return foundUser || null;
                        }
                        
                        return null;
                    })
                    .filter(u => {
                        if (!u || !u._id) return false;
                        const isAdmin = u._id === user.id || 
                                       u.email === user.email || 
                                       u.name === user.name;                        
                        return !isAdmin;
                    });             
                
                setSelectedUsers(allowedUsersObjects);
            } else {
                setSelectedUsers([]);
            }
        }
    }, [currentGPT, users, user]);

    useEffect(() => {
        if (users && userInput && user) {
            const usersArray = Array.isArray(users) ? users : [];
            const currentUserEmail = user.email?.toLowerCase();

            const filtered = usersArray.filter(listedUser => {
                if (!listedUser || !listedUser._id || !listedUser.email) return false;
                const isCurrentUser = listedUser._id === user.id || listedUser.email?.toLowerCase() === currentUserEmail;
                const isAlreadySelected = selectedUsers.some(
                    selected => selected && selected._id === listedUser._id
                );
                const matchesSearch =
                    (listedUser.name?.toLowerCase() || '').includes(userInput.toLowerCase()) ||
                    (listedUser.email?.toLowerCase() || '').includes(userInput.toLowerCase());

                return !isCurrentUser && !isAlreadySelected && matchesSearch;
            });

            setFilteredUsers(filtered);
        } else {
            setFilteredUsers([]);
        }
    }, [userInput, users, selectedUsers, user]);

    const handleTogglePublic = () => {
        setIsPublic(!isPublic);
    };

    const handleAddUser = (newUser) => {
        if (newUser && newUser._id) {
            const alreadySelected = selectedUsers.some(selected => selected && selected._id === newUser._id);
            if (!alreadySelected) {
                setSelectedUsers([...selectedUsers, newUser]);
            }
        }
        setUserInput('');
    };

    const handleRemoveUser = (userId) => {
        setSelectedUsers(selectedUsers.filter(u => u && u._id !== userId));
    };

    const handleSavePermissions = () => {
        const permissionData = {
            isPublic,
            allowedUsers: isPublic ? [] : selectedUsers.filter(u => u && u._id).map(u => u._id)
        };

        dispatch(updateGPT({ id, gptData: permissionData }))
            .unwrap()
            .then(() => {
                dispatch(addAlert({
                    message: 'Permisos actualizados correctamente',
                    type: 'success'
                }));
                navigate('/admin/gpts');
            })
            .catch((error) => {
                dispatch(addAlert({
                    message: `Error al actualizar permisos: ${error.message || 'Desconocido'}`,
                    type: 'error'
                }));
            });
    };

    if (loading || usersLoading || initialLoading) {
        return (
            <MainLayout>
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            </MainLayout>
        );
    }

    if (!currentGPT) {
        return (
            <MainLayout>
                <Box sx={{ p: 3 }}>
                    <Alert severity="error">No se pudo cargar la información del GPT</Alert>
                </Box>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <Box sx={{ flexGrow: 1, p: 3 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Configurar permisos de acceso
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                <Paper sx={{ p: 3, mb: 3, bgcolor: '#f9f9f9', borderRadius: 1 }}>
                    <Typography variant="h6" gutterBottom>
                        {currentGPT.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Configura qué usuarios podrán acceder a este Asistente. Puedes hacerlo disponible para todos los usuarios o seleccionar usuarios específicos.
                    </Typography>
                </Paper>

                <Paper sx={{ p: 3 }}>
                    <Stack spacing={3}>
                        <Box>
                            <Typography variant="h6" gutterBottom>
                                Permisos de acceso
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                        </Box>

                        <Box>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={isPublic}
                                        onChange={handleTogglePublic}
                                        color="primary"
                                    />
                                }
                                label="Disponible para todos los usuarios"
                            />
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                {isPublic
                                    ? "Todos los usuarios podrán ver y usar este Asistente"
                                    : "Solo los usuarios seleccionados podrán acceder a este Asistente"}
                            </Typography>
                        </Box>

                        {!isPublic && (
                            <Box>
                                <Typography variant="subtitle1" gutterBottom>
                                    Usuarios con acceso
                                </Typography>

                                <Autocomplete
                                    freeSolo
                                    options={filteredUsers}
                                    getOptionLabel={(option) => option && option.email ? option.email : ''}
                                    inputValue={userInput}
                                    onInputChange={(event, newInputValue) => {
                                        setUserInput(newInputValue);
                                    }}
                                    onChange={(event, newValue) => {
                                        if (newValue && typeof newValue !== 'string') {
                                            handleAddUser(newValue);
                                        }
                                    }}
                                    disabled={isPublic}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Buscar usuario por nombre o email"
                                            variant="outlined"
                                            fullWidth
                                            disabled={isPublic}
                                            sx={{ mb: 2 }}
                                        />
                                    )}
                                    renderOption={(props, option) => {
                                        if (!option || !option._id) return null;
                                        return (
                                            <li
                                                key={`option-${option._id}`}
                                                onClick={() => handleAddUser(option)}
                                                className={props.className}
                                                role={props.role}
                                            >
                                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                                    <Typography variant="body1">{option.name}</Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        {option.email}
                                                    </Typography>
                                                </Box>
                                            </li>
                                        );
                                    }}
                                />

                                {selectedUsers.length > 0 ? (
                                    <List sx={{ bgcolor: '#f5f5f5', borderRadius: 1, mt: 2 }}>
                                        {selectedUsers.filter(u => u && u._id).map((u) => (
                                            <ListItem
                                                key={`selected-${u._id}`}
                                                secondaryAction={
                                                    <IconButton
                                                        edge="end"
                                                        aria-label="delete"
                                                        onClick={() => handleRemoveUser(u._id)}
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                }
                                            >
                                                <ListItemText
                                                    primary={u.name}
                                                    secondary={u.email}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                ) : (
                                    <Alert severity="info" sx={{ mt: 2 }}>
                                        No hay usuarios seleccionados. Nadie podrá acceder a este Asistente si no es público.
                                    </Alert>
                                )}
                            </Box>
                        )}

                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                                variant="outlined"
                                color="inherit"
                                onClick={() => navigate('/admin/gpts')}
                                sx={{ mr: 2 }}
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleSavePermissions}
                                variant="contained"
                                color="primary"
                                disabled={loading || (!isPublic && selectedUsers.length === 0)}
                                endIcon={<CheckIcon />}
                            >
                                Guardar permisos
                            </Button>
                        </Box>
                    </Stack>
                </Paper>
            </Box>
        </MainLayout>
    );
};

export default GPTPermissionsPage;