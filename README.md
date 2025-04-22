# Financial Transactions Microservice

This repository contains the code and infrastructure for a financial transactions microservice built using **Node.js**, **TypeScript**, **AWS Lambda**, **DynamoDB**, and **Terraform**.

## Features

- **Register a Transaction**: Save transactions in DynamoDB.
- **List User Transactions**: Retrieve all transactions for a user with pagination.
- **Get User Balance for a Specific Month**: Calculate the balance for a user in a given month by summing all transaction amounts.
- **Stream Transactions to RDS (for Analytics)**: Plan for streaming DynamoDB transactions to an RDS instance for analytics.
- **JWT Authentication**: Protect endpoints using JWT tokens.
- **Parameter Store**: Use AWS Parameter Store for managing sensitive data (like JWT secrets).


In order to add a simple JWT validation, I added a login handler with two dummy users set in the code.

This function is just to exemplify the use of JWT.

To use, call the /login route passing one of the two users:
```bash
email: "user1@example.com", password: "123456"
email: "user2@example.com", password: "abcdef"
```

## Prerequisites

Before running this project locally, make sure you have the following installed:

- [Node.js](https://nodejs.org/) (version >= 22.x)
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
- [Docker](https://www.docker.com/) (for DynamoDB Local)
- [Terraform](https://www.terraform.io/downloads) (for provisioning infrastructure)
- [AWS CLI](https://aws.amazon.com/cli/) (for interacting with AWS)

## Project Setup

### 1. Install Node.js dependencies

```bash
yarn || npm install
```

After that, buil the project

```bash
yarn build
```

### 2. Configure DynamoDB Local

To run DynamoDB locally, you need to use **Docker**.

#### Create docker local network

```bash
docker network create sam-network
```

#### Run DynamoDB Local

```bash
docker run -d --network=sam-network --name dynamo -p 8000:8000 amazon/dynamodb-local
```

DynamoDB Local will be available at `http://localhost:8000`.

#### Create the DynamoDB table locally

Run the following AWS CLI command to create the `Transactions` table in DynamoDB Local:

```bash
aws dynamodb create-table     --table-name Transactions     --attribute-definitions AttributeName=id,AttributeType=S AttributeName=userId,AttributeType=S     --key-schema AttributeName=id,KeyType=HASH AttributeName=userId,KeyType=RANGE     --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5     --endpoint-url http://localhost:8000
```

### 3. Configure SAM Local Env

Create a file called template.yaml at the project root with the following template:

```bash
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Resources:
  TransactionsFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: transactions-handler
      Handler: dist/index.handler
      Runtime: nodejs22.x
      CodeUri: .
      Environment:
        Variables:
          JWT_SECRET: your-secret
          DYNAMODB_TABLE: Transactions
          DYNAMO_URL: http://dynamo:8000
      Timeout: 10
      Events:
        Api:
          Type: Api
          Properties:
            Path: /{proxy+}
            Method: ANY
```

### 4. Running the Lambda Locally

Use the following command to invoke the function locally:

```bash
sam local start-api --docker-network=sam-network
```

## Testing
#### /login (POST)

```bash
curl --location 'http://localhost:3000/login' \
--header 'Content-Type: application/json' \
--data-raw '{
    "email": "user1@example.com",
    "password": "123456"
}'
```

#### /transactions (POST)

```bash
curl --location 'http://localhost:3000/transactions' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer YOUR-TOKEN' \
--data '{
    "amount": -590,
    "description": "12234"
}'
```

#### /transactions (GET)

```bash
curl --location 'http://localhost:3000/transactions?limit=2' \
--header 'Authorization: Bearer YOUR-TOKEN'
```

#### /balance (GET)

```bash
curl --location 'http://localhost:3000/balance?yearAndMonth=2025-04' \
--header 'Authorization: Bearer YOUR-TOKEN'
```

### Automated Tests

```bash
yarn test
```

## Plan for RDS Streaming

```
[Client / API Gateway]
          |
          v
[AWS Lambda - Register Transaction]
          |
          v
[DynamoDB - Transactions Table]
          |
          v
[DynamoDB Streams - Change Data Capture]
          |
          v
[AWS Lambda - Stream Processor]
          |
          v
[Amazon RDS - Relational DB (e.g., PostgreSQL)]
```
