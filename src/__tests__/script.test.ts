import fs from "fs";
import path from "path";
import { select } from "@inquirer/prompts";

// Mock dependencies
jest.mock("fs");
jest.mock("path");
jest.mock("chalk", () => ({
  red: jest.fn((text) => text),
  blue: jest.fn((text) => text),
  green: jest.fn((text) => text),
  yellow: jest.fn((text) => text),
  cyan: { bold: jest.fn((text) => text) },
  gray: jest.fn((text) => text),
  magenta: jest.fn((text) => text),
}));
jest.mock("@inquirer/prompts", () => ({
  select: jest.fn(),
}));

// Import the code to test
import * as script from "../index";

describe("CLI Script Tests", () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let exitSpy: jest.SpyInstance;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    exitSpy = jest.spyOn(process, "exit").mockImplementation(jest.fn() as any);

    // Setup default mock return values - ensure this always returns an array
    (fs.readdirSync as jest.Mock).mockReturnValue([]);
    (fs.statSync as jest.Mock).mockReturnValue({ isDirectory: () => false });
    (fs.readFileSync as jest.Mock).mockReturnValue("");
    (path.extname as jest.Mock).mockReturnValue(".js");
    (path.join as jest.Mock).mockImplementation((...args) => args.join("/"));
    process.cwd = jest.fn().mockReturnValue("/mock/directory");
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    exitSpy.mockRestore();
  });

  describe("parseFlags", () => {
    it("should parse --typescript flag correctly", () => {
      process.argv = ["node", "script.js", "--typescript"];
      const result = script.parseFlags();
      expect(result).toBe("TypeScript");
    });

    it("should parse --javascript flag correctly", () => {
      process.argv = ["node", "script.js", "--javascript"];
      const result = script.parseFlags();
      expect(result).toBe("JavaScript");
    });

    it("should parse --python flag correctly", () => {
      process.argv = ["node", "script.js", "--python"];
      const result = script.parseFlags();
      expect(result).toBe("Python");
    });

    it("should parse --all flag correctly", () => {
      process.argv = ["node", "script.js", "--all"];
      const result = script.parseFlags();
      expect(result).toBe("All");
    });

    it("should return null when no flags are provided", () => {
      process.argv = ["node", "script.js"];
      const result = script.parseFlags();
      expect(result).toBeNull();
    });

    it("should exit with error for unknown flags", () => {
      process.argv = ["node", "script.js", "--unknown"];
      script.parseFlags();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Unknown flag")
      );
      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe("getAllFiles", () => {
    it("should recursively gather files ignoring node_modules", () => {
      (fs.readdirSync as jest.Mock).mockImplementation((dir) => {
        if (dir === "/mock/directory") {
          return ["file1.js", "node_modules", ".git", "subfolder"];
        } else if (dir === "/mock/directory/subfolder") {
          return ["file2.js", "file3.py"];
        }
        return [];
      });

      (fs.statSync as jest.Mock).mockImplementation((path) => ({
        isDirectory: () =>
          path.includes("subfolder") ||
          path.includes("node_modules") ||
          path.includes(".git"),
      }));

      const files = script.getAllFiles("/mock/directory");
      expect(files).toEqual([
        "/mock/directory/file1.js",
        "/mock/directory/subfolder/file2.js",
        "/mock/directory/subfolder/file3.py",
      ]);
      // Verify node_modules and .git were skipped
      expect(files.find((f) => f.includes("node_modules"))).toBeUndefined();
      expect(files.find((f) => f.includes(".git"))).toBeUndefined();
    });
  });

  describe("countLines", () => {
    it("should count lines in JavaScript files ignoring comments", () => {
      const jsContent = `
// This is a comment
const a = 1;
/* 
Multi-line comment
that should be ignored
*/
const b = 2;
// Another comment
      `;

      (fs.readFileSync as jest.Mock).mockReturnValue(jsContent);

      const count = script.countLines("file.js", ".js");
      // Should count 6 lines (empty lines + non-comment code lines)
      expect(count).toBe(6);
    });

    it("should count lines in Python files ignoring comments", () => {
      const pythonContent = `
# This is a comment
def function():
    print("Hello")
# Another comment
    return 42
      `;

      (fs.readFileSync as jest.Mock).mockReturnValue(pythonContent);

      const count = script.countLines("file.py", ".py");
      // Should count 5 lines (empty lines + non-comment code lines)
      expect(count).toBe(5);
    });
  });

  describe("performCount", () => {
    beforeEach(() => {
      // Add specific mock setup for each test in this describe block
      (fs.readdirSync as jest.Mock).mockReturnValue(["file1.js"]);
    });

    it("should count lines for specific extensions", () => {
      // Mock files in the directory - already setup in beforeEach
      (fs.readdirSync as jest.Mock).mockReturnValue([
        "file1.js",
        "file2.py",
        "file3.ts",
      ]);

      // Mock file contents
      (fs.readFileSync as jest.Mock).mockImplementation((file) => {
        if (file.includes("file1.js")) return "line1\nline2\nline3";
        if (file.includes("file2.py")) return "line1\nline2";
        if (file.includes("file3.ts")) return "line1\nline2\nline3\nline4";
        return "";
      });

      // Only count JS files
      (path.extname as jest.Mock).mockImplementation((file) => {
        if (file.includes("file1")) return ".js";
        if (file.includes("file2")) return ".py";
        if (file.includes("file3")) return ".ts";
        return "";
      });

      script.performCount([".js", ".ts"]);

      // Check that console output shows correct counts
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Files scanned: 2")
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Total lines of code: 7")
      );
    });

    it("should count all files when extensions is null", () => {
      // Similar setup to previous test
      (fs.readdirSync as jest.Mock).mockReturnValue(["file1.js", "file2.py"]);
      (fs.statSync as jest.Mock).mockReturnValue({ isDirectory: () => false });

      (fs.readFileSync as jest.Mock).mockImplementation((file) => {
        if (file.includes("file1.js")) return "line1\nline2";
        if (file.includes("file2.py")) return "line1\nline2\nline3";
        return "";
      });

      (path.extname as jest.Mock).mockImplementation((file) => {
        if (file.includes("file1")) return ".js";
        if (file.includes("file2")) return ".py";
        return "";
      });

      script.performCount(null);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Files scanned: 2")
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Total lines of code: 5")
      );
    });

    it("should handle errors when reading files", () => {
      (fs.readdirSync as jest.Mock).mockReturnValue(["file1.js", "file2.js"]);
      (fs.statSync as jest.Mock).mockReturnValue({ isDirectory: () => false });
      (path.extname as jest.Mock).mockReturnValue(".js");

      // Mock readFileSync to throw error for file2.js
      (fs.readFileSync as jest.Mock).mockImplementation((file) => {
        if (file.includes("file2")) throw new Error("Cannot read file");
        return "line1\nline2";
      });

      script.performCount([".js"]);

      // Should only count the first file
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Files scanned: 1")
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Total lines of code: 2")
      );
    });
  });

  describe("interactiveFlow", () => {
    it("should prompt user and perform count based on selection", async () => {
      (select as jest.Mock).mockResolvedValue("JavaScript");

      await script.interactiveFlow();

      expect(select).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("Select a language"),
          choices: ["All", "TypeScript", "JavaScript", "Python"],
        })
      );

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Counting JavaScript files")
      );
    });
  });

  describe("main function", () => {
    beforeEach(() => {
      // Mock interactiveFlow to prevent it from being called directly
      jest.spyOn(script, "interactiveFlow").mockImplementation(jest.fn());
      jest.spyOn(script, "performCount").mockImplementation(jest.fn());
    });

    it("should use flag language if provided", async () => {
      // Mock parseFlags to return a language
      jest.spyOn(script, "parseFlags").mockReturnValue("Python");

      await script.main();

      expect(script.performCount).toHaveBeenCalledWith([".py"]);
      expect(script.interactiveFlow).not.toHaveBeenCalled();
    });

    it("should fall back to interactive flow if no flags", async () => {
      jest.spyOn(script, "parseFlags").mockReturnValue(null);
      jest.spyOn(script, "interactiveFlow").mockImplementation(jest.fn());

      await script.main();

      expect(script.interactiveFlow).toHaveBeenCalled();
    });

    it("should handle errors gracefully", async () => {
      jest.spyOn(script, "parseFlags").mockImplementation(() => {
        throw new Error("Test error");
      });

      await script.main();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Error:"),
        expect.any(Error)
      );
      expect(exitSpy).toHaveBeenCalledWith(1);
    });
  });
});
