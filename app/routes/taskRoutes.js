const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');

// Crear tarea
router.post('/', taskController.createTask);

// Actualizar tarea
router.put('/', taskController.updateTask);

// Eliminar tarea
router.delete('/:taskId', taskController.deleteTask);

// Completar tarea
router.put('/complete/:taskId', taskController.completeTask);

// Obtener tareas del usuario (con filtros opcionales)
router.get('/', taskController.getTasks);

module.exports = router;
