const path = require("path");

// Check if node-windows is installed
let Service;
try {
	// First try to load from the project's node_modules
	Service = require("node-windows").Service;
} catch (error) {
	console.error("Error: Could not load node-windows.");
	console.log("Please run: npm install");
	console.log("in the project root directory before running this script.");
	process.exit(1);
}

// Get the absolute path to the server script
const scriptPath = path.join(__dirname, "..", "server", "index.js");
const workingDirectory = path.join(__dirname, "..");

// Create a new service object
const svc = new Service({
	name: "WizLightControl",
	description: "WizLight Control Service for smart lighting control",
	script: scriptPath,
	workingDirectory: workingDirectory,
	wait: 2, // Wait time in seconds before SIGKILLing the app
	grow: 0.5, // Allow service to restart if memory increases by 50%
	nodeOptions: [],
});

// Listen for install/uninstall events
svc.on("install", () => {
	console.log("WizLight Control service installed");
	console.log("Starting service...");
	svc.start();
});

svc.on("uninstall", () => {
	console.log("WizLight Control service uninstalled");
});

svc.on("start", () => {
	console.log("WizLight Control service started");
	console.log("Service will gracefully shut down on Windows shutdown");
});

svc.on("stop", () => {
	console.log("WizLight Control service stopped");
});

svc.on("error", (err) => {
	console.error("Service error:", err);
});

// Check command line arguments
const args = process.argv.slice(2);
if (args.length > 0) {
	const command = args[0].toLowerCase();

	if (command === "install") {
		console.log("Installing WizLight Control service...");
		svc.install();
	} else if (command === "uninstall") {
		console.log("Uninstalling WizLight Control service...");
		svc.uninstall();
	} else if (command === "start") {
		console.log("Starting WizLight Control service...");
		svc.start();
	} else if (command === "stop") {
		console.log("Stopping WizLight Control service...");
		svc.stop();
	} else if (command === "restart") {
		console.log("Restarting WizLight Control service...");
		svc.restart();
	} else {
		console.log(
			"Invalid command. Use: install, uninstall, start, stop, or restart"
		);
	}
} else {
	console.log("WizLight Control Service Manager");
	console.log("Usage: node wiz-service.js [command]");
	console.log("Commands:");
	console.log("  install  - Install the service");
	console.log("  uninstall - Remove the service");
	console.log("  start    - Start the service");
	console.log("  stop     - Stop the service");
	console.log("  restart  - Restart the service");
}
