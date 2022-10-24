import express from 'express';
import cors from 'cors';
import { Low, JSONFile } from 'lowdb';
import _ from 'lodash';

interface Schema {
  orders: Order[];
}

interface Order {
  id: string;
  title: string;
  date: string;
  type: string;
  customer: string;
}

interface OrderByTypeDateDto {
  type: string;
  count: number;
  orders: string[];
  related_customers: string[];
}

const app = express();
app.use(express.json());
app.use(cors());

const adapter = new JSONFile<Schema>('db.json');
const db = new Low(adapter);
await db.read();
db.data ||= { orders: [] };

const { orders } = db.data;

const undasheriseDate = (date: string) => date.replaceAll('-', '');

const getOrderById = (id: string): Order | undefined => {
  return orders.find((order) => order.id === id);
};

const getOrderByTypeDate = (type: string, date: string): Order[] => {
  return orders.filter((order) => {
    return order.type === type && undasheriseDate(order.date) === date;
  });
};

const lastTenOrders = (orderCount: number, orders: string[]): string[] => {
  if (orderCount > 10) {
    const difference = orderCount - 10;

    return _.drop(orders, difference);
  }
  return orders;
};

const totalOrdersByTypeDate = (orders: Order[]): OrderByTypeDateDto => {
  const count = orders.length;

  const totalOrders = orders.reduce<OrderByTypeDateDto>(
    (acc, order) => {
      return {
        ...acc,
        type: order.type,
        count,
        orders: [...acc.orders, order.id],
        related_customers: [...new Set([...acc.related_customers, order.customer])],
      };
    },
    {
      type: '',
      count: 0,
      orders: [],
      related_customers: [],
    }
  );
  return { ...totalOrders, orders: lastTenOrders(count, totalOrders.orders) };
};

app.post('/orders', async (req, res) => {
  const { body } = req;

  if (!getOrderById(body.id)) {
    orders.push(body);
    await db.write();
    const order = getOrderById(body.id);

    res.json({ order, message: 'order added successfully' });
  }
  res.json('Order ID already exists.');
});

app.get('/orders/:id', async (req, res) => {
  const order = getOrderById(req.params.id);
  if (!order) {
    res.json('Order ID not found.');
  }

  res.json(order);
});

app.get('/orders/:type/:date', async (req, res) => {
  const orders = getOrderByTypeDate(req.params.type, req.params.date);
  const totalOrders = totalOrdersByTypeDate(orders);

  res.json(totalOrders);
});

app.listen(3000, () => {
  console.log('listening on 3000');
});
