"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const node_assert_1 = __importDefault(require("node:assert"));
const logger_1 = require("../src/logger");
(0, node_test_1.default)("ConsoleLogger info calls console.info", (t) => {
    let called = false;
    const original = console.info;
    console.info = () => {
        called = true;
    };
    const logger = new logger_1.ConsoleLogger({ serviceName: "test-service" });
    logger.info("hello", { user: "abc" });
    node_assert_1.default.equal(called, true);
    console.info = original;
});
(0, node_test_1.default)("ConsoleLogger error calls console.error", () => {
    let called = false;
    const original = console.error;
    console.error = () => {
        called = true;
    };
    const logger = new logger_1.ConsoleLogger();
    logger.error("fail");
    node_assert_1.default.equal(called, true);
    console.error = original;
});
(0, node_test_1.default)("ConsoleLogger record contains expected fields", () => {
    let output = "";
    const original = console.info;
    console.info = (msg) => {
        output = msg;
    };
    const logger = new logger_1.ConsoleLogger({ serviceName: "svc" });
    logger.info("login", { userId: "u1" });
    const parsed = JSON.parse(output);
    node_assert_1.default.equal(parsed.message, "login");
    node_assert_1.default.equal(parsed.level, "info");
    node_assert_1.default.equal(parsed.service, "svc");
    node_assert_1.default.ok(parsed.timestamp);
    node_assert_1.default.equal(parsed.data.userId, "u1");
    console.info = original;
});
(0, node_test_1.default)("PinoLogger does not throw on info", () => {
    const logger = new logger_1.PinoLogger();
    node_assert_1.default.doesNotThrow(() => {
        logger.info("hello", { id: 1 });
    });
});
