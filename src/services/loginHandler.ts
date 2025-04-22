import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { generateToken } from "../utils/jwt"

const FAKE_USERS = [
  { id: "user-1", email: "user1@example.com", password: "123456" },
  { id: "user-2", email: "user2@example.com", password: "abcdef" },
];

const SECRET = process.env.JWT_SECRET || "dev-secret";

export const loginHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const body = JSON.parse(event.body || "{}");
    const { email, password } = body;

    if (!email || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Email and password are required" }),
      };
    }

    const user = FAKE_USERS.find(
      (u) => u.email === email && u.password === password
    );

    if (!user) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: "Invalid credentials" }),
      };
    }

    const token = await generateToken({userId: user.id});

    return {
      statusCode: 200,
      body: JSON.stringify({ token }),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal error", error: err.message }),
    };
  }
};
