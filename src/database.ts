import _ from 'lodash';
import low, { LowdbSync } from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync';
import { undasheriseDate } from './util';

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

export class Database {
  db: LowdbSync<Schema>;

  constructor(path: string) {
    const adapter = new FileSync<Schema>(path);
    this.db = low(adapter);

    this.db.defaults({ orders: [] }).write();
  }

  async addOrder(order: Order, id: string): Promise<void> {
    const existingId = this.db.get('orders').find({ id }).value();

    if (existingId) {
      throw new Error('Id already exists');
    }

    await this.db.get('orders').push(order).write();
  }

  async getOrderById(id: string): Promise<Order | undefined> {
    const order = this.db.get('orders').find({ id }).value();

    return order;
  }

  async getOrdersByTypeDate(type: string, date: string): Promise<OrderByTypeDateDto> {
    const orders = this.db
      .get('orders')
      .filter((order) => {
        return order.type === type && undasheriseDate(order.date) === date;
      })
      .value();

    const lastTenOrderIds = _.chain(orders)
      .sortBy((o) => new Date(o.date).valueOf())
      .reverse()
      .take(10)
      .value()
      .map((order) => order.id)
      .reverse();

    const totalOrders = orders.reduce<OrderByTypeDateDto>(
      (acc, order) => {
        return {
          ...acc,
          type,
          count: orders.length,
          orders: lastTenOrderIds,
          related_customers: [...new Set([...acc.related_customers, order.customer])],
        };
      },
      {
        type,
        count: 0,
        orders: [],
        related_customers: [],
      }
    );
    return { ...totalOrders };
  }
}
