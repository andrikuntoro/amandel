const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));

app.use('/api/auth',          require('./routes/auth'));
app.use('/api/users',         require('./routes/users'));
app.use('/api/events',        require('./routes/events'));
app.use('/api/matches',       require('./routes/matches'));
app.use('/api/rewards',       require('./routes/rewards'));
app.use('/api/redemptions',   require('./routes/redemptions'));
app.use('/api/leaderboard',   require('./routes/leaderboard'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/admin',         require('./routes/admin'));

app.get('/health', (_, res) => res.json({ status: 'ok', app: 'Amandel API' }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🎾 Amandel API running on :${PORT}`));
