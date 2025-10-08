module.exports = {
  // Configuración de ESLint
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  // En lugar de deshabilitar el caché, modificamos otras configuraciones
  rules: {
    // Puedes agregar reglas específicas aquí
    'no-unused-vars': 'warn'
  }
};