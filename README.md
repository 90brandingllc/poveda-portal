# 🚗 POVEDA PREMIUM AUTO CARE

A comprehensive car detailing service client portal built with React, Firebase, and Material-UI.

![POVEDA Logo](./public/logo.svg)

## ✨ Features

### 🔐 Authentication System
- **Email/Password Registration & Login**
- **Google Sign-In Integration**
- **Role-based Access Control** (Client & Admin)
- **Secure Session Management**

### 🌤️ Weather Integration (FREE API)
- **Real-time Weather Display** - Current conditions with location
- **Appointment Weather Forecasts** - Weather for upcoming appointment days
- **Smart Geolocation** - Automatic location detection
- **Modern Glassmorphism UI** - Beautiful weather cards
- **Smart Caching System** - Minimizes API calls (30min cache for current, 2h for forecasts)
- **FREE OpenWeatherMap API** - Up to 1,000 calls/day at no cost

### 👤 Client Portal
- **📊 Dashboard** - Overview with stats and quick actions
- **📅 Book Appointments** - Multi-step booking with real-time pricing
- **📋 Appointment Management** - View history and track status
- **💬 Support Tickets** - Real-time customer support system
- **💰 Get Estimates** - Custom pricing requests with smart calculator
- **🎫 Coupons System** - Discount code functionality

### ⚙️ Admin Portal
- **📈 Business Dashboard** - Metrics and analytics
- **📋 Appointment Management** - Approve/reject bookings
- **🎧 Support Management** - Handle customer inquiries
- **💵 Estimate Management** - Review and respond to quotes

### 🎨 Design & UX
- **📱 Mobile-Responsive** - Works on all devices
- **🎯 Professional UI** - Material-UI components
- **✨ Smooth Animations** - Framer Motion integration
- **🎨 POVEDA Branding** - Custom logo and color scheme

### 🔥 Firebase Integration
- **🗄️ Firestore Database** - Real-time data storage
- **🔐 Authentication** - Secure user management
- **📧 Cloud Functions** - Email automation
- **📊 Analytics** - Usage tracking

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Firebase Account**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/90brandingllc/clients-portal.git
   cd clients-portal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   # Firebase Configuration
   REACT_APP_FIREBASE_API_KEY=your-api-key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your-project-id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   REACT_APP_FIREBASE_APP_ID=your-app-id
   REACT_APP_FIREBASE_MEASUREMENT_ID=your-measurement-id
   
   # Weather API (Get free key from https://openweathermap.org/api)
   REACT_APP_WEATHER_API_KEY=your-openweathermap-api-key
   
   # Contact Information
   REACT_APP_SUPPORT_EMAIL=support@povedaautocare.com
   REACT_APP_SUPPORT_PHONE=(555) 123-4567
   ```

4. **Start development server**
   ```bash
   npm start
   ```

5. **Open browser**
   Navigate to `http://localhost:3000`

## 🔧 Firebase Setup

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable Authentication, Firestore, and Functions

### 2. Configure Authentication
- Enable **Email/Password** provider
- Enable **Google** provider
- Add your domain to authorized domains

### 3. Set up Firestore
- Create database in production mode
- Deploy security rules:
  ```bash
  firebase deploy --only firestore:rules
  ```

### 4. Deploy Cloud Functions (Optional)
```bash
cd functions
npm install
firebase deploy --only functions
```

## 🌤️ Weather API Setup (GRATIS)

### ¿Tiene costo la API?
**NO, es completamente GRATIS** con el plan gratuito de OpenWeatherMap:
- ✅ **1,000 llamadas por día** - Más que suficiente para un portal de clientes
- ✅ **Clima actual** - Temperatura, humedad, viento, descripción
- ✅ **Pronóstico de 5 días** - Clima para citas futuras
- ✅ **Sin tarjeta de crédito requerida** - Para el plan gratuito

### Configuración en 3 pasos:

1. **Obtener API Key GRATIS**
   - Ve a [OpenWeatherMap](https://openweathermap.org/api)
   - Crea una cuenta gratuita
   - Ve a "API Keys" y copia tu clave
   - ⏱️ La activación toma ~10 minutos

2. **Agregar a tu archivo `.env`**
   ```env
   REACT_APP_WEATHER_API_KEY=tu_clave_aqui
   ```

3. **Reiniciar la aplicación**
   ```bash
   npm start
   ```

### Sistema de Caché Inteligente
Para maximizar el uso gratuito, el widget implementa:
- **Clima actual**: Cache de 30 minutos
- **Pronósticos**: Cache de 2 horas
- **Resultado**: ~10-20 llamadas por día (muy por debajo del límite de 1,000)

### Funcionalidades del Widget
- 🌡️ Temperatura en tiempo real
- 💨 Velocidad del viento
- 💧 Humedad
- 📅 Pronóstico para próximas citas
- 📍 Detección automática de ubicación
- 🔄 Botón de actualización manual

## 📦 Build for Production

```bash
npm run build
```

## 🚀 Deployment Options

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push

### Firebase Hosting
```bash
firebase deploy --only hosting
```

### Netlify
1. Connect GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `build`
4. Add environment variables

## 🛡️ Security Features

- **Environment Variables** - Sensitive data stored securely
- **Firestore Rules** - Database access control
- **Input Validation** - Form data sanitization
- **Authentication Guards** - Protected routes
- **Role-based Access** - Admin vs Client permissions

## 📱 Service Offerings

### 🏠 General Services
- Mobile car detailing
- Paint protection
- Headlight restoration
- Scratch protection

### 🏢 Interior Services
- Steam cleaning & decontamination
- Thorough vacuuming
- Leather conditioning
- Odor elimination

### 🚗 Exterior Services
- Hand wash & detailing
- Paint correction
- Ceramic coating
- Wax & sealant application

### 📦 Service Packages
- **🥈 Silver Package** - $89 (Basic maintenance)
- **🥇 Gold Package** - $149 (Deep cleaning)
- **💎 Diamond Package** - $249 (Complete restoration)

## 🛠️ Tech Stack

- **Frontend**: React 18, Material-UI, Framer Motion
- **Backend**: Firebase (Auth, Firestore, Functions)
- **Styling**: Material-UI, CSS3 Animations
- **Build**: Create React App
- **Deployment**: Vercel/Firebase Hosting

## 📂 Project Structure

```
src/
├── components/
│   ├── Admin/          # Admin dashboard components
│   ├── Auth/           # Login/Register components
│   ├── Client/         # Client portal components
│   ├── Layout/         # Header/Footer components
│   ├── Public/         # Public pages (Home, Services)
│   └── Animations/     # Reusable animation components
├── contexts/           # React Context providers
├── firebase/           # Firebase configuration
└── index.js           # App entry point
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- **Email**: support@povedaautocare.com
- **Phone**: (555) 123-4567
- **Website**: [POVEDA PREMIUM AUTO CARE](https://povedaautocare.com)

## 🏆 Features Roadmap

- [ ] **Payment Integration** - Stripe/PayPal checkout
- [ ] **SMS Notifications** - Twilio integration
- [ ] **Calendar Integration** - Google Calendar sync
- [ ] **Photo Gallery** - Before/after service photos
- [ ] **Review System** - Customer feedback & ratings
- [ ] **Loyalty Program** - Points and rewards system
- [ ] **Multi-language** - Spanish language support
- [ ] **Mobile App** - React Native version

---

**Built with ❤️ for premium car care services**
