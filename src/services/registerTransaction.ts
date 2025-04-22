
import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { v4 as uuidv4 } from "uuid";
import { DynamoDB } from "aws-sdk";

const dynamoDb = new DynamoDB.DocumentClient({
  endpoint: process.env.DYNAMO_URL,
});

export const registerTransaction = async (
  event: APIGatewayEvent,
  user: any
): Promise<APIGatewayProxyResult> => {
  const body = JSON.parse(event.body || "{}");
  const { amount, description } = body;

  if (!description || amount === 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid payload" }),
    };
  }

  const transaction = {
    id: uuidv4(),
    userId: user.userId,
    amount,
    description,
    createdAt: new Date().toISOString(),
  };

  console.log("SALVANDO NO DYNAMO LOCAL")
  console.log(process.env.DYNAMODB_TABLE)

  try {
    await dynamoDb
      .put({
        TableName: process.env.DYNAMODB_TABLE!,
        Item: transaction,
      })
      .promise();
  } catch (err: any) {
    console.error("Error inserting item:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to insert transaction", details: err.message }),
    };
  }

  return {
    statusCode: 201,
    body: JSON.stringify(transaction),
  };
};
