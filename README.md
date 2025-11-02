![Impulso Web3](./header.png)

# 🎨 Impulso Web3

> Comunidad descentralizada que empodera a creadores y artistas mediante blockchain

**Impulso Web3** es una plataforma completa de economía creativa construida sobre **Arbitrum Stylus**, que conecta artistas con su audiencia a través de smart contracts transparentes. Utiliza Rust para implementar contratos inteligentes más eficientes y seguros que Solidity tradicional.

---

## 🌟 Características Principales

### 🎵 **Creadores**
- **Registro de Artistas**: Sistema de verificación para artistas y creadores
- **Subir Contenido**: Upload de canciones con hashes IPFS para almacenamiento descentralizado
- **Gestión de Propiedad**: Control total sobre el contenido y sus ingresos

### ❤️ **Apoyar Comunidad**
- **Explorar Canciones**: Descubre y explora música de creadores independientes
- **Donaciones Directas**: Apoya directamente a los artistas que te gustan
- **Ranking de Donadores**: Sistema de reconocimiento para los supporters más activos
- **Historial de Donaciones**: Rastrea todo tu apoyo a la comunidad

### 💰 **Sistema de Finanzas**
- **Distribución Automática**: 80% artista, 12% sistema, 8% incentivos
- **Fondo de Incentivos**: Pool de recompensas para miembros activos
- **Retiros Automáticos**: Configuración flexible de retiros para administradores
- **Transparencia Total**: Todas las transacciones registradas on-chain

### 🤖 **Luna AI**
- **Asistente Inteligente**: Chat con IA para ayudar en la plataforma
- **Respuestas Contextuales**: Información sobre contratos, donaciones y más

---

## 🏗️ Arquitectura Técnica

### **Smart Contract (Rust + Arbitrum Stylus)**

El contrato `CreativeFinance` está implementado en Rust usando el Stylus SDK:

**Ubicación**: `src/lib.rs`

**Estructura de Datos**:
```rust
pub struct CreativeFinance {
    address admin;
    mapping(address => Artist) artists;
    mapping(uint256 => Song) songs;
    mapping(address => Supporter) supporters;
    uint256 song_counter;
    uint256 system_balance;
    uint256 incentive_pool;
    bool paused;
    bool reentrancy_lock;
    // Configuración de retiros automáticos
    address withdrawal_target;
    uint256 withdrawal_threshold;
    uint256 withdrawal_interval;
    uint256 last_withdrawal_timestamp;
}
```

**Funciones Principales**:
- `register_artist()` - Registro de nuevos artistas
- `upload_song(title_hash, ipfs_hash)` - Subir canciones
- `donate(song_id)` - Donaciones a canciones
- `distribute_incentives(a1, a2, a3)` - Distribución de incentivos
- `get_balances()` - Consulta de balances
- `get_song_info(song_id)` - Información de canciones
- `get_supporter_info(address)` - Estadísticas de supporters

### **Frontend (HTML/CSS/JS)**

- **Framework**: Vanilla JavaScript + Tailwind CSS
- **Web3**: Web3.js para interacción con blockchain
- **3D Graphics**: Three.js para partículas interactivas
- **Animaciones**: GSAP para transiciones suaves
- **IA**: Google GenAI para asistente chat

### **Redes Soportadas**

- Arbitrum Sepolia (Testnet)
- Arbitrum One (Mainnet)

---

## 🚀 Instalación y Setup

### **Prerrequisitos**

1. **Rust** (última versión estable)
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. **Stylus CLI**
   ```bash
   cargo install --force cargo-stylus cargo-stylus-check
   ```

3. **Target WASM**
   ```bash
   rustup target add wasm32-unknown-unknown
   ```

### **Clonar Repositorio**

```bash
git clone <repository-url>
cd Hackathon
```

### **Instalar Dependencias Frontend**

```bash
npm install
```

### **Verificar Compilación del Contrato**

```bash
cargo stylus check
```

Si todo está correcto, verás:
```
Finished release [optimized] target(s) in X.XXs
Reading WASM file at target/wasm32-unknown-unknown/release/stylus-hello-world.wasm
Compressed WASM size: XX KB
Program succeeded Stylus onchain activation checks with Stylus version: 1
```

---

## 📝 Uso

### **Desarrollo Local**

