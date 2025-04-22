import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDB } from "aws-sdk";

const dynamoDb = new DynamoDB.DocumentClient({
  endpoint: process.env.DYNAMO_URL,
})

export const listTransactions = async (
  event: APIGatewayEvent,
  user: any
): Promise<APIGatewayProxyResult> => {
  const { limit, lastKey } = event.queryStringParameters || {};

  const params: DynamoDB.DocumentClient.QueryInput = {
    TableName: process.env.DYNAMODB_TABLE!,
    KeyConditionExpression: "userId = :userId",
    ExpressionAttributeValues: { ":userId": user.userId },
    Limit: limit ? parseInt(limit) : 2,
    ExclusiveStartKey: lastKey ? JSON.parse(lastKey) : undefined,
    ScanIndexForward: false,
  };

  const result = await dynamoDb.query(params).promise();

  return {
    statusCode: 200,
    body: JSON.stringify({
      items: result.Items || [],
      lastEvaluatedKey: result.LastEvaluatedKey,
    }),
  };
};
