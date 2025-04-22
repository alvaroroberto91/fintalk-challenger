import jwt from "jsonwebtoken";
import { SSM } from "aws-sdk";

let cachedSecret: string | null = null;

const getSecret = async (): Promise<string> => {
  if (cachedSecret) return cachedSecret;

  if (process.env.JWT_SECRET) {
    cachedSecret = process.env.JWT_SECRET;
    return cachedSecret;
  }
  const ssm = new SSM();
  const response = await ssm
    .getParameter({ Name: "/transactions/jwt-secret", WithDecryption: true })
    .promise();

  cachedSecret = response.Parameter?.Value || "";
  return cachedSecret;
};

export const verifyToken = async (token?: string): Promise<any> => {
  if (!token) throw new Error("Missing token");
  const rawToken = token.split(" ")[1];
  const secret = await getSecret();
  return jwt.verify(rawToken, secret);
};

export const generateToken = async (payload: object) => {
  const SECRET = await getSecret();
  return jwt.sign(payload, SECRET, {expiresIn: "1h"});
};