1. **Compilar el contrato**:
   ```bash
   cargo stylus check
   ```

2. **Iniciar servidor local**:
   ```bash
   # Usa cualquier servidor HTTP estático
   python -m http.server 8000
   # o
   npx serve
   ```

3. **Abrir en navegador**:
   ```
   http://localhost:8000
   ```

### **Desplegar a Testnet**

1. **Exportar ABI**:
   ```bash
   cargo stylus export-abi
   ```

2. **Deploy del contrato**:
   ```bash
   cargo stylus deploy \
     --private-key-path=<PRIVKEY_FILE> \
     --estimate-gas
   ```

3. **Actualizar direcciones**:
   - Edita `contracts-arbitrum.js` con la dirección del contrato desplegado

### **Flujo de Usuario**

1. **Creadores**:
   - Conecta tu wallet (MetaMask recomendado)
   - Regístrate como artista
   - Sube tus canciones con hash IPFS
   - Recibe donaciones directamente

2. **Donadores**:
   - Explora canciones disponibles
   - Escucha y dona a tus favoritos
   - Rastrea tu historial
   - Compite en el ranking de supporters

3. **Administradores**:
   - Configura retiros automáticos
   - Distribuye incentivos
   - Gestiona el sistema global

---

## 🔒 Seguridad

- ✅ **Reentrancy Protection**: Lock incorporado
- ✅ **Pausable**: Sistema de pausa para emergencias
- ✅ **Access Control**: Solo admin para funciones críticas
- ✅ **Validación de Parámetros**: Checks en todas las funciones
- ✅ **Overflow Protection**: U256 para cálculos seguros

---

## 📊 Distribución de Fondos

Cada donación se divide automáticamente:

```
100% Donación
  ├─ 80% → Artista (directo)
  ├─ 12% → Sistema (reserva)
  └─ 8% → Pool de Incentivos
```

### **Pool de Incentivos**

Distribución a top 3:
- 🥇 Primer lugar: 50%
- 🥈 Segundo lugar: 30%
- 🥉 Tercer lugar: 20%

---

## 🎯 Tracks del Hackathon Cubiertos

- ✅ **Arbitrum Stylus**: Contratos Rust sobre Arbitrum
- ✅ **Creatividad y Economías de Creadores**: Plataforma para artistas
- ✅ **Finanzas Descentralizadas**: DeFi para creadores
- ✅ **Inclusión Financiera**: Acceso abierto y transparente

---

## 🛠️ Stack Tecnológico

**Backend/Blockchain**:
- Rust
- Arbitrum Stylus SDK
- WASM Compilation

**Frontend**:
- HTML5
- Tailwind CSS
- Vanilla JavaScript
- Web3.js
- Three.js
- GSAP

**Integraciones**:
- MetaMask
- IPFS (para contenido)
- Google Generative AI
- Font Awesome

---

## 📁 Estructura del Proyecto

```
Hackathon/
├── src/                    # Contrato Rust
│   ├── lib.rs             # Lógica principal
│   └── main.rs            # Entry point
├── index.html             # Frontend principal
├── app.js                 # Lógica JavaScript
├── styles.css             # Estilos
├── morpho-particles.js    # Sistema 3D
├── contracts-arbitrum.js  # Direcciones de contratos
├── stylus-contracts.js    # ABIs
├── networks.js            # Configuración de redes
├── Cargo.toml             # Dependencias Rust
├── package.json           # Dependencias JS
└── README.md              # Este archivo
```

---

## 🤝 Contribuir

Este proyecto está abierto a contribuciones. Algunas ideas:

- Mejorar la UI/UX
- Agregar más funcionalidades de DeFi
- Integración con más redes
- Optimizaciones de gas
- Tests adicionales

---

## 📄 Licencia

Este proyecto está bajo licencia MIT. Ver archivos de licencia en `licenses/`.

---

## 🌐 Enlaces

- **YouTube**: [@vicdanielpaz4949](https://www.youtube.com/@vicdanielpaz4949)
- **Arbitrum Stylus Docs**: [docs.arbitrum.io/stylus](https://docs.arbitrum.io/stylus)

---

## 📞 Contacto

Para preguntas sobre el proyecto, abre un issue o contacta al equipo.

---

**Hecho con ❤️ para la comunidad creativa**
