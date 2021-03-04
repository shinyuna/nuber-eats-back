# Nuber Eats

The Backend of Uber Eats Clone

## API Docs

---

### User API:

- Create Account
- Log In
- See Profile
- Edit Profile
- Verify Email

### Restaurant API

- See Categories
- See Restaurant by Category (pagination)
- See Restaurants (pagination)
- See Restaurant
- Create Dish
- Edit Dish
- Delete Dish

### Order API

- Create Order
- Get Orders
- Get Order (user)
- Edit Order Status
- Orders Subscription (WebSocket)
  - Pending Order (s: newOrder) (t: createOrder(newOrder))
  - Order Status (Customer, Dlivery, Owner) (s: orderUpdate) (t: editOrder(orderUpdate))
  - Pending Pickup Order (Delivery) (s: orderUpdate) (t: editOrder(orderUpdate))

### Payment API

- Create Payment (owner)
- Get Payments (owner)

## Use Tech Stack

---

- Nest JS
- TypeORM
- GraphQL
