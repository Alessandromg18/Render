// app/middleware/authMiddleware.js

// Middleware para verificar si el usuario está autenticado
const isAuthenticated = (req, res, next) => {
    // Verificar si existe el userId en la sesión
    // Nota: Asume que el userId se guarda en req.session.userId al hacer login
    if (req.session && req.session.userId) {
        // Si está autenticado, permite que la solicitud continúe
        next();
    } else {
        // Si no está autenticado, devuelve un error 401
        return res.status(401).json({ error: 'Acceso denegado. Se requiere autenticación.' });
    }
};

// Si necesitas un middleware de rol en otro lado, puedes importarlo aquí o usarlo directamente en las rutas.
// Por ahora, solo exportamos la función principal para que authRoutes.js la use.
module.exports = isAuthenticated
