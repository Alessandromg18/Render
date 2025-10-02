// Middleware para verificar roles de usuario
const roleMiddleware = (roles) => {
    return (req, res, next) => {
        // Obtener el rol del usuario desde la sesión
        const userRole = req.session.rol;

        // Verificar si el rol está permitido
        if (!roles.includes(userRole)) {
            return res.status(403).json({ error: 'Acceso denegado. No tienes permisos suficientes.' });
        }

        // Si el rol es válido, proceder con la ejecución de la siguiente función
        next();
    };
};

module.exports = roleMiddleware;
