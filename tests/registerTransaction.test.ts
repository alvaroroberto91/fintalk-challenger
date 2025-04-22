import { registerTransaction } from "../src/services/registerTransaction";
import { APIGatewayEvent } from "aws-lambda";

jest.mock("aws-sdk", () => {
    const originalModule = jest.requireActual("aws-sdk");
    return {
        ...originalModule,
        DynamoDB: {
            DocumentClient: jest.fn(() => ({
                put: jest.fn().mockReturnThis(),
                promise: jest.fn().mockResolvedValue({}),
            })),
        },
    };
});

const mockUser = {
    userId: "user-123",
};


describe("registerTransaction", () => {
    let event: APIGatewayEvent;

    beforeEach(() => {
        event = {
            body: JSON.stringify({
                amount: 100,
                description: "Service payment",
            }),
        } as APIGatewayEvent;
    });

    it("should save the transaction successfully", async () => {
        const result = await registerTransaction(event, mockUser);

        expect(result.statusCode).toBe(201);
        const responseBody = JSON.parse(result.body!);
        expect(responseBody.id).toBeDefined();
        expect(responseBody.userId).toBe(mockUser.userId);
        expect(responseBody.amount).toBe(100);
        expect(responseBody.description).toBe("Service payment");
    });

    it("should return 400 if description is missing", async () => {
        event.body = JSON.stringify({
            amount: 100,
            description: "",
        });

        const result = await registerTransaction(event, mockUser);
        expect(result.statusCode).toBe(400);
        const responseBody = JSON.parse(result.body!);
        expect(responseBody.error).toBe("Invalid payload");
    });

    it("should return 400 if amount is 0", async () => {
        event.body = JSON.stringify({
            amount: 0,
            description: "Some description",
        });

        const result = await registerTransaction(event, mockUser);
        expect(result.statusCode).toBe(400);
        const responseBody = JSON.parse(result.body!);
        expect(responseBody.error).toBe("Invalid payload");
    });
});