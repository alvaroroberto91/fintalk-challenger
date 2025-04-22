import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDB } from "aws-sdk";

const dynamoDb = new DynamoDB.DocumentClient({
  endpoint: process.env.DYNAMO_URL,
});

export const getMonthlyBalance = async (
  event: APIGatewayEvent,
  user: any
): Promise<APIGatewayProxyResult> => {
  const { yearAndMonth } = event.queryStringParameters || {};
  if (!yearAndMonth) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing month parameter" }),
    };
  }

  const [yearStr, monthStr] = yearAndMonth.split("-");
  const year = parseInt(yearStr);
  const mon = parseInt(monthStr);
  const lastDay = new Date(year, mon, 0).getDate();

  const startDate = `${yearAndMonth}-01T00:00:00Z`;
  const endDate = `${yearAndMonth}-${String(lastDay).padStart(2, "0")}T23:59:59Z`;

  console.log("Querying transactions", user.userId, "between", startDate, "and", endDate);

  const params: DynamoDB.DocumentClient.QueryInput = {
    TableName: process.env.DYNAMODB_TABLE!,
    KeyConditionExpression: "userId = :userId AND createdAt BETWEEN :start AND :end",
    ExpressionAttributeValues: {
      ":userId": user.userId,
      ":start": startDate,
      ":end": endDate,
    },
  };

  try {
    const result = await dynamoDb.query(params).promise();

    const balance = result.Items?.reduce((acc, tx) => acc + (Number(tx.amount) || 0), 0) || 0;

    return {
      statusCode: 200,
      body: JSON.stringify({ balance }),
    };
  } catch (err: any) {
    console.error("Error when checking monthly balance: ", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to get monthly balance", details: err.message }),
    };
  }
};
