import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { handleApiRequest } from './apiHandler';

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(async (req, res) => {
  await handleApiRequest(req, res);
});

export default app;
