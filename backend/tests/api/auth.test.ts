process.env.MASTER_WALLET_PRIVATE_KEY = "0x0123456789012345678901234567890123456789012345678901234567890123";
process.env.JWT_SECRET = "supersecretjwtsecretmustbe32characterslong!!!";

import request from "supertest";
import createApp from "../../src/app";
import { userRepository } from "../../src/repositories";

jest.mock("../../src/repositories", () => ({
    userRepository: {
        findByEmail: jest.fn(),
        createUser: jest.fn(),
    }
}));

describe("Authentication API Endpoint Tests", () => {
    let app: any;

    beforeAll(async () => {
        app = await createApp();
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should fail registration with invalid input schema", async () => {
        const response = await request(app)
            .post("/api/auth/register")
            .send({
                email: "not-an-email",
                password: "123"
            });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should register a user with correct parameters", async () => {
        (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);
        (userRepository.createUser as jest.Mock).mockResolvedValue({
            id: "user-123",
            email: "test@example.com",
            createdAt: new Date(),
        });

        const response = await request(app)
            .post("/api/auth/register")
            .send({
                email: "test@example.com",
                password: "SecurePassword123!"
            });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.token).toBeDefined();
    });
});
