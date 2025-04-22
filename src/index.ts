import { APIGatewayProxyHandler } from "aws-lambda";
import { loginHandler } from "./services/loginHandler";
import { registerTransaction } from "./services/registerTransaction";
import { listTransactions } from "./services/listTransactions";
import { getMonthlyBalance } from "./services/getMonthlyBalance";
import { verifyToken } from "./utils/jwt";

const routes = [
  {
    method: "POST",
    path: "/login",
    handler: loginHandler,
    authRequired: false,
  },
  {
    method: "POST",
    path: "/transactions",
    handler: registerTransaction,
    authRequired: true,
  },
  {
    method: "GET",
    path: "/transactions",
    handler: listTransactions,
    authRequired: true,
  },
  {
    method: "GET",
    path: "/balance",
    handler: getMonthlyBalance,
    authRequired: true,
  },
];

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const route = routes.find(
      (r) => r.method === event.httpMethod && event.path.endsWith(r.path)
    );

    if (!route) {
      return { statusCode: 404, body: "Not found" };
    }

    const user = route.authRequired
      ? await verifyToken(event.headers.Authorization || event.headers.authorization)
      : null;

    return await route.handler(event, user);
  } catch (err: any) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Unauthorized", error: err.message }),
    };
  }
};