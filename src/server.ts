import express from 'express';
import cors from 'cors';
import _ from 'lodash';
import { Database } from './database';

const app = express();
app.use(express.json());
app.use(cors());

const database = new Database('db.json');

app.post('/orders', async (req, res, next) => {
  try {
    const { body } = req;

    await database.addOrder(body, body.id);

    res.json({ body }).status(200);
  } catch (error) {
    next(error);
    res.status(409);
  }
});

app.get('/orders/:id', async (req, res) => {
  const order = await database.getOrderById(req.params.id);

  if (!order) {
    res.json(`No order found with id: ${req.params.id}`).status(404);
  }

  res.json(order).status(200);
});

app.get('/orders/:type/:date', async (req, res) => {
  const orders = await database.getOrdersByTypeDate(req.params.type, req.params.date);

  res.json(orders).status(200);
});

app.listen(3000, () => {
  console.log('listening on 3000');
});
